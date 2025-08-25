# Tests Directory

This directory contains unit tests for the DALScooter Lambda functions.

## Structure

- `testauthentication.py` - Tests for authentication module
- `testdataanalysis.py` - Tests for data analysis and visualization module  
- `testmessaging.py` - Tests for messaging module
- `testsecurityperformance.py` - Security and performance tests
- `testbaseconfig.py` - Base configuration and utilities for tests
- `main.py` - Main test runner script

## Running Tests

```bash
$env:AWS_DEFAULT_REGION="us-east-1"
$env:AWS_REGION="us-east-1" 
$env:AWS_ACCESS_KEY_ID="testing"
$env:AWS_SECRET_ACCESS_KEY="testing"
$env:AWS_SECURITY_TOKEN="testing"
$env:AWS_SESSION_TOKEN="testing"
$env:UNIT_TESTS_ONLY="true"

python main.py
```

## Requirements

Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

Test settings are in `test_config.json`. Environment variables are set automatically during test runs.