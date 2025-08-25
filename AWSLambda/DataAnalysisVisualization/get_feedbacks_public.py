import json
import boto3
from boto3.dynamodb.conditions import Attr
from decimal import Decimal
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
FEEDBACKS_TABLE = dynamodb.Table('Feedbacks')

def lambda_handler(event, context):
    # Get public feedbacks Lambda function for guest users
    # Supports query parameters: scooter_type, sentiment, rating, limit
    # No authorization required - returns limited data for privacy
    
    try:
        # Extract query parameters
        query_params = event.get('queryStringParameters') or {}
        
        scooter_type_filter = query_params.get('scooter_type')
        sentiment_filter = query_params.get('sentiment')
        rating_filter = query_params.get('rating')
        limit = int(query_params.get('limit', 20))  # Default limit of 20 for guests
        
        # Validate limit (lower limit for guests)
        if limit > 50:
            limit = 50  # Maximum limit of 50 for guests
        
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
        
        # Perform scan
        response = FEEDBACKS_TABLE.scan(**scan_params)
        
        # Process items - remove sensitive data for guest users
        items = response.get('Items', [])
        processed_items = []
        
        for item in items:
            # Only include non-sensitive data for guest users
            processed_item = {
                'scooter_type': item['scooter_type'],
                'rating': int(item['rating']),
                'comment': item['comment'],
                'sentiment': item['sentiment'],
                'created_date': extract_date_only(item['created_at']),  # Date only, no timestamp
                'sentiment_indicator': get_sentiment_indicator(item['sentiment'])  # User-friendly indicator
            }
            processed_items.append(processed_item)
        
        # Sort by created_date (most recent first) but limit to date granularity
        processed_items.sort(key=lambda x: x['created_date'], reverse=True)
        
        # Calculate some basic statistics for guests
        statistics = calculate_public_statistics(processed_items)
        
        # Prepare response
        response_data = {
            'feedbacks': processed_items,
            'count': len(processed_items),
            'statistics': statistics,
            'filters_applied': {
                'scooter_type': scooter_type_filter,
                'sentiment': sentiment_filter,
                'rating': rating_filter
            },
            'message': 'Public feedback data - limited information for privacy'
        }
        
        logger.info(f"Retrieved {len(processed_items)} public feedbacks for guest user")
        
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error retrieving public feedbacks: {str(e)}")
        return create_response(500, {'error': 'Unable to retrieve feedback data'})

def extract_date_only(created_at_timestamp):
    # Extract just the date from timestamp for privacy
    try:
        # Parse the ISO timestamp and return only the date part
        dt = datetime.fromisoformat(created_at_timestamp.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')
    except:
        return 'Unknown'

def get_sentiment_indicator(sentiment):
    # Convert sentiment to user-friendly indicator
    indicators = {
        'positive': '😊 Positive',
        'negative': '😞 Negative', 
        'neutral': '😐 Neutral',
        'mixed': '🤔 Mixed'
    }
    return indicators.get(sentiment, '😐 Neutral')

def calculate_public_statistics(feedbacks):
    # Calculate basic statistics for public display
    if not feedbacks:
        return {
            'total_feedbacks': 0,
            'average_rating': 0,
            'sentiment_breakdown': {}
        }
    
    # Calculate average rating
    ratings = [f['rating'] for f in feedbacks]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    
    # Calculate sentiment breakdown
    sentiments = [f['sentiment'] for f in feedbacks]
    sentiment_counts = {}
    for sentiment in ['positive', 'negative', 'neutral', 'mixed']:
        count = sentiments.count(sentiment)
        sentiment_counts[sentiment] = {
            'count': count,
            'percentage': round((count / len(feedbacks)) * 100, 1) if feedbacks else 0
        }
    
    # Calculate scooter type breakdown
    scooter_types = [f['scooter_type'] for f in feedbacks]
    scooter_type_counts = {}
    for scooter_type in ['gyroscooter', 'eBike', 'segway']:
        count = scooter_types.count(scooter_type)
        if count > 0:
            type_feedbacks = [f for f in feedbacks if f['scooter_type'] == scooter_type]
            type_ratings = [f['rating'] for f in type_feedbacks]
            avg_type_rating = round(sum(type_ratings) / len(type_ratings), 1) if type_ratings else 0
            
            scooter_type_counts[scooter_type] = {
                'count': count,
                'average_rating': avg_type_rating,
                'percentage': round((count / len(feedbacks)) * 100, 1)
            }
    
    return {
        'total_feedbacks': len(feedbacks),
        'average_rating': avg_rating,
        'sentiment_breakdown': sentiment_counts,
        'scooter_type_breakdown': scooter_type_counts,
        'rating_distribution': calculate_rating_distribution(ratings)
    }

def calculate_rating_distribution(ratings):
    # Calculate distribution of ratings
    distribution = {}
    for rating in range(1, 6):
        count = ratings.count(rating)
        distribution[str(rating)] = {
            'count': count,
            'percentage': round((count / len(ratings)) * 100, 1) if ratings else 0
        }
    return distribution

def create_response(status_code, body):
    # Create standardized API response with CORS for public access
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Allow from any origin for public access
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'public, max-age=300'  # Cache for 5 minutes
        },
        'body': json.dumps(body, default=str)
    }