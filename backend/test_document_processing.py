#!/usr/bin/env python
"""
Quick test script for AI/OCR document processing functionality
Usage: python test_document_processing.py
"""

import requests
from requests.auth import HTTPBasicAuth
import json
import time
import sys

# Configuration
BASE_URL = "http://localhost:8000/api"

def print_header(text):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def test_connection():
    """Test if server is running"""
    print_header("Testing Server Connection")
    try:
        response = requests.get(f"{BASE_URL}/organizations/", timeout=5)
        if response.status_code in [200, 401]:  # 401 is ok, means server is up
            print_success("Server is running at http://localhost:8000")
            return True
        else:
            print_error(f"Server returned unexpected status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to server. Make sure it's running:")
        print("  python manage.py runserver")
        return False
    except Exception as e:
        print_error(f"Connection error: {str(e)}")
        return False

def get_credentials():
    """Get user credentials"""
    print_header("Authentication")
    print_info("Enter your superuser credentials:")
    username = input("Username: ")
    password = input("Password: ")
    return username, password

def test_authentication(username, password):
    """Test if credentials are valid"""
    try:
        response = requests.get(
            f"{BASE_URL}/organizations/",
            auth=HTTPBasicAuth(username, password)
        )
        if response.status_code == 200:
            print_success("Authentication successful")
            return True
        elif response.status_code == 401:
            print_error("Invalid credentials")
            return False
        else:
            print_error(f"Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Authentication error: {str(e)}")
        return False

def list_organizations(auth):
    """List all organizations"""
    print_header("Available Organizations")
    try:
        response = requests.get(f"{BASE_URL}/organizations/", auth=auth)
        if response.status_code == 200:
            data = response.json()
            orgs = data.get('results', [])
            if orgs:
                print_info(f"Found {len(orgs)} organization(s):")
                for org in orgs:
                    print(f"  [{org['id']}] {org['name']} - {org['district']}")
                return orgs
            else:
                print_error("No organizations found. Please create one in admin panel:")
                print("  http://localhost:8000/admin/core/organization/add/")
                return []
        else:
            print_error(f"Failed to fetch organizations: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return []

def upload_document(auth, org_id, file_path):
    """Upload a PDF document"""
    print_header("Uploading Document")
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'organization': org_id}
            
            response = requests.post(
                f"{BASE_URL}/documents/",
                files=files,
                data=data,
                auth=auth
            )
            
            if response.status_code == 201:
                document = response.json()
                print_success(f"Document uploaded successfully!")
                print_info(f"Document ID: {document['id']}")
                print_info(f"Status: {document['status']}")
                print_info(f"File: {document['file']}")
                return document
            else:
                print_error(f"Upload failed: {response.status_code}")
                print(f"Response: {response.text}")
                return None
    except FileNotFoundError:
        print_error(f"File not found: {file_path}")
        return None
    except Exception as e:
        print_error(f"Upload error: {str(e)}")
        return None

def process_with_ai(auth, document_id):
    """Process document with AI"""
    print_header("Processing with AI")
    print_info("This may take 10-20 seconds...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/documents/{document_id}/process_with_ai/",
            auth=auth
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success("AI processing completed!")
            
            if 'data' in result and 'data' in result['data']:
                ai_data = result['data']['data']
                sections = ai_data.get('sections', [])
                
                print_info(f"Extracted {len(sections)} section(s):")
                total_items = 0
                for section in sections:
                    items = section.get('items', [])
                    total_items += len(items)
                    print(f"\n  📁 {section['name']}")
                    print(f"     Items: {len(items)}")
                    
                    # Show first 3 items
                    for item in items[:3]:
                        print(f"     - {item['name']}: {item['quantity_required']} {item['unit']} ({item['priority']})")
                    
                    if len(items) > 3:
                        print(f"     ... and {len(items) - 3} more items")
                
                print_info(f"Total items extracted: {total_items}")
            
            return result
        else:
            print_error(f"AI processing failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Processing error: {str(e)}")
        return None

def approve_and_create(auth, document_id):
    """Approve and create need items"""
    print_header("Approving and Creating Needs")
    
    try:
        response = requests.post(
            f"{BASE_URL}/documents/{document_id}/approve_and_create_needs/",
            auth=auth
        )
        
        if response.status_code == 201:
            result = response.json()
            print_success(result['message'])
            return True
        else:
            print_error(f"Approval failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Approval error: {str(e)}")
        return False

def view_hierarchy(auth, org_id):
    """View organization hierarchy with needs"""
    print_header("Organization Hierarchy")
    
    try:
        response = requests.get(
            f"{BASE_URL}/organizations/{org_id}/hierarchy/",
            auth=auth
        )
        
        if response.status_code == 200:
            org = response.json()
            print_success(f"Organization: {org['name']}")
            print_info(f"District: {org['district']}")
            print_info(f"Registration: {org['registration_number']}")
            
            sections = org.get('sections', [])
            print(f"\n📊 Total Sections: {len(sections)}")
            
            for section in sections:
                needs = section.get('needs', [])
                print(f"\n  📁 {section['name']}")
                print(f"     Needs: {len(needs)}")
                
                # Group by priority
                critical = [n for n in needs if n['priority'] == 'CRITICAL']
                essential = [n for n in needs if n['priority'] == 'ESSENTIAL']
                nice = [n for n in needs if n['priority'] == 'NICE']
                
                if critical:
                    print(f"     🔴 Critical: {len(critical)}")
                if essential:
                    print(f"     🟡 Essential: {len(essential)}")
                if nice:
                    print(f"     🟢 Nice to have: {len(nice)}")
                
                # Show some examples
                for need in needs[:2]:
                    print(f"     - {need['name']}: {need['quantity_required']}/{need['quantity_received']} {need['unit']}")
            
            return True
        else:
            print_error(f"Failed to get hierarchy: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def main():
    """Main test workflow"""
    print("\n" + "🚀" * 30)
    print("  AI/OCR Document Processing Test Script")
    print("🚀" * 30)
    
    # Test server connection
    if not test_connection():
        sys.exit(1)
    
    # Get credentials
    username, password = get_credentials()
    auth = HTTPBasicAuth(username, password)
    
    # Test authentication
    if not test_authentication(username, password):
        sys.exit(1)
    
    # List organizations
    orgs = list_organizations(auth)
    if not orgs:
        print_error("\nPlease create an organization first, then run this script again.")
        sys.exit(1)
    
    # Select organization
    if len(orgs) == 1:
        org_id = orgs[0]['id']
        print_info(f"Using organization: {orgs[0]['name']}")
    else:
        while True:
            try:
                org_id = int(input("\nEnter organization ID: "))
                if any(org['id'] == org_id for org in orgs):
                    break
                else:
                    print_error("Invalid organization ID")
            except ValueError:
                print_error("Please enter a number")
    
    # Get PDF file path
    print_header("PDF Document")
    print_info("Enter the path to your PDF file:")
    print("  Example: C:\\Users\\YourName\\Documents\\hospital_needs.pdf")
    file_path = input("PDF file path: ").strip().strip('"')
    
    # Upload document
    document = upload_document(auth, org_id, file_path)
    if not document:
        sys.exit(1)
    
    document_id = document['id']
    
    # Process with AI
    time.sleep(1)
    result = process_with_ai(auth, document_id)
    if not result:
        sys.exit(1)
    
    # Ask for approval
    print_header("Approval")
    response = input("\nDo you want to approve and create these needs? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        time.sleep(1)
        if approve_and_create(auth, document_id):
            # View final hierarchy
            time.sleep(1)
            view_hierarchy(auth, org_id)
            
            print_header("Success!")
            print_success("Document processing completed successfully!")
            print_info(f"View results at: http://localhost:8000/admin/core/needitem/")
            print_info(f"View organization: http://localhost:8000/admin/core/organization/{org_id}/change/")
        else:
            print_error("Failed to create needs")
    else:
        print_info("Skipped approval. Document status is PROCESSED.")
        print_info(f"You can approve later via API or admin panel.")
    
    print("\n" + "🎉" * 30)
    print("  Test Complete!")
    print("🎉" * 30 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
