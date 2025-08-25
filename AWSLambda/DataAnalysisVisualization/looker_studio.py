import json
import boto3
from datetime import datetime, timedelta
import logging
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    """
    Analytics Aggregator for Looker Studio Dashboard
    Combines all analytics data into a single endpoint optimized for visualization
    """
    
    try:
        # Verify request authorization (optional)
        if not verify_dashboard_access(event):
            return create_response(401, {'error': 'Unauthorized access'})
        
        # Collect all analytics data
        logger.info("Starting analytics aggregation for dashboard")
        
        analytics_data = {
            'users': get_user_analytics_summary(),
            'trips': get_trip_analytics_summary(), 
            'feedbacks': get_feedback_analytics_summary(),
            'scooters': get_scooter_analytics_summary(),
            'sessions': get_session_analytics_summary()
        }
        
        # Format for Looker Studio consumption
        dashboard_data = format_for_looker_studio(analytics_data)
        
        logger.info("Successfully aggregated analytics data for dashboard")
        return create_response(200, dashboard_data)
        
    except Exception as e:
        logger.error(f"Error in analytics aggregation: {str(e)}")
        return create_response(500, {'error': 'Failed to generate dashboard data'})

def verify_dashboard_access(event):
    """Verify request is authorized for dashboard access"""
    try:
        # Check for API key in headers
        headers = event.get('headers', {})
        api_key = headers.get('X-API-Key') or headers.get('x-api-key')
        
        # In production, compare with environment variable
        # For now, allow requests without API key for testing
        return True
        
    except Exception:
        return False

def get_user_analytics_summary():
    """Get user analytics summary"""
    try:
        users_table = dynamodb.Table('Users')
        sessions_table = dynamodb.Table('UserSessions')
        
        # Get all users
        users_response = users_table.scan()
        users = users_response.get('Items', [])
        
        # Get all sessions
        sessions_response = sessions_table.scan()
        sessions = sessions_response.get('Items', [])
        
        # Calculate metrics
        total_users = len(users)
        customers = len([u for u in users if int(u.get('role', 0)) == 0])
        franchises = len([u for u in users if int(u.get('role', 0)) == 1])
        
        # Active users (users with sessions)
        users_with_sessions = len(set([s.get('user_id') for s in sessions if s.get('user_id')]))
        
        return {
            'total_users': total_users,
            'customers': customers,
            'franchises': franchises,
            'active_users': users_with_sessions,
            'retention_rate': round((users_with_sessions / max(total_users, 1)) * 100, 1),
            'customer_franchise_ratio': round(customers / max(franchises, 1), 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {str(e)}")
        return {'total_users': 0, 'customers': 0, 'franchises': 0, 'active_users': 0}

def get_trip_analytics_summary():
    """Get trip analytics summary"""
    try:
        trips_table = dynamodb.Table('Trips')
        
        # Get all trips
        response = trips_table.scan()
        trips = response.get('Items', [])
        
        # Calculate metrics
        total_trips = len(trips)
        completed_trips = [t for t in trips if t.get('status') == 'completed']
        ongoing_trips = [t for t in trips if t.get('status') == 'ongoing']
        
        # Revenue calculations
        total_revenue = sum([float(t.get('price', 0)) for t in completed_trips if t.get('price')])
        avg_trip_price = round(total_revenue / max(len(completed_trips), 1), 2)
        
        # Completion rate
        completion_rate = round((len(completed_trips) / max(total_trips, 1)) * 100, 1)
        
        return {
            'total_trips': total_trips,
            'completed_trips': len(completed_trips),
            'ongoing_trips': len(ongoing_trips),
            'total_revenue': round(total_revenue, 2),
            'avg_trip_price': avg_trip_price,
            'completion_rate': completion_rate
        }
        
    except Exception as e:
        logger.error(f"Error getting trip analytics: {str(e)}")
        return {'total_trips': 0, 'total_revenue': 0, 'avg_trip_price': 0, 'completion_rate': 0}

def get_feedback_analytics_summary():
    """Get feedback analytics summary"""
    try:
        feedbacks_table = dynamodb.Table('Feedbacks')
        
        # Get all active feedbacks
        response = feedbacks_table.scan()
        feedbacks = [f for f in response.get('Items', []) if not f.get('is_deleted', False)]
        
        if not feedbacks:
            return {'total_feedbacks': 0, 'avg_rating': 0, 'satisfaction_rate': 0}
        
        # Calculate metrics
        total_feedbacks = len(feedbacks)
        ratings = [int(f.get('rating', 0)) for f in feedbacks]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0
        
        # Sentiment analysis
        sentiments = [f.get('sentiment', 'neutral') for f in feedbacks]
        positive_count = sentiments.count('positive')
        satisfaction_rate = round((positive_count / len(sentiments)) * 100, 1)
        
        # Scooter type breakdown
        scooter_types = {}
        for feedback in feedbacks:
            scooter_type = feedback.get('scooter_type', 'unknown')
            if scooter_type not in scooter_types:
                scooter_types[scooter_type] = {'count': 0, 'total_rating': 0}
            scooter_types[scooter_type]['count'] += 1
            scooter_types[scooter_type]['total_rating'] += int(feedback.get('rating', 0))
        
        # Calculate average ratings by scooter type
        for scooter_type in scooter_types:
            scooter_types[scooter_type]['avg_rating'] = round(
                scooter_types[scooter_type]['total_rating'] / scooter_types[scooter_type]['count'], 2
            )
        
        return {
            'total_feedbacks': total_feedbacks,
            'avg_rating': avg_rating,
            'satisfaction_rate': satisfaction_rate,
            'scooter_performance': scooter_types,
            'sentiment_distribution': {
                'positive': sentiments.count('positive'),
                'negative': sentiments.count('negative'),
                'neutral': sentiments.count('neutral'),
                'mixed': sentiments.count('mixed')
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting feedback analytics: {str(e)}")
        return {'total_feedbacks': 0, 'avg_rating': 0, 'satisfaction_rate': 0}

def get_scooter_analytics_summary():
    """Get scooter analytics summary"""
    try:
        scooters_table = dynamodb.Table('Scooters')
        
        # Get all scooters
        response = scooters_table.scan()
        scooters = response.get('Items', [])
        
        # Calculate metrics
        total_scooters = len(scooters)
        available_scooters = len([s for s in scooters if s.get('status') == 'available'])
        in_use_scooters = len([s for s in scooters if s.get('status') == 'in_use'])
        maintenance_scooters = len([s for s in scooters if s.get('status') == 'maintenance'])
        
        # Fleet utilization rate
        utilization_rate = round((in_use_scooters / max(total_scooters, 1)) * 100, 1)
        availability_rate = round((available_scooters / max(total_scooters, 1)) * 100, 1)
        
        # Battery analysis (if available in metadata)
        battery_levels = []
        for scooter in scooters:
            metadata = scooter.get('metadata', '')
            if 'battery' in metadata:
                try:
                    # Extract battery level from metadata string
                    import re
                    battery_match = re.search(r'"battery":\{"N":"(\d+)"\}', metadata)
                    if battery_match:
                        battery_levels.append(int(battery_match.group(1)))
                except:
                    pass
        
        avg_battery = round(sum(battery_levels) / len(battery_levels), 1) if battery_levels else 0
        low_battery_count = len([b for b in battery_levels if b < 30])
        
        return {
            'total_scooters': total_scooters,
            'available_scooters': available_scooters,
            'in_use_scooters': in_use_scooters,
            'maintenance_scooters': maintenance_scooters,
            'utilization_rate': utilization_rate,
            'availability_rate': availability_rate,
            'avg_battery_level': avg_battery,
            'low_battery_count': low_battery_count
        }
        
    except Exception as e:
        logger.error(f"Error getting scooter analytics: {str(e)}")
        return {'total_scooters': 0, 'available_scooters': 0, 'utilization_rate': 0}

def get_session_analytics_summary():
    """Get session analytics summary"""
    try:
        sessions_table = dynamodb.Table('UserSessions')
        
        # Get all sessions
        response = sessions_table.scan()
        sessions = response.get('Items', [])
        
        # Calculate metrics
        total_sessions = len(sessions)
        active_sessions = len([s for s in sessions if not s.get('logout_time')])
        
        # Session duration analysis
        durations = []
        for session in sessions:
            if session.get('session_duration'):
                try:
                    durations.append(int(session['session_duration']))
                except:
                    pass
        
        avg_session_duration = round(sum(durations) / len(durations), 2) if durations else 0
        
        # Today's activity
        today = datetime.utcnow().date()
        todays_sessions = 0
        for session in sessions:
            if session.get('login_time'):
                try:
                    login_date = datetime.fromisoformat(session['login_time'].replace('Z', '+00:00')).date()
                    if login_date == today:
                        todays_sessions += 1
                except:
                    pass
        
        return {
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'avg_session_duration': avg_session_duration,
            'todays_sessions': todays_sessions
        }
        
    except Exception as e:
        logger.error(f"Error getting session analytics: {str(e)}")
        return {'total_sessions': 0, 'active_sessions': 0, 'avg_session_duration': 0}

def format_for_looker_studio(analytics_data):
    """Format analytics data for Looker Studio consumption"""
    
    current_time = datetime.utcnow()
    
    # Create flattened data structure for Looker Studio
    dashboard_data = {
        'metadata': {
            'timestamp': current_time.isoformat() + 'Z',
            'date': current_time.strftime('%Y-%m-%d'),
            'last_updated': current_time.strftime('%Y-%m-%d %H:%M:%S UTC'),
            'data_freshness': 'real-time'
        },
        
        # Key Performance Indicators
        'kpis': {
            'total_users': analytics_data['users']['total_users'],
            'total_customers': analytics_data['users']['customers'],
            'total_franchises': analytics_data['users']['franchises'],
            'total_trips': analytics_data['trips']['total_trips'],
            'total_revenue': analytics_data['trips']['total_revenue'],
            'avg_trip_price': analytics_data['trips']['avg_trip_price'],
            'completion_rate': analytics_data['trips']['completion_rate'],
            'total_scooters': analytics_data['scooters']['total_scooters'],
            'available_scooters': analytics_data['scooters']['available_scooters'],
            'fleet_utilization': analytics_data['scooters']['utilization_rate'],
            'avg_rating': analytics_data['feedbacks']['avg_rating'],
            'satisfaction_rate': analytics_data['feedbacks']['satisfaction_rate'],
            'total_feedbacks': analytics_data['feedbacks']['total_feedbacks'],
            'active_sessions': analytics_data['sessions']['active_sessions']
        },
        
        # Operational Metrics
        'operations': {
            'user_retention_rate': analytics_data['users']['retention_rate'],
            'customer_franchise_ratio': analytics_data['users']['customer_franchise_ratio'],
            'ongoing_trips': analytics_data['trips']['ongoing_trips'],
            'scooters_in_use': analytics_data['scooters']['in_use_scooters'],
            'scooters_maintenance': analytics_data['scooters']['maintenance_scooters'],
            'avg_battery_level': analytics_data['scooters']['avg_battery_level'],
            'low_battery_scooters': analytics_data['scooters']['low_battery_count'],
            'avg_session_duration': analytics_data['sessions']['avg_session_duration'],
            'todays_sessions': analytics_data['sessions']['todays_sessions']
        },
        
        # Detailed Breakdowns
        'breakdowns': {
            'sentiment_distribution': analytics_data['feedbacks'].get('sentiment_distribution', {}),
            'scooter_performance': analytics_data['feedbacks'].get('scooter_performance', {})
        },
        
        # Data quality indicators
        'data_quality': {
            'users_data_available': analytics_data['users']['total_users'] > 0,
            'trips_data_available': analytics_data['trips']['total_trips'] > 0,
            'feedbacks_data_available': analytics_data['feedbacks']['total_feedbacks'] > 0,
            'scooters_data_available': analytics_data['scooters']['total_scooters'] > 0,
            'sessions_data_available': analytics_data['sessions']['total_sessions'] > 0
        }
    }
    
    return dashboard_data

def create_response(status_code, body):
    """Create standardized API response with CORS for Looker Studio"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
            'Cache-Control': 'public, max-age=300'  # Cache for 5 minutes
        },
        'body': json.dumps(body, default=str)
    }