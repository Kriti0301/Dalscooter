import json
import boto3
from collections import Counter
from datetime import datetime, timedelta
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
USER_SESSIONS_TABLE = dynamodb.Table('UserSessions')

def lambda_handler(event, context):
    """Get login analytics from UserSessions table"""
    
    try:
        # Scan all user sessions
        response = USER_SESSIONS_TABLE.scan()
        sessions = response.get('Items', [])
        
        if not sessions:
            return create_response(200, {
                'total_sessions': 0,
                'active_sessions': 0,
                'average_session_duration': 0
            })
        
        # Calculate analytics
        total_sessions = len(sessions)
        
        # Session duration analysis
        durations = []
        active_sessions = 0
        
        for session in sessions:
            if 'session_duration' in session and session['session_duration']:
                try:
                    durations.append(int(session['session_duration']))
                except (ValueError, TypeError):
                    pass
            
            # Check if session is still active (no logout_time)
            if 'logout_time' not in session or not session['logout_time']:
                active_sessions += 1
        
        # Duration statistics
        if durations:
            avg_duration = round(sum(durations) / len(durations), 2)
            max_duration = max(durations)
            min_duration = min(durations)
        else:
            avg_duration = max_duration = min_duration = 0
        
        # User role breakdown - FIXED: Handle missing user_role
        user_roles = []
        for session in sessions:
            role = session.get('user_role', 'unknown')
            user_roles.append(role)
        
        role_counts = {}
        for role in user_roles:
            role_counts[role] = role_counts.get(role, 0) + 1
        
        # Login patterns (if login_time exists)
        login_times = []
        for session in sessions:
            if 'login_time' in session and session['login_time']:
                try:
                    # Handle different datetime formats
                    login_time_str = session['login_time']
                    if login_time_str.endswith('Z'):
                        login_time_str = login_time_str[:-1] + '+00:00'
                    login_time = datetime.fromisoformat(login_time_str)
                    login_times.append(login_time)
                except Exception as e:
                    logger.warning(f"Could not parse login time: {session['login_time']}")
                    pass
        
        # Hour-wise login distribution - FIXED: Manual counting
        hourly_logins = {}
        daily_logins = {}
        
        for login_time in login_times:
            hour = login_time.hour
            day = login_time.strftime('%Y-%m-%d')
            
            hourly_logins[hour] = hourly_logins.get(hour, 0) + 1
            daily_logins[day] = daily_logins.get(day, 0) + 1
        
        # Peak hours - FIXED: Manual sorting instead of most_common()
        peak_hours = []
        if hourly_logins:
            sorted_hours = sorted(hourly_logins.items(), key=lambda x: x[1], reverse=True)
            peak_hours = [
                {'hour': f"{hour}:00", 'login_count': count}
                for hour, count in sorted_hours[:5]
            ]
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_sessions = []
        for session in sessions:
            if 'login_time' in session and session['login_time']:
                try:
                    login_time_str = session['login_time']
                    if login_time_str.endswith('Z'):
                        login_time_str = login_time_str[:-1] + '+00:00'
                    login_time = datetime.fromisoformat(login_time_str)
                    if login_time > seven_days_ago:
                        recent_sessions.append(session)
                except:
                    pass
        
        # Device/browser analysis (from user_agent)
        user_agents = [session.get('user_agent', 'unknown') for session in sessions if 'user_agent' in session]
        device_types = categorize_devices(user_agents)
        
        analytics_data = {
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'session_analytics': {
                'average_duration_minutes': avg_duration,
                'max_duration_minutes': max_duration,
                'min_duration_minutes': min_duration,
                'completion_rate': round(((total_sessions - active_sessions) / total_sessions) * 100, 1) if total_sessions > 0 else 0
            },
            'user_role_breakdown': role_counts,
            'login_patterns': {
                'peak_hours': peak_hours,
                'total_unique_days': len(daily_logins),
                'recent_activity_7_days': len(recent_sessions)
            },
            'device_analytics': device_types,
            'session_health': {
                'sessions_with_logout': total_sessions - active_sessions,
                'incomplete_sessions': active_sessions,
                'data_completeness': round((len([s for s in sessions if 'session_duration' in s and s['session_duration']]) / total_sessions) * 100, 1) if total_sessions > 0 else 0
            },
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        logger.info(f"Generated login analytics for {total_sessions} sessions")
        response_data = {
            'analytics': analytics_data,
            'data': analytics_data
        }
        return create_response(200, response_data)
        
    except Exception as e:
        logger.error(f"Error generating login analytics: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def categorize_devices(user_agents):
    """Categorize devices based on user agent strings"""
    mobile_count = 0
    desktop_count = 0
    tablet_count = 0
    unknown_count = 0
    
    for ua in user_agents:
        ua_lower = ua.lower() if ua else ''
        if any(mobile in ua_lower for mobile in ['mobile', 'android', 'iphone']):
            mobile_count += 1
        elif any(tablet in ua_lower for tablet in ['tablet', 'ipad']):
            tablet_count += 1
        elif any(desktop in ua_lower for desktop in ['windows', 'macintosh', 'linux']):
            desktop_count += 1
        else:
            unknown_count += 1
    
    return {
        'mobile': mobile_count,
        'desktop': desktop_count,
        'tablet': tablet_count,
        'unknown': unknown_count
    }

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