#!/usr/bin/env python3
"""
Deploy Compliance Schema to Supabase via Direct PostgreSQL Connection
"""

import psycopg2
import sys

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

def execute_schema():
    print("=" * 60)
    print("🔧 COMPLIANCE SCHEMA DEPLOYMENT")
    print("=" * 60)
    print(f"Host: {DB_HOST}")
    print(f"Database: {DB_NAME}")
    print("=" * 60)
    
    try:
        print("\n📡 Connecting to Supabase PostgreSQL...")
        conn = psycopg2.connect(CONNECTION_STRING)
        conn.autocommit = True
        cursor = conn.cursor()
        print("✅ Connected successfully!\n")
        
        # Read the schema file
        schema_path = "src/lib/compliance/complianceSchema.sql"
        print(f"📖 Reading schema from: {schema_path}")
        schema_sql = read_sql_file(schema_path)
        print(f"   Schema size: {len(schema_sql)} characters\n")
        
        # Execute the schema
        print("🚀 Executing schema...")
        cursor.execute(schema_sql)
        print("✅ Schema executed successfully!\n")
        
        # Read and execute sample data
        sample_path = "src/lib/compliance/sampleData.sql"
        print(f"📖 Reading sample data from: {sample_path}")
        sample_sql = read_sql_file(sample_path)
        print(f"   Sample data size: {len(sample_sql)} characters\n")
        
        print("🚀 Executing sample data...")
        cursor.execute(sample_sql)
        print("✅ Sample data inserted successfully!\n")
        
        # Verify tables were created
        print("📋 Verifying tables created:")
        tables = [
            'compliance_persons',
            'compliance_documents',
            'compliance_document_types',
            'compliance_folders',
            'compliance_checklists',
            'compliance_tasks',
            'compliance_notifications',
            'compliance_audit_log',
            'compliance_sync_log',
            'compliance_stage_history'
        ]
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   ✅ {table}: {count} rows")
        
        # Check views
        print("\n📋 Verifying views:")
        cursor.execute("SELECT COUNT(*) FROM v_compliance_status")
        print(f"   ✅ v_compliance_status: {cursor.fetchone()[0]} rows")
        
        cursor.execute("SELECT COUNT(*) FROM v_expiring_documents")
        print(f"   ✅ v_expiring_documents: {cursor.fetchone()[0]} rows")
        
        # Check functions
        print("\n📋 Verifying functions:")
        cursor.execute("""
            SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name LIKE '%compliance%'
        """)
        functions = cursor.fetchall()
        for func in functions:
            print(f"   ✅ {func[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("🎉 DEPLOYMENT COMPLETE!")
        print("=" * 60)
        print("\nAll compliance tables, views, and functions are now live.")
        print("Sample data has been inserted for testing.")
        print("\nYou can now access the Compliance Hub at /compliance-hub")
        print("=" * 60)
        
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Database Error: {e}")
        print(f"   Error Code: {e.pgcode if hasattr(e, 'pgcode') else 'N/A'}")
        return False
    except FileNotFoundError as e:
        print(f"\n❌ File not found: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = execute_schema()
    sys.exit(0 if success else 1)
