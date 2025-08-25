import json
import boto3
from datetime import datetime
import logging
import base64

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
FEEDBACKS_TABLE = dynamodb.Table('Feedbacks')

def lambda_handler(event, context):
    
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        path_parameters = event.get('pathParameters') or {}
        feedback_id = path_parameters.get('feedback_id')
        
        logger.info(f"Feedback ID to delete: {feedback_id}")
        
        if not feedback_id:
            return create_response(400, {'error': 'feedback_id path parameter is required'})
        
        requesting_user_id = extract_user_id_from_token(event)
        
        logger.info(f"Requesting user ID: {requesting_user_id}")
        
        if not requesting_user_id:
            return create_response(401, {'error': 'User authentication required'})
        
        try:
            logger.info(f"Getting feedback item from DynamoDB: {feedback_id}")
            get_response = FEEDBACKS_TABLE.get_item(
                Key={'feedback_id': feedback_id}
            )
            
            logger.info(f"DynamoDB get_item response: {get_response}")
            
            if 'Item' not in get_response:
                return create_response(404, {'error': 'Feedback not found'})
            
            feedback_item = get_response['Item']
            feedback_owner_id = feedback_item.get('user_id')
            
            logger.info(f"Feedback owner ID: {feedback_owner_id}")
            logger.info(f"Requesting user ID: {requesting_user_id}")
            
            if feedback_owner_id != requesting_user_id:
                return create_response(403, {'error': 'You can only delete your own feedback'})
            
            if feedback_item.get('is_deleted', False):
                return create_response(410, {'error': 'Feedback already deleted'})
                
        except Exception as e:
            logger.error(f"Error checking feedback ownership: {str(e)}")
            return create_response(500, {'error': 'Error accessing feedback data'})
        
        try:
            logger.info(f"Updating feedback to mark as deleted: {feedback_id}")
            update_response = FEEDBACKS_TABLE.update_item(
                Key={'feedback_id': feedback_id},
                UpdateExpression='SET is_deleted = :deleted, updated_at = :updated_at',
                ExpressionAttributeValues={
                    ':deleted': True,
                    ':updated_at': datetime.utcnow().isoformat() + 'Z'
                },
                ReturnValues='ALL_NEW'
            )
            
            logger.info(f"User {requesting_user_id} deleted feedback: {feedback_id}")
            
            return create_response(200, {
                'message': 'Feedback deleted successfully',
                'feedback_id': feedback_id,
                'deleted_at': datetime.utcnow().isoformat() + 'Z'
            })
            
        except Exception as e:
            logger.error(f"Error deleting feedback: {str(e)}")
            return create_response(500, {'error': 'Failed to delete feedback'})
        
    except Exception as e:
        logger.error(f"Unexpected error in delete feedback: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def extract_user_id_from_token(event):
    try:
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('sub')
        
        if user_id:
            logger.info(f"Got user ID from authorizer: {user_id}")
            return user_id
        
        headers = event.get('headers', {})
        logger.info(f"Request headers: {headers}")
        
        auth_header = None
        for key, value in headers.items():
            if key.lower() == 'authorization':
                auth_header = value
                break
        
        if not auth_header:
            logger.error("No Authorization header found")
            return None
        
        if not auth_header.startswith('Bearer '):
            logger.error("Authorization header does not start with 'Bearer '")
            return None
        
        token = auth_header[7:]
        logger.info(f"Extracted token: {token[:50]}...")
        
        parts = token.split('.')
        if len(parts) != 3:
            logger.error("Invalid JWT token format")
            return None
        
        payload = parts[1]
        
        padding = len(payload) % 4
        if padding:
            payload += '=' * (4 - padding)
        
        decoded_bytes = base64.urlsafe_b64decode(payload)
        decoded_json = json.loads(decoded_bytes.decode('utf-8'))
        
        logger.info(f"Decoded JWT payload: {decoded_json}")
        
        user_id = decoded_json.get('sub')
        logger.info(f"Extracted user ID from token: {user_id}")
        
        return user_id
        
    except Exception as e:
        logger.error(f"Error extracting user ID from token: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

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
