import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
FEEDBACKS_TABLE = dynamodb.Table('Feedbacks')

def lambda_handler(event, context):
    # Get feedbacks Lambda function
    # Supports query parameters: scooter_type, sentiment, rating, limit, last_key
   
    try:
        # Extract query parameters
        query_params = event.get('queryStringParameters') or {}
        
        scooter_type_filter = query_params.get('scooter_type')
        sentiment_filter = query_params.get('sentiment')
        rating_filter = query_params.get('rating')
        limit = int(query_params.get('limit', 50))  # Default limit of 50
        last_key = query_params.get('last_key')
        
        # Validate limit
        if limit > 100:
            limit = 100  # Maximum limit of 100
        
        # Build scan parameters
        scan_params = {
            'FilterExpression': Attr('is_deleted').eq(False),
            'Limit': limit
        }
        
        # Add filters
        filter_expressions = [Attr('is_deleted').eq(False)]
        
        if scooter_type_filter:
            valid_types = ['gyroscooter', 'eBike', 'segway']
            if scooter_type_filter in valid_types:
                filter_expressions.append(Attr('scooter_type').eq(scooter_type_filter))
        
        if sentiment_filter:
            valid_sentiments = ['positive', 'negative', 'neutral', 'mixed']
            if sentiment_filter in valid_sentiments:
                filter_expressions.append(Attr('sentiment').eq(sentiment_filter))
        
        if rating_filter:
            try:
                rating_value = int(rating_filter)
                if 1 <= rating_value <= 5:
                    filter_expressions.append(Attr('rating').eq(rating_value))
            except ValueError:
                pass
        
        # Combine all filter expressions
        if len(filter_expressions) > 1:
            combined_filter = filter_expressions[0]
            for expr in filter_expressions[1:]:
                combined_filter = combined_filter & expr
            scan_params['FilterExpression'] = combined_filter
        
        # Handle pagination
        if last_key:
            try:
                scan_params['ExclusiveStartKey'] = json.loads(last_key)
            except (json.JSONDecodeError, TypeError):
                logger.warning("Invalid last_key parameter")
        
        # Perform scan
        response = FEEDBACKS_TABLE.scan(**scan_params)
        
        # Process items
        items = response.get('Items', [])
        processed_items = []
        
        for item in items:
            processed_item = {
                'feedback_id': item['feedback_id'],
                'user_id': item['user_id'],
                'trip_id': item['trip_id'],
                'scooter_type': item['scooter_type'],
                'rating': int(item['rating']),
                'comment': item['comment'],
                'sentiment': item['sentiment'],
                'sentiment_score': float(item['sentiment_score']),
                'created_at': item['created_at'],
                'updated_at': item['updated_at']
            }
            processed_items.append(processed_item)
        
        # Sort by created_at (most recent first)
        processed_items.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Prepare response
        response_data = {
            'feedbacks': processed_items,
            'count': len(processed_items),
            'total_scanned': response.get('ScannedCount', 0)
        }
        
        # Add pagination info
        if 'LastEvaluatedKey' in response:
            response_data['last_key'] = json.dumps(response['LastEvaluatedKey'], default=str)
            response_data['has_more'] = True
        else:
            response_data['has_more'] = False
        
        logger.info(f"Retrieved {len(processed_items)} feedbacks")
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error retrieving feedbacks: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def create_response(status_code, body):
    # Create standardized API response
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, default=str)
    }
