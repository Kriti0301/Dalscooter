import json
import boto3
import uuid
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
USER_SESSIONS_TABLE = dynamodb.Table('UserSessions')

def lambda_handler(event, context):
    
    # Manage user sessions - create, update, and end sessions   
    try:
        # Parse request
        if event.get('body'):
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            return create_response(400, {'error': 'Request body is required'})
        
        action = body.get('action')  # 'login', 'logout', 'update'
        
        if action == 'login':
            return handle_login(body)
        elif action == 'logout':
            return handle_logout(body)
        elif action == 'update':
            return handle_update(body)
        else:
            return create_response(400, {'error': 'Invalid action. Use: login, logout, update'})
            
    except Exception as e:
        logger.error(f"Error in session manager: {str(e)}")
        return create_response(500, {'error': f'Internal server error: {str(e)}'})

def handle_login(body):
    
    # Create a new user session on login
    
    try:
        # Required fields
        user_id = body.get('user_id')
        user_role = body.get('user_role', 'user')
        ip_address = body.get('ip_address', 'unknown')
        user_agent = body.get('user_agent', 'unknown')
        
        if not user_id:
            return create_response(400, {'error': 'user_id is required'})
        
        # Generate session
        session_id = f"session_{str(uuid.uuid4())[:8]}"
        current_time = datetime.utcnow()
        login_time = current_time.isoformat() + 'Z'
        
        # Calculate TTL (24 hours from now)
        ttl_time = current_time + timedelta(hours=24)
        ttl = int(ttl_time.timestamp())
        
        session_item = {
            'session_id': session_id,
            'user_id': user_id,
            'user_role': user_role,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'login_time': login_time,
            'logout_time': None,
            'session_duration': None,
            'ttl': ttl
        }
        
        # Store session
        USER_SESSIONS_TABLE.put_item(Item=session_item)
        
        logger.info(f"Created session {session_id} for user {user_id}")
        
        return create_response(201, {
            'message': 'Session created successfully',
            'session_id': session_id,
            'login_time': login_time
        })
        
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        return create_response(500, {'error': f'Failed to create session: {str(e)}'})

def handle_logout(body):
    
    # End a user session on logout
    try:
        session_id = body.get('session_id')
        user_id = body.get('user_id')
        
        if not session_id and not user_id:
            return create_response(400, {'error': 'session_id or user_id is required'})
        
        current_time = datetime.utcnow()
        logout_time = current_time.isoformat() + 'Z'
        
        # Find session to update
        if session_id:
            # Update by session_id
            try:
                response = USER_SESSIONS_TABLE.get_item(Key={'session_id': session_id})
                if 'Item' not in response:
                    return create_response(404, {'error': 'Session not found'})
                
                session = response['Item']
                login_time_str = session.get('login_time')
                
                # Calculate duration
                duration = 0
                if login_time_str:
                    try:
                        login_dt = datetime.fromisoformat(login_time_str.replace('Z', '+00:00'))
                        duration = int((current_time - login_dt.replace(tzinfo=None)).total_seconds() / 60)
                    except:
                        pass
                
                # Update session
                USER_SESSIONS_TABLE.update_item(
                    Key={'session_id': session_id},
                    UpdateExpression='SET logout_time = :logout_time, session_duration = :duration',
                    ExpressionAttributeValues={
                        ':logout_time': logout_time,
                        ':duration': duration
                    }
                )
                
                logger.info(f"Updated session {session_id} with logout time")
                
                return create_response(200, {
                    'message': 'Session ended successfully',
                    'session_id': session_id,
                    'logout_time': logout_time,
                    'duration_minutes': duration
                })
                
            except Exception as e:
                logger.error(f"Error updating session {session_id}: {str(e)}")
                return create_response(500, {'error': f'Failed to update session: {str(e)}'})
        
        else:
            # Find active session by user_id
            try:
                response = USER_SESSIONS_TABLE.scan(
                    FilterExpression='user_id = :user_id AND attribute_not_exists(logout_time)',
                    ExpressionAttributeValues={':user_id': user_id}
                )
                
                sessions = response.get('Items', [])
                if not sessions:
                    return create_response(404, {'error': 'No active session found for user'})
                
                # Update the most recent session
                session = sessions[0]
                session_id = session['session_id']
                
                login_time_str = session.get('login_time')
                duration = 0
                if login_time_str:
                    try:
                        login_dt = datetime.fromisoformat(login_time_str.replace('Z', '+00:00'))
                        duration = int((current_time - login_dt.replace(tzinfo=None)).total_seconds() / 60)
                    except:
                        pass
                
                USER_SESSIONS_TABLE.update_item(
                    Key={'session_id': session_id},
                    UpdateExpression='SET logout_time = :logout_time, session_duration = :duration',
                    ExpressionAttributeValues={
                        ':logout_time': logout_time,
                        ':duration': duration
                    }
                )
                
                logger.info(f"Updated session {session_id} for user {user_id}")
                
                return create_response(200, {
                    'message': 'Session ended successfully',
                    'session_id': session_id,
                    'logout_time': logout_time,
                    'duration_minutes': duration
                })
                
            except Exception as e:
                logger.error(f"Error finding/updating session for user {user_id}: {str(e)}")
                return create_response(500, {'error': f'Failed to end session: {str(e)}'})
    
    except Exception as e:
        logger.error(f"Error in logout handler: {str(e)}")
        return create_response(500, {'error': f'Logout failed: {str(e)}'})

def handle_update(body):
    # Update session information (like user_agent, ip_address)
    try:
        session_id = body.get('session_id')
        if not session_id:
            return create_response(400, {'error': 'session_id is required'})
        
        # Build update expression
        update_parts = []
        attr_values = {}
        
        if 'ip_address' in body:
            update_parts.append('ip_address = :ip')
            attr_values[':ip'] = body['ip_address']
        
        if 'user_agent' in body:
            update_parts.append('user_agent = :ua')
            attr_values[':ua'] = body['user_agent']
        
        if not update_parts:
            return create_response(400, {'error': 'No fields to update'})
        
        update_expression = 'SET ' + ', '.join(update_parts)
        
        USER_SESSIONS_TABLE.update_item(
            Key={'session_id': session_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=attr_values
        )
        
        return create_response(200, {'message': 'Session updated successfully'})
        
    except Exception as e:
        logger.error(f"Error updating session: {str(e)}")
        return create_response(500, {'error': f'Failed to update session: {str(e)}'})

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