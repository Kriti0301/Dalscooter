import json
import boto3
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Attr
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
USERS_TABLE = dynamodb.Table('Users')
USER_SESSIONS_TABLE = dynamodb.Table('UserSessions')

def lambda_handler(event, context):
    # Get comprehensive users analytics from Users table + UserSessions table
    
    try:
        # Scan all users
        users_response = USERS_TABLE.scan()
        users = users_response.get('Items', [])
        
        # Scan all user sessions  
        sessions_response = USER_SESSIONS_TABLE.scan()
        sessions = sessions_response.get('Items', [])
        
        if not users:
            return create_response(200, {
                'total_users': 0,
                'users_by_role': {},
                'login_activity': {},
                'user_engagement': {}
            })
        
        # Calculate basic user analytics
        total_users = len(users)
        
        # Users by role (0 = Customer, 1 = Franchise)
        role_counts = {}
        for user in users:
            try:
                role = int(user.get('role', 0))
                role_counts[role] = role_counts.get(role, 0) + 1
            except (ValueError, TypeError):
                role_counts[0] = role_counts.get(0, 0) + 1
        
        users_by_role = {
            'customers': role_counts.get(0, 0),
            'franchises': role_counts.get(1, 0)
        }
        
        # User distribution percentages
        role_percentages = {}
        for role_name, count in users_by_role.items():
            role_percentages[role_name] = {
                'count': count,
                'percentage': round((count / total_users) * 100, 1) if total_users > 0 else 0
            }
        
        # Process session data for user activity analytics
        user_activity = analyze_user_sessions(sessions, users)
        
        # Calculate user engagement metrics
        engagement_metrics = calculate_engagement_metrics(users, sessions)
        
        # Sample user data with login info
        sample_users = create_sample_users_with_activity(users, sessions)
        
        analytics_data = {
            'total_users': total_users,
            'users_by_role': role_percentages,
            'role_summary': {
                'total_customers': users_by_role['customers'],
                'total_franchises': users_by_role['franchises'],
                'customer_to_franchise_ratio': round(
                    users_by_role['customers'] / max(users_by_role['franchises'], 1), 2
                )
            },
            'login_activity': user_activity,
            'user_engagement': engagement_metrics,
            'sample_users': sample_users,
            'session_overview': {
                'total_sessions': len(sessions),
                'users_with_sessions': len(set([s.get('user_id') for s in sessions if s.get('user_id')])),
                'users_never_logged_in': total_users - len(set([s.get('user_id') for s in sessions if s.get('user_id')]))
            },
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        logger.info(f"Generated comprehensive user analytics for {total_users} users with {len(sessions)} sessions")
        response_data = {
            'analytics': analytics_data,
            'data': analytics_data
        }
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error generating user analytics: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def analyze_user_sessions(sessions, users):
    """Analyze user login patterns and activity"""
    if not sessions:
        return {
            'active_users_today': 0,
            'active_users_week': 0,
            'total_login_sessions': 0,
            'average_sessions_per_user': 0
        }
    
    # Time calculations
    now = datetime.utcnow()
    today = now.date()
    week_ago = now - timedelta(days=7)
    
    # Session analysis
    user_sessions = defaultdict(list)
    total_sessions = len(sessions)
    
    active_today = set()
    active_week = set()
    
    for session in sessions:
        user_id = session.get('user_id')
        if not user_id:
            continue
            
        user_sessions[user_id].append(session)
        
        # Check login time for activity tracking
        login_time_str = session.get('login_time')
        if login_time_str:
            try:
                # Handle different datetime formats
                if login_time_str.endswith('Z'):
                    login_time_str = login_time_str[:-1] + '+00:00'
                login_time = datetime.fromisoformat(login_time_str)
                
                # Active today
                if login_time.date() == today:
                    active_today.add(user_id)
                
                # Active this week
                if login_time >= week_ago:
                    active_week.add(user_id)
                    
            except Exception as e:
                logger.warning(f"Could not parse login time: {login_time_str}")
                pass
    
    # Calculate averages
    users_with_sessions = len(user_sessions)
    avg_sessions_per_user = round(total_sessions / max(users_with_sessions, 1), 2)
    
    # Most active users - FIXED: Handle empty case
    most_active = []
    if user_sessions:
        # Sort users by session count and take top 5
        sorted_users = sorted(user_sessions.items(), key=lambda x: len(x[1]), reverse=True)
        most_active = [
            {
                'user_id': user_id[:8] + '...' if len(user_id) > 8 else user_id,
                'session_count': len(sessions_list)
            }
            for user_id, sessions_list in sorted_users[:5]
        ]
    
    return {
        'active_users_today': len(active_today),
        'active_users_week': len(active_week),
        'total_login_sessions': total_sessions,
        'users_with_login_history': users_with_sessions,
        'average_sessions_per_user': avg_sessions_per_user,
        'most_active_users': most_active,
        'activity_rates': {
            'daily_activity_rate': round((len(active_today) / len(users)) * 100, 1) if users else 0,
            'weekly_activity_rate': round((len(active_week) / len(users)) * 100, 1) if users else 0
        }
    }

def calculate_engagement_metrics(users, sessions):
    """Calculate user engagement and retention metrics"""
    if not sessions:
        return {
            'user_retention': {
                'registered_but_never_logged_in': len(users),
                'retention_rate': 0
            }
        }
    
    # Users who have logged in
    users_with_sessions = set([s.get('user_id') for s in sessions if s.get('user_id')])
    users_never_logged_in = len(users) - len(users_with_sessions)
    
    # Session duration analysis
    session_durations = []
    for session in sessions:
        duration = session.get('session_duration')
        if duration:
            try:
                session_durations.append(int(duration))
            except (ValueError, TypeError):
                pass
    
    avg_session_duration = round(sum(session_durations) / len(session_durations), 2) if session_durations else 0
    
    # Retention rate (users who logged in vs total users)
    retention_rate = round((len(users_with_sessions) / len(users)) * 100, 1) if users else 0
    
    # User role engagement
    role_engagement = analyze_role_engagement(users, sessions)
    
    return {
        'user_retention': {
            'users_who_logged_in': len(users_with_sessions),
            'registered_but_never_logged_in': users_never_logged_in,
            'retention_rate': retention_rate
        },
        'session_quality': {
            'average_session_duration_minutes': avg_session_duration,
            'total_sessions_analyzed': len(session_durations)
        },
        'role_engagement': role_engagement
    }

def analyze_role_engagement(users, sessions):
    """Analyze engagement by user role"""
    # Create user role mapping
    user_roles = {}
    for user in users:
        try:
            role = int(user.get('role', 0))
            user_roles[user['email']] = 'customer' if role == 0 else 'franchise'
        except (ValueError, TypeError):
            user_roles[user['email']] = 'customer'
    
    # Analyze sessions by role
    role_sessions = defaultdict(int)
    role_users_active = defaultdict(set)
    
    for session in sessions:
        user_role = session.get('user_role', 'unknown')
        user_id = session.get('user_id')
        
        if user_role != 'unknown':
            role_sessions[user_role] += 1
            if user_id:
                role_users_active[user_role].add(user_id)
    
    engagement_by_role = {}
    for role in ['customer', 'franchise']:
        total_users_in_role = sum(1 for user in users if (int(user.get('role', 0)) == 0 and role == 'customer') or (int(user.get('role', 0)) == 1 and role == 'franchise'))
        active_users_in_role = len(role_users_active.get(role, set()))
        
        engagement_by_role[role] = {
            'total_users': total_users_in_role,
            'active_users': active_users_in_role,
            'total_sessions': role_sessions.get(role, 0),
            'engagement_rate': round((active_users_in_role / max(total_users_in_role, 1)) * 100, 1)
        }
    
    return engagement_by_role

def create_sample_users_with_activity(users, sessions):
    """Create sample user data enriched with login activity"""
    # Create session count mapping
    user_session_counts = defaultdict(int)
    user_last_login = {}
    
    for session in sessions:
        user_id = session.get('user_id')
        if user_id:
            user_session_counts[user_id] += 1
            
            login_time = session.get('login_time')
            if login_time:
                if user_id not in user_last_login or login_time > user_last_login[user_id]:
                    user_last_login[user_id] = login_time
    
    sample_users = []
    for user in users[:5]:  # First 5 users
        user_email = user['email']
        
        # Try to find session data by email 
        session_count = user_session_counts.get(user_email, 0)
        last_login = user_last_login.get(user_email, 'Never')
        
        try:
            role = int(user.get('role', 0))
            role_name = 'customer' if role == 0 else 'franchise'
        except (ValueError, TypeError):
            role_name = 'customer'
        
        sample_users.append({
            'email': user_email,
            'name': user.get('name', 'Unknown'),
            'role': role_name,
            'total_sessions': session_count,
            'last_login': last_login,
            'status': 'active' if session_count > 0 else 'registered_only'
        })
    
    return sample_users

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