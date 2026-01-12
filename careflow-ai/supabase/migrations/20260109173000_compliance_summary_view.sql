
-- Phase 4: Multi-Tenant Compliance Enforcement
-- Create a summary view to calculate compliance status for each staff member

CREATE OR REPLACE VIEW public.staff_compliance_summary AS
WITH compliance_counts AS (
    SELECT 
        staff_id,
        tenant_id,
        COUNT(*) FILTER (WHERE type = 'Right to Work' AND status = 'valid') as rtw_valid,
        COUNT(*) FILTER (WHERE type = 'DBS Check' AND status = 'valid') as dbs_valid,
        COUNT(*) FILTER (WHERE type = 'Training' AND status = 'valid') as training_valid,
        COUNT(*) FILTER (WHERE type = 'Training') as training_total
    FROM public.careflow_compliance
    GROUP BY staff_id, tenant_id
)
SELECT 
    s.id as staff_id,
    s.tenant_id,
    s.novumflow_employee_id,
    (COALESCE(cc.rtw_valid, 0) > 0 AND COALESCE(cc.dbs_valid, 0) > 0) as is_compliant,
    CASE 
        WHEN COALESCE(cc.training_total, 0) > 0 THEN 
            ROUND(( (CASE WHEN cc.rtw_valid > 0 THEN 1 ELSE 0 END + CASE WHEN cc.dbs_valid > 0 THEN 1 ELSE 0 END + cc.training_valid)::NUMERIC / (2 + cc.training_total)::NUMERIC ) * 100)
        ELSE 
            ROUND(( (CASE WHEN cc.rtw_valid > 0 THEN 1 ELSE 0 END + CASE WHEN cc.dbs_valid > 0 THEN 1 ELSE 0 END)::NUMERIC / 2.0 ) * 100)
    END as compliance_percentage,
    ARRAY(
        SELECT name FROM (
            SELECT 'Right to Work' as name WHERE COALESCE(cc.rtw_valid, 0) = 0
            UNION ALL
            SELECT 'DBS Check' as name WHERE COALESCE(cc.dbs_valid, 0) = 0
        ) t
    ) as missing_documents,
    CASE WHEN COALESCE(cc.rtw_valid, 0) > 0 THEN 'valid'::text ELSE 'missing'::text END as rtw_status,
    CASE WHEN COALESCE(cc.dbs_valid, 0) > 0 THEN 'valid'::text ELSE 'missing'::text END as dbs_status,
    CASE 
        WHEN COALESCE(cc.training_total, 0) = 0 THEN 'incomplete'::text
        WHEN cc.training_valid = cc.training_total THEN 'valid'::text
        ELSE 'incomplete'::text
    END as training_status,
    MAX(c.updated_at) as last_synced_at
FROM public.careflow_staff s
LEFT JOIN compliance_counts cc ON s.id = cc.staff_id AND s.tenant_id = cc.tenant_id
LEFT JOIN public.careflow_compliance c ON s.id = c.staff_id AND s.tenant_id = c.tenant_id
GROUP BY s.id, s.tenant_id, s.novumflow_employee_id, cc.rtw_valid, cc.dbs_valid, cc.training_valid, cc.training_total;
