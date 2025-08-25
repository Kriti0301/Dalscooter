@echo off
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
