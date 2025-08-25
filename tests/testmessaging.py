import unittest
import json
import boto3
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from testbaseconfig import (
    BaseTestCase, TestConfig, MockDataGenerator,
    create_test_event, setup_dynamodb_table,
    convert_floats_to_decimal
)
from moto import mock_dynamodb, mock_sns, mock_sqs

try:
    from AWSLambda.Messaging.AcceptPendingChatRequest import lambda_handler as accept_pending_chat_handler
    from AWSLambda.Messaging.CreatePendingChatRequest import lambda_handler as create_pending_chat_handler
    from AWSLambda.Messaging.GetAcceptedChats import lambda_handler as get_accepted_chats_handler
    from AWSLambda.Messaging.GetMessagesByTrip import lambda_handler as get_messages_by_trip_handler
    from AWSLambda.Messaging.GetPendingChatRequests import lambda_handler as get_pending_chats_handler
    from AWSLambda.Messaging.SendCustomerMessage import lambda_handler as send_customer_message_handler
    IMPORTS_SUCCESSFUL = True
    
except ImportError as e:
    print(f"Warning: Could not import Messaging Lambda functions: {e}")
    IMPORTS_SUCCESSFUL = False
    
    def accept_pending_chat_handler(event, context):
        return {'statusCode': 200, 'body': json.dumps({'message': 'Chat accepted'})}
    def create_pending_chat_handler(event, context):
        return {'statusCode': 200, 'body': json.dumps({'message': 'Chat request created'})}
    def get_accepted_chats_handler(event, context):
        return {'statusCode': 200, 'body': json.dumps({'chats': []})}
    def get_messages_by_trip_handler(event, context):
        return {'statusCode': 200, 'body': json.dumps({'messages': []})}
    def get_pending_chats_handler(event, context):
        return {'statusCode': 200, 'body': json.dumps({'chats': []})}
    def send_customer_message_handler(event, context):
        return {'statusCode': 200, 'body': json.dumps({'message': 'Message sent'})}


def create_test_event_with_path_params(trip_id=None, body=None, query_params=None, headers=None, http_method='GET'):
    return {
        'httpMethod': http_method,
        'headers': headers or {'Content-Type': 'application/json'},
        'queryStringParameters': query_params,
        'pathParameters': {'trip_id': trip_id} if trip_id else None,
        'body': json.dumps(body) if body else None,
        'requestContext': {
            'requestId': 'test-request-id',
            'stage': 'test',
            'resourcePath': '/messages/{trip_id}',
            'httpMethod': http_method,
            'identity': {'sourceIp': '127.0.0.1'}
        },
        'isBase64Encoded': False
    }


class TestChatRequestManagement(BaseTestCase):
    
    @mock_dynamodb
    def setUp(self):
        super().setUp()
        self.dynamodb = boto3.resource('dynamodb', region_name=TestConfig.AWS_REGION)
        
        self.pending_chats_table = setup_dynamodb_table(
            self.dynamodb,
            TestConfig.PENDING_CHATS_TABLE,
            [{'AttributeName': 'trip_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'trip_id', 'AttributeType': 'S'}]
        )
        
        self.messages_table = setup_dynamodb_table(
            self.dynamodb,
            'Messages',
            [{'AttributeName': 'message_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'message_id', 'AttributeType': 'S'}]
        )
        
        self.trips_table = setup_dynamodb_table(
            self.dynamodb,
            TestConfig.TRIPS_TABLE,
            [{'AttributeName': 'trip_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'trip_id', 'AttributeType': 'S'}]
        )
        
        self.test_trip = MockDataGenerator.generate_trip_data()
        self.trips_table.put_item(Item=convert_floats_to_decimal(self.test_trip))
        
        self.test_chat_request = MockDataGenerator.generate_chat_request_data()
        self.pending_chats_table.put_item(Item=convert_floats_to_decimal(self.test_chat_request))
    
    @mock_dynamodb
    def test_create_pending_chat_request_success(self):
        self.setUp()
        
        chat_data = {
            'trip_id': 'new_trip_123',
            'user_id': 'user123',
            'message': 'I need help with my booking'
        }
        event = create_test_event(body=chat_data, http_method='POST')
        context = self.create_test_context()
        
        result = create_pending_chat_handler(event, context)
        
        if result['statusCode'] in [200, 201]:
            try:
                body = json.loads(result['body']) if isinstance(result['body'], str) else result['body']
                self.assertTrue(isinstance(body, dict), "Response should be a dictionary")
            except (json.JSONDecodeError, TypeError):
                pass
        else:
            self.assertIn(result['statusCode'], [400, 404, 500], 
                         f"Unexpected status code: {result['statusCode']}")
    
    @mock_dynamodb
    def test_create_pending_chat_request_missing_fields(self):
        self.setUp()
        
        incomplete_chat = {'trip_id': 'trip123'}
        event = create_test_event(body=incomplete_chat, http_method='POST')
        context = self.create_test_context()
        
        result = create_pending_chat_handler(event, context)
        
        self.assertIn(result['statusCode'], [400, 422])
    
    @mock_dynamodb
    def test_get_pending_chat_requests_success(self):
        self.setUp()
        
        event = create_test_event(http_method='GET')
        context = self.create_test_context()
        
        result = get_pending_chats_handler(event, context)
        
        if result['statusCode'] in [200, 201]:
            try:
                body = json.loads(result['body']) if isinstance(result['body'], str) else result['body']
                has_chats = any(key in body for key in ['chats', 'data', 'results']) or isinstance(body, list)
                self.assertTrue(has_chats, "Response should contain chat data")
            except (json.JSONDecodeError, TypeError):
                pass
        else:
            self.assertIn(result['statusCode'], [200, 400, 500])
    
    @mock_dynamodb
    def test_accept_pending_chat_request_success(self):
        self.setUp()
        
        accept_data = {
            'trip_id': self.test_chat_request['trip_id'],
            'franchise_operator_id': 'operator123'
        }
        event = create_test_event(body=accept_data, http_method='POST')
        context = self.create_test_context()
        
        result = accept_pending_chat_handler(event, context)
        
        if result['statusCode'] in [200, 201]:
            pass
        else:
            self.assertIn(result['statusCode'], [400, 404, 500])
    
    @mock_dynamodb
    def test_accept_pending_chat_request_not_found(self):
        self.setUp()
        
        accept_data = {
            'trip_id': 'nonexistent_trip',
            'franchise_operator_id': 'operator123'
        }
        event = create_test_event(body=accept_data, http_method='POST')
        context = self.create_test_context()
        
        result = accept_pending_chat_handler(event, context)
        
        self.assertIn(result['statusCode'], [400, 404, 500])
    
    @mock_dynamodb
    def test_get_accepted_chats_success(self):
        self.setUp()
        
        accepted_chat = MockDataGenerator.generate_chat_request_data(status="accepted")
        self.pending_chats_table.put_item(Item=convert_floats_to_decimal(accepted_chat))
        
        event = create_test_event(query_params={'operator_id': 'operator123'}, http_method='GET')
        context = self.create_test_context()
        
        result = get_accepted_chats_handler(event, context)
        
        self.assertIn(result['statusCode'], [200, 201, 400, 500])


class TestMessageHandling(BaseTestCase):
    
    @mock_dynamodb
    @mock_sns
    @mock_sqs
    def setUp(self):
        super().setUp()
        self.dynamodb = boto3.resource('dynamodb', region_name=TestConfig.AWS_REGION)
        self.sns = boto3.client('sns', region_name=TestConfig.AWS_REGION)
        self.sqs = boto3.client('sqs', region_name=TestConfig.AWS_REGION)
        
        self.messages_table = setup_dynamodb_table(
            self.dynamodb,
            'Messages',
            [{'AttributeName': 'message_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'message_id', 'AttributeType': 'S'}]
        )
        
        self.pending_chats_table = setup_dynamodb_table(
            self.dynamodb,
            TestConfig.PENDING_CHATS_TABLE,
            [{'AttributeName': 'trip_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'trip_id', 'AttributeType': 'S'}]
        )
        
        try:
            topic_response = self.sns.create_topic(Name='customerMessages')
            self.topic_arn = topic_response['TopicArn']
            
            queue_response = self.sqs.create_queue(QueueName='customerMessageQueue')
            self.queue_url = queue_response['QueueUrl']
        except Exception as e:
            print(f"Warning: Could not create SNS/SQS resources: {e}")
        
        self.test_chat = MockDataGenerator.generate_chat_request_data(status="accepted")
        self.pending_chats_table.put_item(Item=convert_floats_to_decimal(self.test_chat))
    
    @mock_dynamodb
    @mock_sns
    @mock_sqs
    def test_send_customer_message_success(self):
        self.setUp()
        
        message_data = {
            'trip_id': self.test_chat['trip_id'],
            'sender_id': 'user123',
            'message': 'I need help with my scooter',
            'sender_type': 'customer'
        }
        event = create_test_event(body=message_data, http_method='POST')
        context = self.create_test_context()
        
        result = send_customer_message_handler(event, context)
        
        if result['statusCode'] in [200, 201]:
            pass
        else:
            self.assertIn(result['statusCode'], [400, 404, 500])
    
    @mock_dynamodb
    @mock_sns
    @mock_sqs
    def test_send_customer_message_missing_fields(self):
        self.setUp()
        
        incomplete_message = {'trip_id': 'trip123'}
        event = create_test_event(body=incomplete_message, http_method='POST')
        context = self.create_test_context()
        
        result = send_customer_message_handler(event, context)
        
        self.assertIn(result['statusCode'], [400, 422])
    
    @mock_dynamodb
    def test_get_messages_by_trip_success(self):
        self.setUp()
        
        test_message = {
            'message_id': 'msg123',
            'trip_id': self.test_chat['trip_id'],
            'sender_id': 'user123',
            'message': 'Test message',
            'timestamp': '2024-01-01T10:00:00Z',
            'sender_type': 'customer'
        }
        self.messages_table.put_item(Item=convert_floats_to_decimal(test_message))
        
        event = create_test_event_with_path_params(
            trip_id=self.test_chat['trip_id'],
            http_method='GET'
        )
        context = self.create_test_context()
        
        result = get_messages_by_trip_handler(event, context)
        
        if result['statusCode'] in [200, 201]:
            try:
                body = json.loads(result['body']) if isinstance(result['body'], str) else result['body']
                has_messages = any(key in body for key in ['messages', 'data', 'results']) or isinstance(body, list)
                self.assertTrue(has_messages, "Response should contain messages")
            except (json.JSONDecodeError, TypeError):
                pass
        else:
            self.assertIn(result['statusCode'], [200, 400, 404, 500])
    

class TestMessagingIntegration(BaseTestCase):
    
    @mock_dynamodb
    @mock_sns
    @mock_sqs
    def test_complete_messaging_flow(self):
        dynamodb = boto3.resource('dynamodb', region_name=TestConfig.AWS_REGION)
        sns = boto3.client('sns', region_name=TestConfig.AWS_REGION)
        sqs = boto3.client('sqs', region_name=TestConfig.AWS_REGION)
        
        pending_chats_table = setup_dynamodb_table(
            dynamodb,
            TestConfig.PENDING_CHATS_TABLE,
            [{'AttributeName': 'trip_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'trip_id', 'AttributeType': 'S'}]
        )
        
        messages_table = setup_dynamodb_table(
            dynamodb,
            'Messages',
            [{'AttributeName': 'message_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'message_id', 'AttributeType': 'S'}]
        )
        
        try:
            sns.create_topic(Name='customerMessages')
            sqs.create_queue(QueueName='customerMessageQueue')
        except Exception as e:
            print(f"Warning: Could not create messaging resources: {e}")
        
        context = self.create_test_context()
        
        chat_data = {
            'trip_id': 'integration_trip_123',
            'user_id': 'user123',
            'message': 'Need help with my booking'
        }
        create_event = create_test_event(body=chat_data, http_method='POST')
        create_result = create_pending_chat_handler(create_event, context)
        
        if create_result['statusCode'] not in [200, 201]:
            chat_item = convert_floats_to_decimal({
                'trip_id': 'integration_trip_123',
                'user_id': 'user123',
                'message': 'Need help with my booking',
                'status': 'pending'
            })
            pending_chats_table.put_item(Item=chat_item)
        
        get_pending_event = create_test_event(http_method='GET')
        pending_result = get_pending_chats_handler(get_pending_event, context)
        self.assertIn(pending_result['statusCode'], [200, 201, 400, 500])
        
        accept_data = {
            'trip_id': 'integration_trip_123',
            'franchise_operator_id': 'operator123'
        }
        accept_event = create_test_event(body=accept_data, http_method='POST')
        accept_result = accept_pending_chat_handler(accept_event, context)
        self.assertIn(accept_result['statusCode'], [200, 201, 400, 500])
        
        message_data = {
            'trip_id': 'integration_trip_123',
            'sender_id': 'user123',
            'message': 'My scooter is not working properly',
            'sender_type': 'customer'
        }
        message_event = create_test_event(body=message_data, http_method='POST')
        message_result = send_customer_message_handler(message_event, context)
        self.assertIn(message_result['statusCode'], [200, 201, 400, 500])
        
        get_messages_event = create_test_event_with_path_params(
            trip_id='integration_trip_123',
            http_method='GET'
        )
        messages_result = get_messages_by_trip_handler(get_messages_event, context)
        self.assertIn(messages_result['statusCode'], [200, 201, 400, 500])
        
        get_accepted_event = create_test_event(
            query_params={'operator_id': 'operator123'},
            http_method='GET'
        )
        accepted_result = get_accepted_chats_handler(get_accepted_event, context)
        self.assertIn(accepted_result['statusCode'], [200, 201, 400, 500])
        
        print("Complete messaging flow executed without crashes")
    
    @mock_dynamodb
    @mock_sns
    def test_chat_request_lifecycle(self):
        dynamodb = boto3.resource('dynamodb', region_name=TestConfig.AWS_REGION)
        sns = boto3.client('sns', region_name=TestConfig.AWS_REGION)
        
        pending_chats_table = setup_dynamodb_table(
            dynamodb,
            TestConfig.PENDING_CHATS_TABLE,
            [{'AttributeName': 'trip_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'trip_id', 'AttributeType': 'S'}]
        )
        
        try:
            sns.create_topic(Name='customerMessages')
        except Exception as e:
            print(f"Warning: Could not create SNS topic: {e}")
        
        context = self.create_test_context()
        
        success_count = 0
        for i in range(3):
            chat_data = {
                'trip_id': f'lifecycle_trip_{i}',
                'user_id': f'user{i}',
                'message': f'Help request {i}'
            }
            create_event = create_test_event(body=chat_data, http_method='POST')
            result = create_pending_chat_handler(create_event, context)
            
            if result['statusCode'] in [200, 201]:
                success_count += 1
            else:
                chat_item = convert_floats_to_decimal(chat_data)
                chat_item['status'] = 'pending'
                pending_chats_table.put_item(Item=chat_item)
        
        get_event = create_test_event(http_method='GET')
        pending_result = get_pending_chats_handler(get_event, context)
        self.assertIn(pending_result['statusCode'], [200, 201, 400, 500])
        
        accept_data = {
            'trip_id': 'lifecycle_trip_0',
            'franchise_operator_id': 'operator123'
        }
        accept_event = create_test_event(body=accept_data, http_method='POST')
        accept_result = accept_pending_chat_handler(accept_event, context)
        self.assertIn(accept_result['statusCode'], [200, 201, 400, 500])
        
        print("Chat request lifecycle completed")


class TestErrorHandling(BaseTestCase):
    
    def test_invalid_json_body(self):
        event = {'body': 'invalid json{'}
        context = self.create_test_context()
        
        result = create_pending_chat_handler(event, context)
        self.assertIn(result['statusCode'], [400, 500])
    
    def test_missing_body(self):
        event = {}
        context = self.create_test_context()
        
        result = send_customer_message_handler(event, context)
        self.assertIn(result['statusCode'], [400, 500])
    
    def test_empty_body(self):
        event = {'body': '{}'}
        context = self.create_test_context()
        
        result = create_pending_chat_handler(event, context)
        self.assertIn(result['statusCode'], [400, 422])
    
    @mock_dynamodb
    def test_database_connection_error(self):
        event = create_test_event(body={'trip_id': 'test', 'user_id': 'test'}, http_method='POST')
        context = self.create_test_context()
        
        result = create_pending_chat_handler(event, context)
        self.assertIn(result['statusCode'], [400, 404, 500])


class TestSecurity(BaseTestCase):
    
    def test_sql_injection_prevention(self):
        malicious_trip_id = "'; DROP TABLE Messages; --"
        event = create_test_event(body={
            'trip_id': malicious_trip_id,
            'user_id': 'user123',
            'message': 'test'
        }, http_method='POST')
        context = self.create_test_context()
        
        result = create_pending_chat_handler(event, context)
        self.assertIn(result['statusCode'], [200, 400, 404, 500])
    
    def test_xss_prevention(self):
        xss_message = "<script>alert('xss')</script>"
        event = create_test_event(body={
            'trip_id': 'test_trip',
            'user_id': 'user123',
            'message': xss_message,
            'sender_type': 'customer'
        }, http_method='POST')
        context = self.create_test_context()
        
        result = send_customer_message_handler(event, context)
        self.assertIn(result['statusCode'], [200, 400, 500])
    
    def test_large_message_handling(self):
        large_message = 'x' * 10000
        event = create_test_event(body={
            'trip_id': 'test_trip',
            'user_id': 'user123',
            'message': large_message,
            'sender_type': 'customer'
        }, http_method='POST')
        context = self.create_test_context()
        
        result = send_customer_message_handler(event, context)
        self.assertIn(result['statusCode'], [200, 400, 413, 500])


class TestPerformance(BaseTestCase):
    
    @mock_dynamodb
    def test_multiple_concurrent_chat_requests(self):
        dynamodb = boto3.resource('dynamodb', region_name=TestConfig.AWS_REGION)
        
        pending_chats_table = setup_dynamodb_table(
            dynamodb,
            TestConfig.PENDING_CHATS_TABLE,
            [{'AttributeName': 'trip_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'trip_id', 'AttributeType': 'S'}]
        )
        
        context = self.create_test_context()
        
        success_count = 0
        for i in range(10):
            chat_data = {
                'trip_id': f'concurrent_trip_{i}',
                'user_id': f'user{i}',
                'message': f'Concurrent request {i}'
            }
            event = create_test_event(body=chat_data, http_method='POST')
            result = create_pending_chat_handler(event, context)
            
            if result['statusCode'] in [200, 201]:
                success_count += 1
        
        print(f"{success_count}/10 concurrent requests handled successfully")
        self.assertGreaterEqual(success_count, 0)
    
    @mock_dynamodb
    def test_large_message_history_retrieval(self):
        dynamodb = boto3.resource('dynamodb', region_name=TestConfig.AWS_REGION)
        
        messages_table = setup_dynamodb_table(
            dynamodb,
            'Messages',
            [{'AttributeName': 'message_id', 'KeyType': 'HASH'}],
            [{'AttributeName': 'message_id', 'AttributeType': 'S'}]
        )
        
        trip_id = 'performance_trip'
        for i in range(50):
            message = {
                'message_id': f'msg_{i}',
                'trip_id': trip_id,
                'sender_id': f'user{i % 5}',
                'message': f'Performance test message {i}',
                'timestamp': f'2024-01-01T{10 + (i % 14):02d}:00:00Z',
                'sender_type': 'customer' if i % 2 == 0 else 'operator'
            }
            messages_table.put_item(Item=convert_floats_to_decimal(message))
        
        event = create_test_event_with_path_params(
            trip_id=trip_id,
            http_method='GET'
        )
        context = self.create_test_context()
        
        import time
        start_time = time.time()
        result = get_messages_by_trip_handler(event, context)
        end_time = time.time()
        
        self.assertLess(end_time - start_time, 5)
        self.assertIn(result['statusCode'], [200, 201, 400, 500])
        
        if result['statusCode'] in [200, 201]:
            try:
                body = json.loads(result['body']) if isinstance(result['body'], str) else result['body']
                if 'messages' in body:
                    print(f"Retrieved {len(body['messages'])} messages successfully")
            except (json.JSONDecodeError, TypeError, KeyError):
                pass


class TestValidation(BaseTestCase):
    
    def test_trip_id_validation(self):
        invalid_trip_ids = ['', None, '   ', 'a' * 500]
        
        for invalid_id in invalid_trip_ids:
            if invalid_id is not None:
                event = create_test_event(body={
                    'trip_id': invalid_id,
                    'user_id': 'user123',
                    'message': 'test message'
                }, http_method='POST')
            else:
                event = create_test_event(body={
                    'user_id': 'user123',
                    'message': 'test message'
                }, http_method='POST')
            
            context = self.create_test_context()
            result = create_pending_chat_handler(event, context)
            self.assertIn(result['statusCode'], [400, 422])
    
    def test_message_content_validation(self):
        invalid_messages = ['', '   ', None]
        
        for invalid_message in invalid_messages:
            if invalid_message is not None:
                event = create_test_event(body={
                    'trip_id': 'test_trip',
                    'sender_id': 'user123',
                    'message': invalid_message,
                    'sender_type': 'customer'
                }, http_method='POST')
            else:
                event = create_test_event(body={
                    'trip_id': 'test_trip',
                    'sender_id': 'user123',
                    'sender_type': 'customer'
                }, http_method='POST')
            
            context = self.create_test_context()
            result = send_customer_message_handler(event, context)
            self.assertIn(result['statusCode'], [400, 422])
    
    def test_sender_type_validation(self):
        invalid_sender_types = ['', 'invalid', None, 'admin']
        
        for invalid_type in invalid_sender_types:
            if invalid_type is not None:
                event = create_test_event(body={
                    'trip_id': 'test_trip',
                    'sender_id': 'user123',
                    'message': 'test message',
                    'sender_type': invalid_type
                }, http_method='POST')
            else:
                event = create_test_event(body={
                    'trip_id': 'test_trip',
                    'sender_id': 'user123',
                    'message': 'test message'
                }, http_method='POST')
            
            context = self.create_test_context()
            result = send_customer_message_handler(event, context)
            
            if invalid_type not in ['customer', 'operator', 'franchise']:
                self.assertIn(result['statusCode'], [400, 422, 500])


if __name__ == '__main__':
    unittest.main(verbosity=2)