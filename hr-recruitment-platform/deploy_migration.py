#!/usr/bin/env python3
"""
Deploy Updates to Supabase via Direct PostgreSQL Connection
"""

import psycopg2
import sys
import os

# Supabase connection details
DB_HOST = "aws-0-eu-west-2.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.niikshfoecitimepiifo"
DB_PASSWORD = "phoneBobby1kennethMano"

# Alternative connection string format
CONNECTION_STRING = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"

def read_sql_file(filepath):
    with open(filepath, 'r') as f:
        return f.read()

def execute_migration():
    print("=" * 60)
    print("🔧 DEPLOYMENT STARTED")
    print("=" * 60)
    
    try:
        print("\n📡 Connecting to Supabase PostgreSQL...")
        conn = psycopg2.connect(CONNECTION_STRING)
        conn.autocommit = True
        cursor = conn.cursor()
        print("✅ Connected successfully!\n")
        
        # Read the migration file
        migration_path = "migrations/update_create_tenant_function.sql"
        if not os.path.exists(migration_path):
             print(f"❌ File not found: {migration_path}")
             return False

        print(f"📖 Reading migration from: {migration_path}")
        migration_sql = read_sql_file(migration_path)
        
        # Execute the migration
        print("🚀 Executing migration...")
        cursor.execute(migration_sql)
        print("✅ Migration executed successfully!\n")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("🎉 DEPLOYMENT COMPLETE!")
        print("=" * 60)
        
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Database Error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = execute_migration()
    sys.exit(0 if success else 1)
