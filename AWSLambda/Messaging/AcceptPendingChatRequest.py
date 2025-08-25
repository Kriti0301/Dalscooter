import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = "PendingChatRequests"

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))

        trip_id = body.get("trip_id")
        created_at = body.get("created_at") 
        franchise_id = body.get("franchise_id")

        if not trip_id or not franchise_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing trip_id or franchise_id"})
            }

        table = dynamodb.Table(TABLE_NAME)

        # Update the record
        response = table.update_item(
            Key={"trip_id": trip_id,
                "created_at": created_at
            },
            UpdateExpression="SET #s = :s, assigned_franchise_id = :f, accepted_at = :t",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": "accepted",
                ":f": franchise_id,
                ":t": datetime.utcnow().isoformat()
            },
            ReturnValues="UPDATED_NEW"
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Chat request accepted", "updated": response.get("Attributes")})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
