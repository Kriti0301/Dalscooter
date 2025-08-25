import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('TripMessages')

def lambda_handler(event, context):
    trip_id = event['pathParameters']['trip_id']
    
    try:
        response = table.query(
            KeyConditionExpression=Key('trip_id').eq(trip_id),
            ScanIndexForward=True  # ascending by timestamp
        )
        
        messages = response.get('Items', [])
        return {
            'statusCode': 200,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps(messages)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({ 'error': str(e) })
        }
