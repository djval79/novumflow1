-- Create demo_requests table for capturing leads from landing pages
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    product_interest TEXT, -- 'careflow', 'novumflow', or 'both'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'contacted', 'demo_scheduled', 'closed'
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (anyone on the landing page)
CREATE POLICY "Allow public insert to demo_requests" 
ON public.demo_requests 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view/update
-- Note: Assuming there is a role or check for project admins. For now, we'll keep it restrictive.
CREATE POLICY "Allow authenticated admins to select demo_requests" 
ON public.demo_requests 
FOR SELECT 
USING (auth.role() = 'service_role' OR (SELECT is_admin FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Allow authenticated admins to update demo_requests" 
ON public.demo_requests 
FOR UPDATE 
USING (auth.role() = 'service_role' OR (SELECT is_admin FROM users_profiles WHERE id = auth.uid()));
