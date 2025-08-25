import json
import boto3
from collections import Counter
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
SCOOTERS_TABLE = dynamodb.Table('Scooters')

def lambda_handler(event, context):
    # Get scooters analytics from Scooters table
    
    try:
        # Scan all scooters
        response = SCOOTERS_TABLE.scan()
        scooters = response.get('Items', [])
        
        if not scooters:
            return create_response(200, {
                'total_scooters': 0,
                'scooters_by_status': {},
                'fleet_health': {}
            })
        
        # Calculate analytics
        total_scooters = len(scooters)
        
        # Status breakdown
        statuses = [scooter['status'] for scooter in scooters]
        status_counts = Counter(statuses)
        
        # Status distribution with percentages
        status_percentages = {}
        for status, count in status_counts.items():
            status_percentages[status] = {
                'count': count,
                'percentage': round((count / total_scooters) * 100, 1) if total_scooters > 0 else 0
            }
        
        # Fleet health metrics
        available_count = status_counts.get('available', 0)
        in_use_count = status_counts.get('in_use', 0)
        maintenance_count = status_counts.get('maintenance', 0)
        
        fleet_utilization = round((in_use_count / total_scooters) * 100, 1) if total_scooters > 0 else 0
        availability_rate = round((available_count / total_scooters) * 100, 1) if total_scooters > 0 else 0
        
        # Battery analysis (from metadata)
        battery_levels = []
        models = []
        
        for scooter in scooters:
            if 'metadata' in scooter and scooter['metadata']:
                try:
                    # Parse metadata string (appears to be JSON-like)
                    metadata_str = scooter['metadata']
                    if 'battery' in metadata_str:
                        # Extract battery level
                        import re
                        battery_match = re.search(r'"battery":\{"N":"(\d+)"\}', metadata_str)
                        if battery_match:
                            battery_levels.append(int(battery_match.group(1)))
                    
                    if 'model' in metadata_str:
                        # Extract model 
                        model_match = re.search(r'"model":\{"S":"([^"]+)"\}', metadata_str)
                        if model_match:
                            models.append(model_match.group(1))
                except:
                    pass
        
        # Battery statistics
        if battery_levels:
            avg_battery = round(sum(battery_levels) / len(battery_levels), 1)
            low_battery_count = len([b for b in battery_levels if b < 30])
            battery_stats = {
                'average_battery_level': avg_battery,
                'low_battery_scooters': low_battery_count,
                'battery_ranges': {
                    'critical_0_20': len([b for b in battery_levels if 0 <= b < 20]),
                    'low_20_50': len([b for b in battery_levels if 20 <= b < 50]),
                    'good_50_80': len([b for b in battery_levels if 50 <= b < 80]),
                    'excellent_80_100': len([b for b in battery_levels if 80 <= b <= 100])
                }
            }
        else:
            battery_stats = {
                'average_battery_level': 0,
                'low_battery_scooters': 0,
                'battery_ranges': {'critical_0_20': 0, 'low_20_50': 0, 'good_50_80': 0, 'excellent_80_100': 0}
            }
        
        # Model distribution
        model_counts = Counter(models) if models else {}
        model_distribution = {model: count for model, count in model_counts.most_common()}
        
        # Franchise distribution
        franchises = [scooter['franchise_id'] for scooter in scooters if 'franchise_id' in scooter]
        franchise_counts = Counter(franchises)
        
        analytics_data = {
            'total_scooters': total_scooters,
            'scooters_by_status': status_percentages,
            'fleet_health': {
                'fleet_utilization_rate': fleet_utilization,
                'availability_rate': availability_rate,
                'maintenance_rate': round((maintenance_count / total_scooters) * 100, 1) if total_scooters > 0 else 0
            },
            'battery_analytics': battery_stats,
            'model_distribution': model_distribution,
            'franchise_distribution': {
                'total_franchises': len(franchise_counts),
                'scooters_per_franchise': dict(franchise_counts)
            },
            'operational_summary': {
                'ready_for_use': available_count,
                'currently_rented': in_use_count,
                'needs_attention': maintenance_count
            },
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        logger.info(f"Generated scooter analytics for {total_scooters} scooters")
        return create_response(200, analytics_data)
        
    except Exception as e:
        logger.error(f"Error generating scooter analytics: {str(e)}")
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