import json
import boto3
from collections import Counter
from datetime import datetime, timedelta
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
TRIPS_TABLE = dynamodb.Table('Trips')

def lambda_handler(event, context):
    # Get trips analytics from Trips table
    
    try:
        # Scan all trips
        response = TRIPS_TABLE.scan()
        trips = response.get('Items', [])
        
        if not trips:
            return create_response(200, {
                'total_trips': 0,
                'total_revenue': 0,
                'trips_by_status': {},
                'average_trip_price': 0
            })
        
        # Calculate analytics
        total_trips = len(trips)
        
        # Trip status breakdown - FIXED: Handle missing status
        status_counts = {}
        for trip in trips:
            status = trip.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Revenue calculations - FIXED: Better error handling
        prices = []
        for trip in trips:
            if 'price' in trip and trip['price']:
                try:
                    if isinstance(trip['price'], Decimal):
                        prices.append(float(trip['price']))
                    else:
                        prices.append(float(trip['price']))
                except (ValueError, TypeError):
                    pass
        
        total_revenue = sum(prices)
        average_price = round(total_revenue / len(prices), 2) if prices else 0
        
        # Completed trips analysis
        completed_trips = [trip for trip in trips if trip.get('status') == 'completed']
        completed_revenue = 0
        for trip in completed_trips:
            if 'price' in trip and trip['price']:
                try:
                    if isinstance(trip['price'], Decimal):
                        completed_revenue += float(trip['price'])
                    else:
                        completed_revenue += float(trip['price'])
                except (ValueError, TypeError):
                    pass
        
        # Status distribution with percentages
        status_percentages = {}
        for status, count in status_counts.items():
            status_percentages[status] = {
                'count': count,
                'percentage': round((count / total_trips) * 100, 1) if total_trips > 0 else 0
            }
        
        # Price ranges
        if prices:
            price_ranges = {
                'under_5': len([p for p in prices if p < 5]),
                '5_to_20': len([p for p in prices if 5 <= p < 20]),
                '20_to_50': len([p for p in prices if 20 <= p < 50]),
                'over_50': len([p for p in prices if p >= 50])
            }
        else:
            price_ranges = {'under_5': 0, '5_to_20': 0, '20_to_50': 0, 'over_50': 0}
        
        # Popular scooters (by trip count) - FIXED: Handle empty case
        scooter_usage = {}
        for trip in trips:
            if 'scooter_id' in trip and trip['scooter_id']:
                scooter_id = trip['scooter_id']
                scooter_usage[scooter_id] = scooter_usage.get(scooter_id, 0) + 1
        
        # Get top 5 scooters - FIXED: Manual sorting instead of most_common()
        top_scooters = []
        if scooter_usage:
            sorted_scooters = sorted(scooter_usage.items(), key=lambda x: x[1], reverse=True)
            top_scooters = [
                {
                    'scooter_id': scooter_id[:8] + '...' if len(scooter_id) > 8 else scooter_id,
                    'trip_count': count
                }
                for scooter_id, count in sorted_scooters[:5]
            ]
        
        analytics_data = {
            'total_trips': total_trips,
            'total_revenue': round(total_revenue, 2),
            'average_trip_price': average_price,
            'trips_by_status': status_percentages,
            'revenue_breakdown': {
                'completed_trips_revenue': round(completed_revenue, 2),
                'pending_trips': total_trips - len(completed_trips),
                'completion_rate': round((len(completed_trips) / total_trips) * 100, 1) if total_trips > 0 else 0
            },
            'price_distribution': price_ranges,
            'top_scooters': top_scooters,
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        logger.info(f"Generated trip analytics for {total_trips} trips")
        response_data = {
            'analytics': analytics_data,
            'data': analytics_data
        }
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error generating trip analytics: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def create_response(status_code, body):
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