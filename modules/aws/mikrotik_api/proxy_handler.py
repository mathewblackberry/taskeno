import json
import logging
import os
import tempfile
import atexit
import boto3
from boto3.dynamodb.conditions import Key

from mt_api_functions import update_radius, complete_get
from crypto import doit

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

DYNAMODB_TABLE = os.getenv('DYNAMODB_TABLE')


def get_ca_cert_from_env():
    ca_cert = os.getenv('CA_CERTIFICATE')
    if not ca_cert:
        raise ValueError("CA_CERTIFICATE environment variable not set")
    return ca_cert.replace('\\n', '\n')


ca_cert_content = get_ca_cert_from_env()
temp_ca_cert = tempfile.NamedTemporaryFile(delete=False)
temp_ca_cert.write(ca_cert_content.encode('utf-8'))
temp_ca_cert.flush()
temp_ca_cert_path = temp_ca_cert.name
temp_ca_cert.close()


def cleanup_temp_file():
    if os.path.exists(temp_ca_cert_path):
        os.remove(temp_ca_cert_path)


atexit.register(cleanup_temp_file)


def lambda_handler(event, context):
    print(temp_ca_cert_path)
    try:
        # Log the received event for debugging
        # logger.info("Received event: %s", json.dumps(event))

        # Extract the HTTP method and path
        http_method = event.get('httpMethod', '')
        proxy_path = event.get('pathParameters', {}).get('proxy', '')

        # Split the proxy path into components
        path_components = proxy_path.split('/')

        tenant_id = path_components[0] if len(path_components) > 0 else None
        site_id = path_components[2] if len(path_components) > 2 else None
        asset_id = path_components[4] if len(path_components) > 4 else None
        command = path_components[5] if len(path_components) > 5 else None

        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(DYNAMODB_TABLE)

        key = {'pk': f'SITE#{site_id}', 'sk': f'ASSET#{asset_id}'}
        try:
            # Query the table
            response = table.get_item(Key=key)
            print(response)
            print(site_id)
            print(asset_id)

            # Check if items are returned
            if 'Item' in response:
                item = response['Item']
                data = item.get('data', None)
                print(data.get('loopbacks'))
                loopbacks = data.get('loopbacks', [])
                hostname = data.get('hostname')
                if len(loopbacks) > 0:
                    loopback = loopbacks[0]
                else:
                    return {'statusCode': 404, 'body': json.dumps({'error': 'Item not found'}), 'headers': {'Access-Control-Allow-Origin': '*'}}
            else:
                response = {'statusCode': 404, 'body': json.dumps({'error': 'Item not found'}), 'headers': {'Access-Control-Allow-Origin': '*'}}
                return response

        except Exception as e:
            print('Exception 1')
            print(e)
            response = {'statusCode': 500, 'body': json.dumps({'error': str(e)}), 'headers': {'Access-Control-Allow-Origin': '*'}}
            return response

        # Route based on path and method
        if command == 'radius' and http_method == 'GET':
            response = update_radius()
        elif command == 'route_table' and http_method == 'GET':
            response = complete_get('/ip/route', temp_ca_cert_path, loopback)
        elif command == 'arp_table' and http_method == 'GET':
            response = complete_get('/ip/arp', temp_ca_cert_path, loopback)
        elif command == 'interface' and http_method == 'GET':
            response = complete_get('/interface', temp_ca_cert_path, loopback)
        elif command == 'ip_address' and http_method == 'GET':
            response = complete_get('/ip/address', temp_ca_cert_path, loopback)
        elif command == 'ip_firewall' and http_method == 'GET':
            response = complete_get('/ip/firewall/filter', temp_ca_cert_path, loopback)
        elif command == 'ip_firewall_address' and http_method == 'GET':
            response = complete_get('/ip/firewall/address-list', temp_ca_cert_path, loopback)
        elif command == 'csr' and http_method == 'PUT':
            print('Generating Certificate')
            response = doit(loopback, hostname)

        else:
            response = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not Found'})
            }

        response['headers'] = {'Access-Control-Allow-Origin': '*'}
        return response

    except Exception as e:
        logger.error("Error processing request: %s", e)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal Server Error'}),
            'headers': {'Access-Control-Allow-Origin': '*'}
        }
