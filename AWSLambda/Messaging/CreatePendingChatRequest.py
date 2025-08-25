import json
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('PendingChatRequests')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        print("Incoming Body:", body)

        trip_id = body.get('trip_id')
        customer_id = body.get('customer_id')
        customer_name = body.get('customer_name')
        message = body.get('message')

        if not trip_id or not customer_id or not message:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing required fields"})
            }

        # 🔍 Use query to check if any record exists for this trip_id
        response = table.query(
            KeyConditionExpression=Key('trip_id').eq(trip_id)
        )

        if response['Count'] > 0:
            print(f"Trip ID {trip_id} already exists")
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Trip ID already exists. Not saving again."})
            }

        # Save new entry
        item = {
            "trip_id": trip_id,
            "created_at": datetime.utcnow().isoformat(),  # sort key
            "status": "pending",
            "customer_id": customer_id,
            "customer_name": customer_name,
            "message_preview": message[:100]
        }

        table.put_item(Item=item)

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Pending chat request saved successfully."})
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
