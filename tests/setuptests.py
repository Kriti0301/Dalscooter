import os
import sys
import subprocess
import json
import platform


class TestEnvironmentSetup:
    """Setup and configure test environment"""
    
    def __init__(self):
        self.project_root = os.path.dirname(os.path.abspath(__file__))
        self.lambda_root = os.path.dirname(self.project_root)
        self.requirements_file = os.path.join(self.project_root, 'requirements.txt')
        self.config_file = os.path.join(self.project_root, 'test_config.json')
    
    def check_python_version(self):
        """Check if Python version is compatible"""
        print("Checking Python version...")
        
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 8):
            print(f" Python 3.8+ required. Current version: {version.major}.{version.minor}")
            return False
        
        print(f" Python version {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    
    def setup_environment_variables(self):
        """Set up necessary environment variables"""
        print("Setting up environment variables...")
        
        env_vars = {
            'AWS_DEFAULT_REGION': 'us-east-1',
            'AWS_REGION': 'us-east-1',
            'AWS_ACCESS_KEY_ID': 'testing',
            'AWS_SECRET_ACCESS_KEY': 'testing',
            'AWS_SECURITY_TOKEN': 'testing',
            'AWS_SESSION_TOKEN': 'testing',
            'UNIT_TESTS_ONLY': 'true',
            'PYTHONPATH': f"{self.lambda_root}:{os.environ.get('PYTHONPATH', '')}"
        }
        
        for key, value in env_vars.items():
            os.environ[key] = value
            print(f"  Set {key}")
        
        print(" Environment variables configured")
        return True
    
    def install_dependencies(self):
        """Install required Python packages"""
        print("Installing test dependencies...")
        
        if not os.path.exists(self.requirements_file):
            print(" requirements.txt not found")
            return False
        
        try:
            # Install requirements
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', '-r', self.requirements_file
            ])
            print(" Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f" Failed to install dependencies: {e}")
            return False
    
    def verify_lambda_structure(self):
        """Verify that Lambda function structure is correct"""
        print("Verifying Lambda function structure...")
        
        expected_modules = [
            'Authentication',
            'DataAnalysisVisualization', 
            'Messaging'
        ]
        
        missing_modules = []
        for module in expected_modules:
            module_path = os.path.join(self.lambda_root, module)
            if not os.path.exists(module_path):
                missing_modules.append(module)
        
        if missing_modules:
            print(f"  Missing Lambda modules: {', '.join(missing_modules)}")
            print("   Tests will use mock implementations")
        else:
            print(" All Lambda modules found")
        
        return True
    
    def create_test_config(self):
        """Create test configuration file"""
        print("Creating test configuration...")
        
        config = {
            "aws": {
                "region": "us-east-1",
                "tables": {
                    "users": "Users",
                    "feedbacks": "Feedbacks",
                    "trips": "Trips",
                    "scooters": "Scooters",
                    "pending_chats": "PendingChatRequests",
                    "user_sessions": "UserSessions",
                    "analytics": "Analytics"
                },
                "sns_topic_arn": "arn:aws:sns:us-east-1:395708543071:userNotification"
            },
            "test_settings": {
                "max_test_items": 100,
                "timeout_seconds": 30,
                "enable_performance_tests": True,
                "enable_security_tests": True,
                "enable_integration_tests": True
            },
            "mock_data": {
                "default_user_email": "test@example.com",
                "default_trip_id": "trip123",
                "default_scooter_id": "scooter123"
            }
        }
        
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            print(" Test configuration created")
            return True
        except Exception as e:
            print(f" Failed to create config file: {e}")
            return False
    
    def setup_test_directories(self):
        """Create necessary test directories"""
        print("Setting up test directories...")
        
        directories = [
            'logs',
            'reports', 
            'temp',
            '__pycache__'
        ]
        
        for directory in directories:
            dir_path = os.path.join(self.project_root, directory)
            os.makedirs(dir_path, exist_ok=True)
            
            # Create .gitignore for temporary directories
            if directory in ['logs', 'reports', 'temp', '__pycache__']:
                gitignore_path = os.path.join(dir_path, '.gitignore')
                if not os.path.exists(gitignore_path):
                    with open(gitignore_path, 'w') as f:
                        f.write("*\n!.gitignore\n")
        
        print(" Test directories created")
        return True
    
    def verify_imports(self):
        """Verify that key modules can be imported"""
        print("Verifying module imports...")
        
        test_imports = [
            ('boto3', 'AWS SDK'),
            ('moto', 'AWS Mocking'),
            ('unittest', 'Unit Testing Framework'),
            ('json', 'JSON Processing'),
            ('concurrent.futures', 'Concurrent Processing')
        ]
        
        failed_imports = []
        for module_name, description in test_imports:
            try:
                __import__(module_name)
                print(f"   {description}")
            except ImportError:
                print(f"   {description}")
                failed_imports.append(module_name)
        
        if failed_imports:
            print(f" Failed to import: {', '.join(failed_imports)}")
            return False
        
        print(" All required modules can be imported")
        return True
    
    def create_run_scripts(self):
        """Create platform-specific run scripts"""
        print("Creating run scripts...")
        
        # Windows batch script
        windows_script = """@echo off
echo Setting up environment for DALScooter tests...

set AWS_DEFAULT_REGION=us-east-1
set AWS_REGION=us-east-1
set AWS_ACCESS_KEY_ID=testing
set AWS_SECRET_ACCESS_KEY=testing
set AWS_SECURITY_TOKEN=testing
set AWS_SESSION_TOKEN=testing
set UNIT_TESTS_ONLY=true

echo Running all tests...
python run_all_tests.py

pause
"""
        
        # Unix shell script
        unix_script = """#!/bin/bash
echo "Setting up environment for DALScooter tests..."

export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=testing
export AWS_SECRET_ACCESS_KEY=testing
export AWS_SECURITY_TOKEN=testing
export AWS_SESSION_TOKEN=testing
export UNIT_TESTS_ONLY=true

echo "Running all tests..."
python3 run_all_tests.py
"""
        
        try:
            # Create Windows script
            with open(os.path.join(self.project_root, 'run_tests.bat'), 'w') as f:
                f.write(windows_script)
            
            # Create Unix script
            unix_script_path = os.path.join(self.project_root, 'run_tests.sh')
            with open(unix_script_path, 'w') as f:
                f.write(unix_script)
            
            # Make Unix script executable
            if platform.system() != 'Windows':
                os.chmod(unix_script_path, 0o755)
            
            print(" Run scripts created")
            return True
        except Exception as e:
            print(f" Failed to create run scripts: {e}")
            return False
    
    def run_verification_tests(self):
        """Run basic verification tests"""
        print("Running verification tests...")
        
        try:
            # Test AWS mocking
            from moto import mock_dynamodb
            import boto3
            
            with mock_dynamodb():
                dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
                table = dynamodb.create_table(
                    TableName='TestTable',
                    KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
                    AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
                    BillingMode='PAY_PER_REQUEST'
                )
                
                # Test basic operations
                table.put_item(Item={'id': 'test', 'data': 'verification'})
                response = table.get_item(Key={'id': 'test'})
                
                if response['Item']['data'] == 'verification':
                    print("   AWS mocking works correctly")
                else:
                    print("   AWS mocking test failed")
                    return False
            
            print(" Verification tests passed")
            return True
            
        except Exception as e:
            print(f" Verification tests failed: {e}")
            return False
    
    def setup_all(self):
        """Run complete setup process"""
        print("="*60)
        print("DALScooter Lambda Test Environment Setup")
        print("="*60)
        
        setup_steps = [
            ("Checking Python version", self.check_python_version),
            ("Setting up environment variables", self.setup_environment_variables),
            ("Installing dependencies", self.install_dependencies),
            ("Verifying Lambda structure", self.verify_lambda_structure),
            ("Creating test configuration", self.create_test_config),
            ("Setting up test directories", self.setup_test_directories),
            ("Verifying imports", self.verify_imports),
            ("Creating run scripts", self.create_run_scripts),
            ("Running verification tests", self.run_verification_tests)
        ]
        
        failed_steps = []
        for step_name, step_func in setup_steps:
            print(f"\n{step_name}...")
            if not step_func():
                failed_steps.append(step_name)
        
        print(f"\n{'='*60}")
        print("SETUP COMPLETE")
        print(f"{'='*60}")
        
        if failed_steps:
            print(f" Failed steps: {', '.join(failed_steps)}")
            print("  Some functionality may not work correctly")
            return False
        else:
            print("🎉 All setup steps completed successfully!")
            print("\nYou can now run tests using:")
            print("  • python run_all_tests.py")
            print("  • ./run_tests.sh (Unix/Linux/Mac)")
            print("  • .\\run_tests.bat (Windows)")
            return True


def main():
    """Main setup function"""
    setup = TestEnvironmentSetup()
    success = setup.setup_all()
    
    if not success:
        print("\n  Setup completed with warnings. Tests may still work.")
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())