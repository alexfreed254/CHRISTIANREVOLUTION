from supabase import create_client, Client
import os
import sys

# Get environment variables
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Validate required environment variables
if not url or not key:
    print("ERROR: Missing required environment variables!")
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY")
    if os.environ.get("ENVIRONMENT") == "production":
        sys.exit(1)
    else:
        print("WARNING: Running in development mode without proper configuration")
else:
    print(f"✅ Supabase URL configured: {url[:30]}...")
    print(f"✅ Supabase Key configured: {key[:20]}...")

# Create Supabase client
try:
    supabase: Client = create_client(url, key)
    print("✅ Supabase client created successfully!")
    
    # Test connection with a simple query
    try:
        test_result = supabase.table("members").select("id").limit(1).execute()
        print(f"✅ Database connection test successful! (Found {len(test_result.data)} rows)")
    except Exception as test_error:
        print(f"⚠️  Database connection test failed: {test_error}")
        print("This might indicate RLS policy issues or missing table")
        
except Exception as e:
    print(f"ERROR: Failed to create Supabase client: {e}")
    if os.environ.get("ENVIRONMENT") == "production":
        sys.exit(1)
    raise