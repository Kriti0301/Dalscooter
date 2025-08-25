import json
import boto3
import uuid
import urllib3
from datetime import datetime
from decimal import Decimal
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
FEEDBACKS_TABLE = dynamodb.Table('Feedbacks')
HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest"

def lambda_handler(event, context):
    
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get request body
        if event.get('body'):
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            return create_response(400, {'error': 'Request body is required'})
        
        logger.info(f"Parsed request body: {body}")
        
        # Check all required fields are present
        required_fields = ['user_id', 'trip_id', 'scooter_type', 'rating', 'comment']
        for field in required_fields:
            if field not in body or not body[field]:
                return create_response(400, {'error': f'{field} is required'})
        
        user_id = body['user_id']
        trip_id = body['trip_id']
        scooter_type = body['scooter_type']
        rating = int(body['rating'])
        comment = body['comment'].strip()
        
        logger.info(f"Processing feedback: user={user_id[:8]}..., trip={trip_id[:8]}..., type={scooter_type}, rating={rating}")
        
        # Basic validation checks
        if not (1 <= rating <= 5):
            return create_response(400, {'error': 'Rating must be between 1 and 5'})
        
        # Check scooter type is valid
        valid_scooter_types = ['gyroscooter', 'eBike', 'segway']
        if scooter_type not in valid_scooter_types:
            return create_response(400, {'error': f'Invalid scooter_type. Must be one of: {valid_scooter_types}'})
        
        # Make sure comment isn't too short
        if len(comment) < 3:
            return create_response(400, {'error': 'Comment must be at least 3 characters long'})
        
        # Create unique ID and timestamp
        feedback_id = f"fb_{str(uuid.uuid4())[:8]}"
        current_time = datetime.utcnow().isoformat() + 'Z'
        
        logger.info(f"Generated feedback ID: {feedback_id}")
        
        # Get sentiment from Hugging Face API
        sentiment_result = analyze_sentiment_huggingface(comment)
        logger.info(f"Hugging Face sentiment analysis result: {sentiment_result}")
        
        # Build DynamoDB record
        feedback_item = {
            'feedback_id': feedback_id,
            'user_id': user_id,
            'trip_id': trip_id,
            'scooter_type': scooter_type,
            'rating': rating,
            'comment': comment,
            'sentiment': sentiment_result['sentiment'],
            'sentiment_score': Decimal(str(sentiment_result['confidence'])),
            'created_at': current_time,
            'updated_at': current_time,
            'is_deleted': False
        }
        
        logger.info(f"Storing feedback in DynamoDB: {feedback_id}")
        
        # Save to database
        FEEDBACKS_TABLE.put_item(Item=feedback_item)
        
        logger.info(f"Feedback submitted successfully: {feedback_id}")
        
        # Send back response
        response_data = {
            'message': 'Feedback submitted successfully',
            'feedback_id': feedback_id,
            'sentiment': sentiment_result['sentiment'],
            'sentiment_score': float(sentiment_result['confidence']),
            'created_at': current_time
        }
        
        return create_response(201, response_data)
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_response(400, {'error': f'Validation error: {str(e)}'})
    
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return create_response(500, {'error': 'Internal server error'})

def analyze_sentiment_huggingface(comment):
    # Call Hugging Face free API for sentiment analysis
    try:
        logger.info(f"Analyzing sentiment with Hugging Face for: {comment[:100]}...")
        
        # Set up request data
        payload = {
            "inputs": comment,
            "options": {
                "wait_for_model": True
            }
        }
        
        # Make HTTP request
        http = urllib3.PoolManager()
        
        # Send request to Hugging Face
        response = http.request(
            'POST',
            HUGGING_FACE_API_URL,
            body=json.dumps(payload),
            headers={
                'Content-Type': 'application/json',
            },
            timeout=10.0
        )
        
        logger.info(f"Hugging Face API response status: {response.status}")
        
        if response.status == 200:
            # Parse the response
            result = json.loads(response.data.decode('utf-8'))
            logger.info(f"Hugging Face API raw response: {result}")
            
            if isinstance(result, list) and len(result) > 0:
                # Extract sentiment predictions
                predictions = result[0] if isinstance(result[0], list) else result
                
                # Find the prediction with highest confidence
                best_prediction = max(predictions, key=lambda x: x['score'])
                
                # Map Hugging Face labels to our format
                label_mapping = {
                    'LABEL_0': 'negative',    # RoBERTa negative
                    'LABEL_1': 'neutral',     # RoBERTa neutral  
                    'LABEL_2': 'positive',    # RoBERTa positive
                    'NEGATIVE': 'negative',
                    'NEUTRAL': 'neutral',
                    'POSITIVE': 'positive'
                }
                
                raw_label = best_prediction['label']
                sentiment = label_mapping.get(raw_label.upper(), 'neutral')
                confidence = round(best_prediction['score'], 3)
                
                logger.info(f"Mapped sentiment: {sentiment} (confidence: {confidence})")
                
                return {
                    'sentiment': sentiment,
                    'confidence': confidence,
                    'raw_label': raw_label,
                    'api_source': 'huggingface'
                }
            else:
                logger.warning("Unexpected Hugging Face API response format")
                return fallback_sentiment_analysis(comment)
        
        elif response.status == 503:
            # Model is loading, wait and retry once
            logger.info("Model is loading, retrying in 3 seconds...")
            import time
            time.sleep(3)
            
            # Retry the request
            retry_response = http.request(
                'POST',
                HUGGING_FACE_API_URL,
                body=json.dumps(payload),
                headers={
                    'Content-Type': 'application/json',
                },
                timeout=15.0
            )
            
            if retry_response.status == 200:
                result = json.loads(retry_response.data.decode('utf-8'))
                predictions = result[0] if isinstance(result[0], list) else result
                best_prediction = max(predictions, key=lambda x: x['score'])
                
                label_mapping = {
                    'LABEL_0': 'negative',
                    'LABEL_1': 'neutral', 
                    'LABEL_2': 'positive',
                    'NEGATIVE': 'negative',
                    'NEUTRAL': 'neutral',
                    'POSITIVE': 'positive'
                }
                
                sentiment = label_mapping.get(best_prediction['label'].upper(), 'neutral')
                confidence = round(best_prediction['score'], 3)
                
                return {
                    'sentiment': sentiment,
                    'confidence': confidence,
                    'raw_label': best_prediction['label'],
                    'api_source': 'huggingface_retry'
                }
            else:
                logger.warning(f"Retry failed with status: {retry_response.status}")
                return fallback_sentiment_analysis(comment)
        
        else:
            logger.error(f"Hugging Face API error: {response.status} - {response.data.decode('utf-8')}")
            return fallback_sentiment_analysis(comment)
            
    except Exception as e:
        logger.error(f"Hugging Face API request failed: {str(e)}")
        return fallback_sentiment_analysis(comment)

def fallback_sentiment_analysis(comment):
    
    # Enhanced fallback sentiment analysis when Hugging Face API fails
    
    try:
        logger.info("Using fallback sentiment analysis")
        comment_lower = comment.lower()
        
        # Enhanced sentiment word lists
        positive_words = [
            # Very positive
            'amazing', 'excellent', 'fantastic', 'wonderful', 'awesome', 'perfect', 
            'outstanding', 'superb', 'brilliant', 'exceptional', 'incredible',
            # Positive
            'great', 'good', 'nice', 'smooth', 'comfortable', 'easy', 'fast', 
            'reliable', 'convenient', 'satisfied', 'happy', 'pleased', 'impressed',
            'enjoyed', 'love', 'recommend', 'efficient', 'responsive', 'stable',
            'clean', 'quiet', 'powerful', 'fun', 'beautiful', 'helpful', 'useful',
            # Experience words
            'seamless', 'flawless', 'sturdy', 'durable', 'affordable', 'worth'
        ]
        
        negative_words = [
            # Very negative
            'terrible', 'awful', 'horrible', 'disgusting', 'pathetic', 'worst',
            'hate', 'unacceptable', 'defective', 'useless', 'worthless',
            # Negative
            'bad', 'poor', 'broken', 'slow', 'uncomfortable', 'difficult', 
            'problem', 'issue', 'failed', 'disappointed', 'frustrating', 
            'annoying', 'unreliable', 'dangerous', 'expensive', 'waste',
            'regret', 'complain', 'faulty', 'unstable', 'confusing'
        ]
        
        # Count sentiment words
        pos_count = sum(1 for word in positive_words if word in comment_lower)
        neg_count = sum(1 for word in negative_words if word in comment_lower)
        
        # Check for negation patterns
        negation_patterns = ['not ', 'no ', 'never ', "don't ", "doesn't ", "didn't ", "won't ", "wouldn't "]
        has_negation = any(pattern in comment_lower for pattern in negation_patterns)
        
        # Check for intensifiers
        intensifiers = ['very', 'really', 'extremely', 'absolutely', 'totally', 'completely']
        has_intensifier = any(word in comment_lower for word in intensifiers)
        
        # Check for punctuation emphasis
        exclamation_count = comment.count('!')
        
        # Calculate sentiment
        if pos_count > neg_count:
            base_confidence = 0.7
            if has_intensifier:
                base_confidence += 0.1
            if exclamation_count > 0:
                base_confidence += 0.05
            if has_negation:
                # Flip to negative if strong negation
                return {
                    'sentiment': 'negative',
                    'confidence': round(min(base_confidence * 0.8, 0.85), 3),
                    'api_source': 'fallback_negated'
                }
            return {
                'sentiment': 'positive',
                'confidence': round(min(base_confidence, 0.9), 3),
                'api_source': 'fallback'
            }
        elif neg_count > pos_count:
            base_confidence = 0.7
            if has_intensifier:
                base_confidence += 0.1
            return {
                'sentiment': 'negative',
                'confidence': round(min(base_confidence, 0.9), 3),
                'api_source': 'fallback'
            }
        else:
            return {
                'sentiment': 'neutral',
                'confidence': 0.6,
                'api_source': 'fallback'
            }
            
    except Exception as e:
        logger.error(f"Fallback sentiment analysis failed: {str(e)}")
        return {
            'sentiment': 'neutral',
            'confidence': 0.5,
            'api_source': 'fallback_error'
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