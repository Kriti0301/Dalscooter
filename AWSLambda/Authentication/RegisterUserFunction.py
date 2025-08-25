import json
import boto3

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

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
    name = body.get('name')
    role = body.get('role')
    securityAnswer = body.get('securityAnswer')
    shiftKey = body.get('shiftKey')

    # Check for missing fields and report exactly what's missing
    missing_fields = [key for key in ['email', 'name', 'role', 'securityAnswer', 'shiftKey'] if not body.get(key)]
    if missing_fields:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f"Missing required fields: {', '.join(missing_fields)}"})
        }


    # Prepare item for DynamoDB
    table = dynamodb.Table('Users')
    item = {
        'email': email,
        'name': name,
        'role': role,
        'securityAnswer': securityAnswer,
        'shiftKey': shiftKey
    }

    try:
        # Insert into DynamoDB
        table.put_item(Item=item)

        # Send welcome message via SNS
        role_text = 'Customer' if str(role) == '0' else 'Franchise'
        message = {
            'to': email,
            'subject': 'Welcome to Dal scooter!',
            'body': f'Hi {name}, welcome to Dal scooter! Your role is {role_text}.'
        }

        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:395708543071:userNotification',
            Message=json.dumps(message)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'User registered successfully and notification sent.'
            })
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Could not register user or send notification'
            })
        }
