-- Error logging table for production monitoring
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  component_stack TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID,
  route TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- API error logging
CREATE TABLE IF NOT EXISTS api_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  error_message TEXT NOT NULL,
  status_code INTEGER,
  request_context JSONB,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE
);

-- Performance monitoring
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  threshold DECIMAL,
  exceeded BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID,
  route TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_id ON error_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_error_logs_timestamp ON api_error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp DESC);

-- Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only accessible by system and admin users)
CREATE POLICY "System full access to error logs" ON error_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('service_role', 'admin')
  );

CREATE POLICY "System full access to API error logs" ON api_error_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('service_role', 'admin')
  );

CREATE POLICY "System full access to performance logs" ON performance_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('service_role', 'admin')
  );