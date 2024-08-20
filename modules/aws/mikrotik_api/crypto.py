import os
import time
from datetime import datetime, timedelta
import ipaddress
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import Encoding, load_pem_private_key
from cryptography.x509.oid import ExtendedKeyUsageOID
from librouteros import connect
import string
import random
import json

# Function to generate CSR on MikroTik
def generate_csr(api, cert_name, common_name):
    cert = api.path('certificate')
    try:
        cert('find', **{'name': f'{cert_name}-request'})
        existing_cert = list(cert) if cert is not None else []
        if existing_cert:
            api.path('certificate').remove(existing_cert[0]['.id'])
    except Exception as e:
        print(f"Error removing existing request: {e}")

    # Add a new certificate request
    api.path('certificate').add(**{'name': f'{cert_name}-request', 'common-name': common_name, 'key-usage': 'digital-signature,key-encipherment'})
    cert('find', **{'name': f'{cert_name}-request'})
    new_cert = list(cert) if cert is not None else []

    tuple(cert('create-certificate-request', **{
        'template': f'{cert_name}-request',
        'key-passphrase': 'frR4%88fufa'
    }))

    timeout = 20  # Timeout in seconds
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            csr_file = next(f for f in api.path('file') if f['name'] == 'certificate-request.pem')
            break
        except StopIteration:
            print("Waiting for CSR file to be generated...")
            time.sleep(1)  # Polling interval
    else:
        raise TimeoutError("CSR generation timed out")

    # Fetch the CSR content
    csr_file_name = f'certificate-request.pem'
    csr_file = next(f for f in api.path('file') if f['name'] == csr_file_name)
    return csr_file['contents']


# Function to sign the CSR
def sign_csr(csr_pem, ca_private_key_pem, ca_cert_pem, ca_key_password, host, hostname):
    # Load the CA private key
    ca_private_key = load_pem_private_key(ca_private_key_pem.encode('utf-8'), ca_key_password.encode('utf-8'))
    # Load the CA certificate
    ca_cert = x509.load_pem_x509_certificate(ca_cert_pem.encode('utf-8'))
    # Load the CSR
    csr = x509.load_pem_x509_csr(csr_pem.encode('utf-8'))

    san_list = [
        x509.DNSName(hostname),
        x509.DNSName(f"{hostname}.nms.blacksaltit.com.au"),
        x509.IPAddress(ipaddress.IPv4Address(host))
    ]

    # Sign the CSR
    signed_cert = (x509.CertificateBuilder(
        subject_name=csr.subject,
        issuer_name=ca_cert.subject,
        public_key=csr.public_key(),
        serial_number=x509.random_serial_number(),
        not_valid_before=datetime.now(),
        not_valid_after=datetime.now() + timedelta(days=1095)

    ).add_extension(
        x509.KeyUsage(
            digital_signature=True,
            content_commitment=True,
            key_encipherment=True,
            data_encipherment=True,
            key_agreement=False,
            key_cert_sign=False,
            crl_sign=False,
            encipher_only=False,
            decipher_only=False,
        ),
        critical=True
    ).add_extension(
        x509.ExtendedKeyUsage([
            ExtendedKeyUsageOID.SERVER_AUTH,
            ExtendedKeyUsageOID.CLIENT_AUTH,
        ]),
        critical=True,
    ).add_extension(
        x509.SubjectAlternativeName(san_list),
        critical=False,
    ).sign(private_key=ca_private_key, algorithm=hashes.SHA256()))
    cert_string = signed_cert.public_bytes(Encoding.PEM).decode('utf-8')
    return cert_string


def count_certificates(api):
    certificates = list(api.path('certificate'))
    return len(certificates)


# Function to upload and install the signed certificate on MikroTik
def upload_certificate(api, cert_name, signed_cert_pem):
    # Save the signed certificate to a temporary file on MikroTik
    file_name = f'{cert_name}.crt'
    api.path('file').add(**{'name': f'{cert_name}.crt', 'contents': signed_cert_pem})
    cert_len = count_certificates(api)
    # Upload the signed certificate to MikroTik
    cert = api.path('certificate')

    tuple(cert('import', **{'file-name': file_name}))
    tuple(cert('import', **{'file-name': 'certificate-request_key', 'passphrase': 'frR4%88fufa'}))

    timeout = 10
    polling_interval = 1
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            new_len = count_certificates(api)
            print(f'{new_len} > {cert_len} : {new_len > cert_len}')
            if new_len > cert_len:
                break
        except StopIteration:
            print("Waiting for certificate to be fully imported...")
            time.sleep(polling_interval)
    else:
        raise TimeoutError("Certificate import timed out")

    # Assign the certificate to the API-SSL and WWW-SSL service
    tuple(api.path('ip', 'service')('set', **{
        'numbers': 'api-ssl',
        'certificate': cert_name,
        'disabled': False
    }))

    tuple(api.path('ip', 'service')('set', **{
        'numbers': 'www-ssl',
        'certificate': cert_name,
        'disabled': False
    }))


# Function to create a new user and add the RSA key
def add_backup_user(api):
    # Add new user
    users = list(api.path('user'))
    if any(user['name'] == 'backup' for user in users):
        print("User 'backup' already exists")
    else:
        api.path('user').add(name='backup', group='full', password=generate_password(24))

    ssh_keys = list(api.path('user', 'ssh-keys'))
    if any(key['user'] == 'backup' and 'OxidizedBackup' in key['key-owner'] for key in ssh_keys):
        print("SSH key with key owner 'OxidizedBackup' already exists for user 'backup'")
        return

    file_name = 'id_rsa.pub'
    # Get RSA public key from environment variable
    rsa_key = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCsmDyZ7VGn1AEhVY3QoJMWb1sgsxeCZje4G5sC1hYZyi3GKL/cT7ja7ccvxQ6JkHHKvKhlIXFjhAiujC0xN6T/h8myeIgXgXISxNqJZSjZz/BRbuRcLwJ7pRMkSa5JRU00cF6L+5sLpaU7HWVNdpvpVojdX8jEkgEr6h39ufqjx2TeuaanL/QpDAimaubHI1osR3e14u22In2IurfZkkAiP82uK8/AH33mMfUMr+GeGB+Ip2aQAQSC5y1K6olDmY1d374iIfZYtG8uLPPlIgvN76qfgGc7tL1VdJHCmoyEgI+DVz/iAzXW2tCIpx896n+8L+b5mnabCTIO+YDeba0NmDxKIH2ipBhxqOe8JTtNqZYKdViubUxdiz2A9coOS/vq9mD4sdR/jReo3cY2AYjJbdn3y4QArA+T5f8+zPRwjpuW8+JXNGt1RE9xDSe23TFcRWRg+px0K+qeKSUoWPsCxduPnhQAtx8ewKXFoeYWWvCwRTjE4feCqYlAA6EG+dcAxksfQm4rtPqoCSC4kzBjUyQmx/oMJg0NJ1tKE9WOI5+z/43+DOUP7Nz3/CV9IBe875Ad0nP8+oTjxfJWjSCm4uz/Bhhsw51e/nHq3mWiNwKd/emGEkc7UgT4+BCxdFbhRw2AryPfBWw+wPXedkjGzJtXBaRz8CSa0r4rLvOMwQ== OxidizedBackup'

    # Save the RSA public key to a file on MikroTik
    api.path('file').add(name=file_name, contents=rsa_key)

    timeout = 10  # Timeout in seconds
    polling_interval = 1  # Polling interval in seconds
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            # Check if the file exists
            file = next(f for f in api.path('file') if f['name'] == file_name)
            print(f"File {file_name} is ready for import")
            break
        except StopIteration:
            print("Waiting for public key file to be ready...")
            time.sleep(polling_interval)
    else:
        raise TimeoutError("Public key file was not ready in time")

    # Import the public key for the backup user
    ssh = api.path('user', 'ssh-keys')
    tuple(ssh('import', **{'user': 'backup', 'public-key-file': file_name}))


def generate_password(length=24):
    if length < 4:
        raise ValueError("Password length should be at least 4 characters to include all character types.")

    # Define the character pools
    upper = string.ascii_uppercase
    lower = string.ascii_lowercase
    digits = string.digits
    special = string.punctuation

    # Ensure the password contains at least one character from each pool
    password = [
        random.choice(upper),
        random.choice(lower),
        random.choice(digits),
        random.choice(special)
    ]

    # Fill the rest of the password length with random choices from all pools
    all_characters = upper + lower + digits + special
    password += random.choices(all_characters, k=length - 4)

    # Shuffle the list to ensure randomness
    random.shuffle(password)

    # Convert list to string and return
    return ''.join(password)


def connect_to_mikrotik(username, password, host, port=8728):
    return connect(
        username=username,
        password=password,
        host=host,
        port=port
    )



def load_ca_private_key_from_env():
    # Retrieve CA private key as a single-line string from environment variable
    ca_private_key_pem = os.getenv('CA_PRIVATE_KEY')
    # Replace `\n` with actual newlines to convert it back to PEM format
    ca_private_key_pem = ca_private_key_pem.replace('\\n', '\n')
    # Load the CA private key
    return ca_private_key_pem


def load_ca_cert_from_env():
    # Retrieve CA private key as a single-line string from environment variable
    ca_certificate_pem = os.getenv('CA_CERTIFICATE')

    # Replace `\n` with actual newlines to convert it back to PEM format
    ca_certificate_pem = ca_certificate_pem.replace('\\n', '\n')

    # Load the CA certificate key
    return ca_certificate_pem


def cleanup_files(api, cert_name):
    files_to_remove = [f'certificate-request.pem', f'{cert_name}.crt', f'certificate-request_key.pem']

    for file_name in files_to_remove:
        try:
            file = next(f for f in api.path('file') if f['name'] == file_name)
            api.path('file').remove(file_name)
        except StopIteration:
            print(f"File {file_name} not found or already removed.")

    cert = api.path('certificate')
    cert('find', **{'name': f'{cert_name}-request'})
    existing_cert = list(cert) if cert is not None else []
    if existing_cert:
        api.path('certificate').remove(existing_cert[0]['.id'])


def doit(host, hostname):
    username = os.environ['ROUTER_USER']
    password = os.environ['ROUTER_PASSWORD']
    print(host)
    print(hostname)
    api = connect_to_mikrotik(username, password, host)
    print('connected')
    cert_name = 'bsi'
    common_name = f'{hostname}.nms.blacksaltit.com.au'
    # Generate CSR on MikroTik
    csr_pem = generate_csr(api, cert_name, common_name)

    # Retrieve CA details from environment variables
    ca_private_key_pem = load_ca_private_key_from_env()
    ca_cert_pem = load_ca_cert_from_env()
    ca_key_password = os.getenv('CA_KEY_PASSWORD')
    # Sign the CSR
    signed_cert_pem = sign_csr(csr_pem, ca_private_key_pem, ca_cert_pem, ca_key_password, host, hostname)

    # Upload and install the signed certificate on MikroTik
    upload_certificate(api, cert_name, signed_cert_pem)

    cleanup_files(api, cert_name)

    add_backup_user(api);

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Certificate Updated Successfully'})
    }
