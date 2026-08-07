#!/usr/bin/env python3
"""
Test Twilio SMS and Verify Service Configuration
"""
import requests
import base64
import json
import sys
from dotenv import load_dotenv
import os

# Load .env configuration
base_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(base_dir, 'backend', '.env'))
load_dotenv(os.path.join(base_dir, '.env'))

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER')
TWILIO_SERVICE_ID = os.getenv('TWILIO_SERVICE_ID')

print("=" * 60)
print("TWILIO CONFIGURATION TEST")
print("=" * 60)
print(f"Account SID:  {TWILIO_ACCOUNT_SID}")
print(f"Auth Token:   {'*' * len(TWILIO_AUTH_TOKEN) if TWILIO_AUTH_TOKEN else 'NOT SET'} ({len(TWILIO_AUTH_TOKEN) if TWILIO_AUTH_TOKEN else 0} chars)")
print(f"From Number:  {TWILIO_FROM_NUMBER}")
print(f"Service ID:   {TWILIO_SERVICE_ID}")
print("=" * 60)

if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_SERVICE_ID]):
    print("\n❌ ERROR: Missing Twilio credentials in .env")
    sys.exit(1)

# Create basic auth header
auth_string = f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}"
auth_bytes = base64.b64encode(auth_string.encode()).decode()
headers = {
    "Authorization": f"Basic {auth_bytes}",
    "Content-Type": "application/x-www-form-urlencoded"
}

print("\n[1] Testing Twilio Account Authentication...")
try:
    response = requests.get(
        f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}.json",
        headers=headers,
        timeout=10
    )
    if response.status_code == 200:
        account_info = response.json()
        print(f"    ✅ Authentication successful!")
        print(f"       Account Status: {account_info.get('status')}")
        print(f"       Account Balance: ${account_info.get('balance')}")
    else:
        print(f"    ❌ Authentication failed: {response.status_code}")
        print(f"       Response: {response.text}")
        sys.exit(1)
except Exception as e:
    print(f"    ❌ Error: {e}")
    sys.exit(1)

print("\n[2] Testing Twilio Verify Service...")
try:
    response = requests.get(
        f"https://verify.twilio.com/v2/Services/{TWILIO_SERVICE_ID}",
        headers=headers,
        timeout=10
    )
    if response.status_code == 200:
        service_info = response.json()
        print(f"    ✅ Verify Service found!")
        print(f"       Service SID: {service_info.get('sid')}")
        print(f"       Friendly Name: {service_info.get('friendly_name')}")
    else:
        print(f"    ❌ Service not found: {response.status_code}")
        print(f"       Response: {response.text}")
except Exception as e:
    print(f"    ❌ Error: {e}")

print("\n[3] Testing Twilio Phone Number...")
try:
    response = requests.get(
        f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json",
        headers=headers,
        timeout=10
    )
    if response.status_code == 200:
        phone_numbers = response.json()
        print(f"    ✅ Retrieved phone numbers")
        print(f"       Total numbers: {len(phone_numbers.get('incoming_phone_numbers', []))}")
        
        found = False
        for phone in phone_numbers.get('incoming_phone_numbers', []):
            print(f"         - {phone.get('phone_number')} ({phone.get('friendly_name')})")
            if TWILIO_FROM_NUMBER in phone.get('phone_number', ''):
                found = True
                print(f"           ✅ This is your FROM_NUMBER")
        
        if not found:
            print(f"    ⚠️  WARNING: {TWILIO_FROM_NUMBER} not found in your numbers!")
    else:
        print(f"    ❌ Failed to retrieve numbers: {response.status_code}")
except Exception as e:
    print(f"    ❌ Error: {e}")

print("\n[4] Testing SMS Send (Simulate)...")
print("    📝 To test actual SMS sending, provide a phone number to send to:")
print("       python test_twilio_sms.py +1234567890")
if len(sys.argv) > 1:
    test_phone = sys.argv[1]
    print(f"\n    Sending test SMS to {test_phone}...")
    
    payload = {
        "From": TWILIO_FROM_NUMBER,
        "To": test_phone,
        "Body": "Cyvanta Test SMS: Your OTP code is 123456"
    }
    
    try:
        response = requests.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
            headers=headers,
            data=payload,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            msg_info = response.json()
            print(f"    ✅ SMS sent successfully!")
            print(f"       Message SID: {msg_info.get('sid')}")
            print(f"       Status: {msg_info.get('status')}")
        else:
            print(f"    ❌ SMS send failed: {response.status_code}")
            print(f"       Response: {response.text}")
    except Exception as e:
        print(f"    ❌ Error: {e}")

print("\n" + "=" * 60)
print("Configuration test complete!")
print("=" * 60)
