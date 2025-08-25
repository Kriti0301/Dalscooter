#!/bin/bash
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
