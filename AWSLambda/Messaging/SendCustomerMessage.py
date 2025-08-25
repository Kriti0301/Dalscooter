import json
import boto3
import time
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = "TripMessages"

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))

        trip_id = body.get("trip_id")
        sender_id = body.get("senderId")
        sender_type = body.get("senderType")  # should be either 'customer' or 'franchise'
        message = body.get("message")
        customer_name = body.get("customer_name")

        if not trip_id or not sender_id or not sender_type or not message:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing required fields"})
            }

        if sender_type not in ["customer", "franchise"]:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Invalid sender type"})
            }

        # Generate a unique message ID and timestamp
        message_id = str(uuid.uuid4())
        timestamp = str(int(time.time()))

        message_item = {
            "trip_id": trip_id,
            "timestamp": timestamp,  # sort key
            "message_id": message_id,
            "sender": sender_type,
            "message": message,
            "created_at": datetime.utcnow().isoformat()
        }

        # Dynamically set sender ID field
        if sender_type == "customer":
            message_item["customerId"] = sender_id
            if customer_name:
                message_item["customer_name"] = customer_name
        else:
            message_item["franchiseId"] = sender_id

        # Save to DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(Item=message_item)

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Message saved to DB."})
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
