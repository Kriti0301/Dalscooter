import json
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.environ.get("SMTP_HOST")       # e.g. smtp.gmail.com
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))  # usually 587 for TLS
SMTP_USER = os.environ.get("SMTP_USER")       # your SMTP username/email
SMTP_PASS = os.environ.get("SMTP_PASS")       # your SMTP password or app password
SENDER_EMAIL = os.environ.get("SENDER_EMAIL") # e.g. no-reply@dalscooter.com

def lambda_handler(event, context):
    print("Received event:", json.dumps(event, indent=2))

    for record in event['Records']:
        try:
            sns_message = json.loads(record['Sns']['Message'])
            recipient = sns_message['to']
            subject = sns_message['subject']
            body = sns_message['body']

            print(f"Sending email to {recipient}...")

            # Create email message
            msg = MIMEMultipart()
            msg['From'] = SENDER_EMAIL
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            # Send email via SMTP
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SENDER_EMAIL, recipient, msg.as_string())

            print(f"Email successfully sent to {recipient}")

        except Exception as e:
            print(f"Error sending email: {e}")
            continue

    return {
        'statusCode': 200,
        'body': json.dumps('All messages processed.')
    }
