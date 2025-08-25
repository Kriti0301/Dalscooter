import boto3
import json
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = "PendingChatRequests"

def lambda_handler(event, context):
    try:
        table = dynamodb.Table(TABLE_NAME)
        franchise_id = event["queryStringParameters"].get("franchise_id")
        
        # Get all items
        response = table.scan()
        items = response.get("Items", [])
        
        # DEBUG: print all data
        print("All items:", items)
        print("Looking for franchise_id:", franchise_id)
        
        # Filter manually in Python
        filtered = [
            item for item in items
            if item.get("status") == "accepted" and item.get("assigned_franchise_id") == franchise_id
        ]
        
        return {
            "statusCode": 200,
            "body": json.dumps(filtered)
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
