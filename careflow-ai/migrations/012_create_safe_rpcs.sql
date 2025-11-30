-- ============================================
-- SAFE RPCs FOR DATA FETCHING (Bypass RLS)
-- ============================================

-- These functions allow fetching data without triggering Row Level Security policies on each row.
-- Access control is handled at the start of the function via 'has_tenant_role'.

-- 1. Get Clients for a Tenant
CREATE OR REPLACE FUNCTION public.get_tenant_clients(p_tenant_id UUID)
RETURNS SETOF public.clients AS $$
BEGIN
  -- Check permission once
  IF NOT public.has_tenant_role(p_tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']) THEN
     RAISE EXCEPTION 'Access Denied';
  END IF;

  -- Return data (bypassing RLS)
  RETURN QUERY SELECT * FROM public.clients WHERE tenant_id = p_tenant_id ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Get Medications for a Tenant (and Client)
CREATE OR REPLACE FUNCTION public.get_client_medications(p_client_id UUID)
RETURNS SETOF public.medications AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from client
  SELECT tenant_id INTO v_tenant_id FROM public.clients WHERE id = p_client_id;
  
  -- Check permission
  IF NOT public.has_tenant_role(v_tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']) THEN
     RAISE EXCEPTION 'Access Denied';
  END IF;

  RETURN QUERY SELECT * FROM public.medications WHERE client_id = p_client_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Get MAR Records
CREATE OR REPLACE FUNCTION public.get_client_mar(p_client_id UUID, p_date DATE)
RETURNS TABLE (
    id UUID,
    client_id UUID,
    medication_id UUID,
    scheduled_date DATE,
    time_slot TEXT,
    status TEXT,
    administered_at TIMESTAMPTZ,
    administered_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    tenant_id UUID,
    admin_name TEXT
) AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from client
  SELECT tenant_id INTO v_tenant_id FROM public.clients WHERE id = p_client_id;

  -- Check permission
  IF NOT public.has_tenant_role(v_tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']) THEN
     RAISE EXCEPTION 'Access Denied';
  END IF;

  -- Return records joined with employee name
  RETURN QUERY 
  SELECT 
    mr.id, mr.client_id, mr.medication_id, mr.scheduled_date, mr.time_slot, mr.status, 
    mr.administered_at, mr.administered_by, mr.notes, mr.created_at, mr.updated_at, mr.tenant_id,
    e.name as admin_name
  FROM public.medication_records mr
  LEFT JOIN public.employees e ON mr.administered_by = e.id
  WHERE mr.client_id = p_client_id AND mr.scheduled_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
