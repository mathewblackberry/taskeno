import os
import json
import ssl
import logging
import requests
from requests.auth import HTTPBasicAuth
from librouteros import connect
from librouteros.login import plain, token, encode_password

logging.basicConfig(level=logging.DEBUG)


def connect_to_router():
    try:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        router_ip = os.environ['ROUTER_IP']
        router_user = os.environ['ROUTER_USER']
        router_password = os.environ['ROUTER_PASSWORD']
        api = connect(username=router_user, password=router_password, host=router_ip, login_method=plain, ssl=True, port=8729, ssl_context=ssl_context, ssl_verify=True)
        return api
    except KeyError as e:
        print(f"Environment variable {e} not set")
    except Exception as e:
        print(f"Failed to connect to the router: {e}")
    return None


def update_radius():
    api = connect_to_router()
    if not api:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Failed to connect to the router.'})
        }
    try:
        aaa = api.path('user', 'aaa')
        response = aaa('set', **{'use-radius': 'no'})

        converted_tuple = list(response) if response is not None else []

        return {
            'statusCode': 200,
            'body': json.dumps({'data': converted_tuple})
        }
    except KeyError as e:
        error_message = f"Key error: {e}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': error_message})
        }
    except ConnectionError as e:
        error_message = f"Connection error: {e}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': error_message})
        }
    except Exception as e:
        error_message = f"An unexpected error occurred: {e}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': error_message})
        }


def complete_get(path, cert, loopback):
    router_ip = loopback  # os.environ.get('ROUTER_IP')
    router_user = os.environ.get('ROUTER_USER')
    router_password = os.environ.get('ROUTER_PASSWORD')

    if not router_ip or not router_user or not router_password:
        return {'statusCode': 400, 'body': json.dumps({'message': 'Router credentials are not available'}), 'headers': {'Access-Control-Allow-Origin': '*'}}

    try:
        response = requests.get(
            f'https://{router_ip}/rest{path}',
            auth=HTTPBasicAuth(router_user, router_password),
            verify=cert,
            timeout=10
        )

        # Check for HTTP status errors
        response.raise_for_status()

        # Try to parse the JSON response
        data = response.json()

        return {
            'statusCode': 200,
            'body': json.dumps({'data': data}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }

    except requests.exceptions.HTTPError as e:
        error_message = f"HTTP error: {e.response.status_code} {e.response.reason}"
        print(error_message)
        return {
            'statusCode': e.response.status_code,
            'body': json.dumps({'message': error_message}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }

    except requests.exceptions.ConnectionError as e:
        error_message = f"Connection error: {str(e)}"
        print(error_message)
        return {
            'statusCode': 404,
            'body': json.dumps({'message': 'Could not connect to device'}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }

    except requests.exceptions.Timeout as e:
        error_message = f"Request timeout: {str(e)}"
        print(error_message)
        return {
            'statusCode': 504,
            'body': json.dumps({'message': error_message}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }

    except requests.exceptions.RequestException as e:
        error_message = f"Request exception: {str(e)}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': error_message}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }

    except ValueError as e:
        error_message = f"JSON decode error: {str(e)}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Failed to decode JSON response.'}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }

    except Exception as e:
        error_message = f"An unexpected error occurred: {str(e)}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({'message': error_message}), 'headers': {'Access-Control-Allow-Origin': '*'}
        }
