# DALScooter

A serverless scooter-rental platform built on AWS. Customers register, verify their identity with multi-factor authentication, find scooters, start and end trips, chat with franchise operators, and leave feedback. Franchise operators manage the scooter fleet, respond to customer chats, and view usage analytics.

Built as a team project at Dalhousie University.

---

## Features

**Customers**
- Registration and login through Amazon Cognito
- Three-step login: password, then a security question, then a Caesar-cipher challenge
- Browse available scooters and view them on a map (Mapbox)
- Start and end trips, and view trip history
- Request a chat with a franchise operator and message them about a trip
- Submit feedback and read public reviews
- A Dialogflow chatbot that answers questions about users, trips and scooter locations

**Franchise operators**
- Create, update and delete scooters in the fleet
- Accept customer chat requests and reply
- Analytics dashboard (users, trips, scooters, logins, feedback)

**Notifications**
- Email notifications sent through an SNS topic → SQS queue → Lambda pipeline

---

## Architecture

```
React frontend (Cognito auth, Mapbox, Dialogflow widget)
        │
        ▼
Amazon API Gateway (HTTP API, Cognito JWT authorizer)
        │
        ▼
AWS Lambda functions (Python 3.9, plus one Node.js function)
        │
        ├── Amazon DynamoDB (9 tables)
        ├── Amazon Cognito (user pool, "User" and "Franchise" groups)
        └── Amazon SNS → Amazon SQS → email Lambda (SMTP)

Google Cloud Function: Dialogflow webhook that calls the AWS API
```

All AWS resources are defined in a single CloudFormation template: `AWSLambda/Cloudformation/group4.yml`. The template contains about 30 Lambda functions, the HTTP API with its routes, 9 DynamoDB tables, the Cognito user pool, and the SNS/SQS notification pipeline. The Lambda code is embedded inline in the template, so it deploys as one stack.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Create React App), React Router, Tailwind CSS, Material UI, Formik + Yup, Axios, SWR |
| Auth | Amazon Cognito (`amazon-cognito-identity-js`) |
| Maps | Mapbox GL |
| Backend | AWS Lambda (Python 3.9; one Node.js 22 function), Amazon API Gateway HTTP API |
| Database | Amazon DynamoDB |
| Messaging | Amazon SNS, Amazon SQS |
| Chatbot | Google Dialogflow with a Google Cloud Function webhook (Node.js) |
| Infrastructure | AWS CloudFormation |
| Container | Docker (multi-stage build: Node build → nginx) for the frontend |
| Testing | Python `unittest` with `moto` (mocked AWS services) |

---

## Repository structure

```
.
├── AWSLambda/
│   ├── Authentication/              # Registration, security question, cipher key, Cognito group assignment
│   ├── Messaging/                   # Customer ↔ franchise chat requests and messages
│   ├── DataAnalysisVisualization/   # Feedback and analytics endpoints
│   ├── Notifications/               # Email helper
│   └── Cloudformation/group4.yml    # Full AWS stack definition
├── frontend/                        # React app + Dockerfile + nginx config
├── GCP/                             # Dialogflow webhook (Google Cloud Function)
├── customer-api/                    # Small Express API (customer last ride / concerns)
└── tests/                           # Python unit tests for the Lambda functions
```

---

## Running the project

> **Note:** The backend runs on AWS. Running the full system requires an AWS account to deploy the CloudFormation stack. The template expects an existing IAM role (it defaults to `LabRole`, as provided in AWS Academy).

### 1. Deploy the backend (AWS)

```bash
aws cloudformation deploy \
  --template-file AWSLambda/Cloudformation/group4.yml \
  --stack-name dalscooter \
  --parameter-overrides \
      SmtpHostParameter=smtp.gmail.com \
      SmtpUserParameter=<your-email> \
      SmtpPassParameter=<your-app-password> \
      SenderEmailParameter=<sender-email> \
      LabRoleArn=<arn-of-an-iam-role-for-lambda>
```

The stack outputs `HttpApiUrl`, `UserPoolId` and `UserPoolClientId`. The frontend needs these.

### 2. Run the frontend

Requirements: Node.js 18 or newer.

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
REACT_APP_BACKEND_BASE_URL=<HttpApiUrl from the stack outputs>
REACT_APP_USER_POOL_ID=<UserPoolId>
REACT_APP_CLIENT_ID=<UserPoolClientId>
REACT_APP_MAPBOX_TOKEN=<your Mapbox public token>
```

Then:

```bash
npm start      # development server on http://localhost:3000
npm run build  # production build
```

### 3. Run the frontend with Docker (optional)

```bash
cd frontend
docker build \
  --build-arg REACT_APP_BACKEND_BASE_URL=<HttpApiUrl> \
  --build-arg REACT_APP_USER_POOL_ID=<UserPoolId> \
  --build-arg REACT_APP_CLIENT_ID=<UserPoolClientId> \
  --build-arg REACT_APP_MAPBOX_TOKEN=<token> \
  -t dalscooter-frontend .
docker run -p 8080:80 dalscooter-frontend
```

---

## Tests

The `tests/` folder contains about 86 unit tests for the Lambda functions, covering authentication, messaging, data analysis, and security/performance checks. They use `moto` to mock DynamoDB, SNS, SQS and Comprehend, so no real AWS account is needed.

```bash
cd tests
python -m venv venv && source venv/bin/activate
pip install boto3 "moto[dynamodb,sns,sqs,comprehend]<5" pytest coverage
UNIT_TESTS_ONLY=true AWS_DEFAULT_REGION=us-east-1 \
AWS_ACCESS_KEY_ID=testing AWS_SECRET_ACCESS_KEY=testing \
python main.py
```

The tests were written against `moto` 4.x. `moto` 5 removed the per-service decorators (`mock_dynamodb` and similar) that they use.

---

## Known limitations

- The full system needs an AWS deployment. There is no local or offline backend mode.
- `frontend/src/App.test.js` is still the default Create React App placeholder test and does not reflect the real app.
- The test dependencies need `moto` < 5. `tests/requirements.txt` also lists `decimal` and `concurrent.futures`, which are part of Python's standard library and should not be installed with pip.
- `customer-api/` is a small, standalone prototype and is not wired into the CloudFormation stack.
