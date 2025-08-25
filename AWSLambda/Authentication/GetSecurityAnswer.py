import json
import boto3
import os

# Get region from environment variable or default
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize DynamoDB resource with region
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

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
            'body': json.dumps({'securityAnswer': response['Item']['securityAnswer']})
        }

    except Exception as e:
        print(f"Error retrieving user: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Could not retrieve user'})
        }
