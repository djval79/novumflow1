-- Create Notifications Table for CareFlow (and multi-tenant support)

CREATE TABLE IF NOT EXISTS public.careflow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error', 'task', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.careflow_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.careflow_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
ON public.careflow_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System/Admins can insert notifications"
ON public.careflow_notifications
FOR INSERT
WITH CHECK (
  -- Allow users to trigger notifications for themselves or others in same tenant if admin?
  -- For now, allow authenticated insert if they belong to the tenant
  EXISTS (
    SELECT 1 FROM public.user_tenant_memberships 
    WHERE user_id = auth.uid() 
    AND tenant_id = careflow_notifications.tenant_id
  )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.careflow_notifications;
