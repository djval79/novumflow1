-- Function to check if a subdomain is available
CREATE OR REPLACE FUNCTION check_subdomain_availability(p_subdomain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM tenants WHERE subdomain = p_subdomain
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION check_subdomain_availability(TEXT) TO anon, authenticated, service_role;
