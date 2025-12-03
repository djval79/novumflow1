import os
import json
import requests
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env")
    exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def print_header(title):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def test_subdomain_check():
    print_header("Test 1: Subdomain Availability Check")
    
    # 1. Check available subdomain
    subdomain = f"test-tenant-{int(time.time())}"
    url = f"{SUPABASE_URL}/rest/v1/rpc/check_subdomain_availability"
    response = requests.post(url, headers=HEADERS, json={"p_subdomain": subdomain})
    
    if response.status_code == 200 and response.json() is True:
        print(f"✅ Available subdomain '{subdomain}' check passed")
    else:
        print(f"❌ Available subdomain check failed: {response.text}")

    # 2. Check taken subdomain (assuming 'ringsteadcare' exists from migration)
    taken_subdomain = "ringsteadcare"
    response = requests.post(url, headers=HEADERS, json={"p_subdomain": taken_subdomain})
    
    if response.status_code == 200 and response.json() is False:
        print(f"✅ Taken subdomain '{taken_subdomain}' check passed")
    else:
        print(f"❌ Taken subdomain check failed: {response.text}")

def test_tenant_creation_flow():
    print_header("Test 2: Tenant Creation Flow")
    
    # Note: This requires an authenticated user. 
    # For this test, we'll simulate the RPC call if we had a user token, 
    # but since we only have the anon key, we might be limited unless we use the service role key 
    # or sign in a test user first.
    
    # Let's try to sign in the test user created earlier
    auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    auth_data = {
        "email": "yodkzlfx@minimax.com",
        "password": "cqRCDI0hU6"
    }
    
    auth_response = requests.post(auth_url, headers=HEADERS, json=auth_data)
    
    if auth_response.status_code != 200:
        print(f"⚠️ Skipping Tenant Creation Test: Could not login test user ({auth_response.text})")
        return

    access_token = auth_response.json()["access_token"]
    user_id = auth_response.json()["user"]["id"]
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {access_token}"
    
    print(f"Logged in as user: {user_id}")

    # Create Tenant
    tenant_name = f"Test Corp {int(time.time())}"
    subdomain = f"test-corp-{int(time.time())}"
    
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/create_tenant"
    payload = {
        "p_name": tenant_name,
        "p_subdomain": subdomain,
        "p_owner_user_id": user_id
    }
    
    response = requests.post(rpc_url, headers=auth_headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Tenant created successfully: {result}")
        
        if isinstance(result, dict):
            tenant_id = result.get('id')
        else:
            tenant_id = result
            
        # Verify membership
        membership_url = f"{SUPABASE_URL}/rest/v1/user_tenant_memberships?tenant_id=eq.{tenant_id}&user_id=eq.{user_id}"
        mem_response = requests.get(membership_url, headers=auth_headers)
        
        if mem_response.status_code == 200 and len(mem_response.json()) > 0:
             print(f"✅ User membership verified for tenant {tenant_id}")
        else:
             print(f"❌ User membership not found for tenant {tenant_id}. Response: {mem_response.text}")
             
    else:
        print(f"❌ Tenant creation failed: {response.text}")

def run_tests():
    try:
        test_subdomain_check()
        test_tenant_creation_flow()
        print("\n✅ Backend Verification Complete")
    except Exception as e:
        print(f"\n❌ An error occurred: {str(e)}")

if __name__ == "__main__":
    run_tests()
