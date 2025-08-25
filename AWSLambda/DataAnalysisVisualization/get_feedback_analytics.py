import json
import boto3
from boto3.dynamodb.conditions import Attr
from collections import Counter
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
FEEDBACKS_TABLE = dynamodb.Table('Feedbacks')

def lambda_handler(event, context):
    # Get feedback analytics Lambda function
    # Returns aggregated statistics for dashboards
    
    try:
        # Scan all active feedbacks
        response = FEEDBACKS_TABLE.scan(
            FilterExpression=Attr('is_deleted').eq(False)
        )
        
        items = response.get('Items', [])
        
        if not items:
            return create_response(200, {
                'total_feedbacks': 0,
                'sentiment_distribution': {},
                'rating_distribution': {},
                'scooter_type_stats': {},
                'average_rating': 0,
                'average_sentiment_score': 0
            })
        
        # Calculate analytics
        analytics = calculate_analytics(items)
        
        logger.info(f"Generated analytics for {len(items)} feedbacks")
        
        response_data = {
            'analytics': analytics,
            'data': analytics
        }
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def calculate_analytics(feedbacks):
    # Calculate comprehensive feedback analytics
    total_feedbacks = len(feedbacks)
    
    # Extract data for analysis
    sentiments = [f['sentiment'] for f in feedbacks]
    ratings = [int(f['rating']) for f in feedbacks]
    scooter_types = [f['scooter_type'] for f in feedbacks]
    sentiment_scores = [float(f['sentiment_score']) for f in feedbacks]
    
    # Sentiment distribution
    sentiment_counts = Counter(sentiments)
    sentiment_distribution = {
        'positive': sentiment_counts.get('positive', 0),
        'negative': sentiment_counts.get('negative', 0),
        'neutral': sentiment_counts.get('neutral', 0),
        'mixed': sentiment_counts.get('mixed', 0)
    }
    
    # Convert to percentages
    sentiment_percentages = {}
    for sentiment, count in sentiment_distribution.items():
        sentiment_percentages[sentiment] = {
            'count': count,
            'percentage': round((count / total_feedbacks) * 100, 1) if total_feedbacks > 0 else 0
        }
    
    # Rating distribution
    rating_counts = Counter(ratings)
    rating_distribution = {}
    for i in range(1, 6):
        count = rating_counts.get(i, 0)
        rating_distribution[str(i)] = {
            'count': count,
            'percentage': round((count / total_feedbacks) * 100, 1) if total_feedbacks > 0 else 0
        }
    
    # Scooter type statistics
    scooter_type_stats = {}
    for scooter_type in ['gyroscooter', 'eBike', 'segway']:
        type_feedbacks = [f for f in feedbacks if f['scooter_type'] == scooter_type]
        type_count = len(type_feedbacks)
        
        if type_count > 0:
            type_ratings = [int(f['rating']) for f in type_feedbacks]
            type_sentiments = [f['sentiment'] for f in type_feedbacks]
            type_sentiment_counts = Counter(type_sentiments)
            
            scooter_type_stats[scooter_type] = {
                'total_feedbacks': type_count,
                'average_rating': round(sum(type_ratings) / len(type_ratings), 2),
                'sentiment_breakdown': {
                    'positive': type_sentiment_counts.get('positive', 0),
                    'negative': type_sentiment_counts.get('negative', 0),
                    'neutral': type_sentiment_counts.get('neutral', 0),
                    'mixed': type_sentiment_counts.get('mixed', 0)
                }
            }
        else:
            scooter_type_stats[scooter_type] = {
                'total_feedbacks': 0,
                'average_rating': 0,
                'sentiment_breakdown': {
                    'positive': 0,
                    'negative': 0,
                    'neutral': 0,
                    'mixed': 0
                }
            }
    
    # Overall statistics
    average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0
    average_sentiment_score = round(sum(sentiment_scores) / len(sentiment_scores), 3) if sentiment_scores else 0
    
    return {
        'total_feedbacks': total_feedbacks,
        'sentiment_distribution': sentiment_percentages,
        'rating_distribution': rating_distribution,
        'scooter_type_stats': scooter_type_stats,
        'average_rating': average_rating,
        'average_sentiment_score': average_sentiment_score,
        'summary': {
            'most_popular_scooter': max(scooter_type_stats.keys(), 
                                      key=lambda x: scooter_type_stats[x]['total_feedbacks']),
            'overall_sentiment': max(sentiment_distribution.keys(), key=sentiment_distribution.get),
            'satisfaction_rate': round((sentiment_counts.get('positive', 0) / total_feedbacks) * 100, 1) if total_feedbacks > 0 else 0
        }
    }

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
