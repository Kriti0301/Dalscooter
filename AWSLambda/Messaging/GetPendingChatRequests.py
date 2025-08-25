import boto3
import json
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = "PendingChatRequests"

def lambda_handler(event, context):
    try:
        table = dynamodb.Table(TABLE_NAME)

        # Scan only items where status is 'pending'
        response = table.scan(
            FilterExpression=Attr("status").eq("pending")
        )

        items = response.get("Items", [])

        return {
            "statusCode": 200,
            "body": json.dumps(items)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
