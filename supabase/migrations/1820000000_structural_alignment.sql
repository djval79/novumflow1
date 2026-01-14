
-- Structural Alignment Bridge
-- This migration fixes column name mismatches between early migrations (20251219) 
-- and later migrations/frontend expectations (20251220).

-- 1. Fix careflow_assets
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careflow_assets') THEN
        -- Rename asset_type to category
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'category') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'asset_type') THEN
                ALTER TABLE careflow_assets RENAME COLUMN asset_type TO category;
            ELSE
                ALTER TABLE careflow_assets ADD COLUMN category TEXT NOT NULL DEFAULT 'other';
            END IF;
        END IF;

        -- Rename assigned_to_staff to assigned_to
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'assigned_to') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'assigned_to_staff') THEN
                ALTER TABLE careflow_assets RENAME COLUMN assigned_to_staff TO assigned_to;
            ELSE
                ALTER TABLE careflow_assets ADD COLUMN assigned_to UUID;
            END IF;
        END IF;

        -- Rename maintenance_notes to notes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'notes') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'maintenance_notes') THEN
                ALTER TABLE careflow_assets RENAME COLUMN maintenance_notes TO notes;
            ELSE
                ALTER TABLE careflow_assets ADD COLUMN notes TEXT;
            END IF;
        END IF;

        -- Rename date columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'last_maintenance') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'last_maintenance_date') THEN
                ALTER TABLE careflow_assets RENAME COLUMN last_maintenance_date TO last_maintenance;
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'next_maintenance') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'next_maintenance_date') THEN
                ALTER TABLE careflow_assets RENAME COLUMN next_maintenance_date TO next_maintenance;
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'warranty_expires') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_assets' AND column_name = 'warranty_expiry') THEN
                ALTER TABLE careflow_assets RENAME COLUMN warranty_expiry TO warranty_expires;
            END IF;
        END IF;
    END IF;
END $$;

-- 2. Fix careflow_inventory
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careflow_inventory') THEN
        -- Rename current_stock to quantity
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_inventory' AND column_name = 'quantity') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_inventory' AND column_name = 'current_stock') THEN
                ALTER TABLE careflow_inventory RENAME COLUMN current_stock TO quantity;
            ELSE
                ALTER TABLE careflow_inventory ADD COLUMN quantity INTEGER DEFAULT 0;
            END IF;
        END IF;

        -- Rename minimum_stock to min_stock_level
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_inventory' AND column_name = 'min_stock_level') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_inventory' AND column_name = 'minimum_stock') THEN
                ALTER TABLE careflow_inventory RENAME COLUMN minimum_stock TO min_stock_level;
            ELSE
                ALTER TABLE careflow_inventory ADD COLUMN min_stock_level INTEGER DEFAULT 5;
            END IF;
        END IF;
        
        -- Add max_stock_level
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_inventory' AND column_name = 'max_stock_level') THEN
            ALTER TABLE careflow_inventory ADD COLUMN max_stock_level INTEGER DEFAULT 100;
        END IF;
    END IF;
END $$;

-- 3. Fix careflow_documents
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careflow_documents') THEN
        -- Rename document_name to name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_documents' AND column_name = 'name') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_documents' AND column_name = 'document_name') THEN
                ALTER TABLE careflow_documents RENAME COLUMN document_name TO name;
            END IF;
        END IF;

        -- Rename document_type to category
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_documents' AND column_name = 'category') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_documents' AND column_name = 'document_type') THEN
                ALTER TABLE careflow_documents RENAME COLUMN document_type TO category;
            ELSE
                ALTER TABLE careflow_documents ADD COLUMN category TEXT NOT NULL DEFAULT 'other';
            END IF;
        END IF;

        -- Rename file_path to file_url
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_documents' AND column_name = 'file_url') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_documents' AND column_name = 'file_path') THEN
                ALTER TABLE careflow_documents RENAME COLUMN file_path TO file_url;
            END IF;
        END IF;
    END IF;
END $$;

-- 4. Fix careflow_notifications recipient_id alias
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careflow_notifications') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_notifications' AND column_name = 'recipient_id') THEN
            -- We add it as a column and sync it with user_id to satisfy both apps
            ALTER TABLE careflow_notifications ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
            UPDATE careflow_notifications SET recipient_id = user_id WHERE recipient_id IS NULL;
        END IF;
    END IF;
END $$;
