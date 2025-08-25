import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def lambda_handler(event, context):
    # Parse JSON body safely
    try:
        body = json.loads(event.get('body', '{}'))
    except Exception as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    email = body.get('email')

    if not email:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Email is required'})
        }

    try:
        response = table.get_item(Key={'email': email})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'})
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'shiftKey': response['Item']['shiftKey']})
        }

    except Exception as e:
        print(f"Error retrieving user: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Could not retrieve user'})
        }
