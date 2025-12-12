/**
 * Tenant Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for multi-tenant operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export type SubscriptionTier = 'trial' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'suspended' | 'expired';

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  slug: string;
  
  // Contact & Branding
  logo_url?: string;
  website?: string;
  primary_email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  
  // Settings & Features
  settings?: Record<string, any>;
  features?: {
    novumflow_enabled?: boolean;
    careflow_enabled?: boolean;
    ai_enabled?: boolean;
    sms_enabled?: boolean;
    [key: string]: any;
  };
  
  // Limits
  limits?: {
    max_users?: number;
    max_employees?: number;
    max_clients?: number;
    max_storage_gb?: number;
    [key: string]: any;
  };
  
  // Subscription
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  
  // Billing
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  
  // Status
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  [key: string]: any;
}

export interface TenantMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  permissions?: string[];
  is_active: boolean;
  invited_by?: string;
  invitation_accepted_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  tenants?: Tenant;
  users?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  [key: string]: any;
}

export interface TenantFilters {
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  is_active?: boolean;
  search?: string;
}

// ==================== Tenant Queries ====================

/**
 * Fetch all tenants (admin only)
 */
export function useTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: queryKeys.tenants.list,
    queryFn: async () => {
      try {
        log.info('Fetching tenants', { filters });
        
        let query = supabase
          .from('tenants')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.subscription_tier) {
          query = query.eq('subscription_tier', filters.subscription_tier);
        }
        if (filters?.subscription_status) {
          query = query.eq('subscription_status', filters.subscription_status);
        }
        if (filters?.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }
        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch tenants');
        }

        log.info(`Fetched ${data?.length || 0} tenants`);
        return data as Tenant[];
      } catch (error) {
        throw handleError(error, 'useTenants query failed');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single tenant by ID
 */
export function useTenant(id: string | null) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Tenant ID is required');
      }

      try {
        log.info('Fetching tenant', { id });

        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Tenant', { id });
          }
          throw handleError(error, 'Failed to fetch tenant');
        }

        return data as Tenant;
      } catch (error) {
        throw handleError(error, 'useTenant query failed');
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch current user's tenant
 */
export function useCurrentTenant() {
  return useQuery({
    queryKey: queryKeys.tenants.current,
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        // Get user's active membership
        const { data: membership, error: membershipError } = await supabase
          .from('user_tenant_memberships')
          .select(`
            *,
            tenants (*)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (membershipError) {
          if (membershipError.code === 'PGRST116') {
            return null; // User has no tenant
          }
          throw handleError(membershipError, 'Failed to fetch current tenant');
        }

        return membership?.tenants as Tenant | null;
      } catch (error) {
        throw handleError(error, 'useCurrentTenant query failed');
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - tenant rarely changes
  });
}

/**
 * Fetch tenant by slug
 */
export function useTenantBySlug(slug: string | null) {
  return useQuery({
    queryKey: ['tenants', 'bySlug', slug],
    queryFn: async () => {
      if (!slug) throw createError.validation('Tenant slug is required');

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Tenant', { slug });
          }
          throw handleError(error, 'Failed to fetch tenant');
        }

        return data as Tenant;
      } catch (error) {
        throw handleError(error, 'useTenantBySlug query failed');
      }
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch user's tenant memberships
 */
export function useUserTenantMemberships(userId?: string) {
  return useQuery({
    queryKey: ['tenants', 'memberships', userId],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;
        
        if (!targetUserId) throw createError.auth('User not authenticated');

        const { data, error } = await supabase
          .from('user_tenant_memberships')
          .select(`
            *,
            tenants (*)
          `)
          .eq('user_id', targetUserId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch memberships');
        return data as TenantMembership[];
      } catch (error) {
        throw handleError(error, 'useUserTenantMemberships query failed');
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch members of a tenant
 */
export function useTenantMembers(tenantId: string | null) {
  return useQuery({
    queryKey: ['tenants', 'members', tenantId],
    queryFn: async () => {
      if (!tenantId) throw createError.validation('Tenant ID is required');

      try {
        const { data, error } = await supabase
          .from('user_tenant_memberships')
          .select(`
            *,
            users_profiles:user_id (
              user_id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('role', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch tenant members');
        return data as TenantMembership[];
      } catch (error) {
        throw handleError(error, 'useTenantMembers query failed');
      }
    },
    enabled: !!tenantId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== Tenant Mutations ====================

/**
 * Create new tenant
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantData: Partial<Tenant>) => {
      try {
        log.info('Creating tenant', { data: tenantData });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        // Create tenant
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            ...tenantData,
            subscription_tier: tenantData.subscription_tier || 'trial',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
          })
          .select()
          .single();

        if (tenantError) throw handleError(tenantError, 'Failed to create tenant');

        // Add creator as owner
        const { error: membershipError } = await supabase
          .from('user_tenant_memberships')
          .insert({
            user_id: user.id,
            tenant_id: tenant.id,
            role: 'owner',
            is_active: true,
            invitation_accepted_at: new Date().toISOString(),
          });

        if (membershipError) {
          // Rollback tenant creation
          await supabase.from('tenants').delete().eq('id', tenant.id);
          throw handleError(membershipError, 'Failed to create tenant membership');
        }

        log.info('Tenant created successfully', { id: tenant.id });
        return tenant as Tenant;
      } catch (error) {
        throw handleError(error, 'useCreateTenant mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.tenants.all);
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      log.track('tenant_created', { tenantId: data.id, tier: data.subscription_tier });
    },
  });
}

/**
 * Update tenant
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
      try {
        log.info('Updating tenant', { id, data });

        const { data: updated, error } = await supabase
          .from('tenants')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update tenant');
        }

        log.info('Tenant updated successfully', { id });
        return updated as Tenant;
      } catch (error) {
        throw handleError(error, 'useUpdateTenant mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      invalidateQueries(queryKeys.tenants.all);
      invalidateQueries(queryKeys.tenants.current);
      log.track('tenant_updated', { tenantId: data.id });
    },
  });
}

/**
 * Update tenant settings
 */
export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      settings 
    }: { 
      id: string; 
      settings: Record<string, any>;
    }) => {
      try {
        log.info('Updating tenant settings', { id });

        // Get current settings
        const { data: tenant, error: fetchError } = await supabase
          .from('tenants')
          .select('settings')
          .eq('id', id)
          .single();

        if (fetchError) throw handleError(fetchError, 'Failed to fetch tenant');

        // Merge settings
        const mergedSettings = { ...(tenant.settings || {}), ...settings };

        const { data: updated, error } = await supabase
          .from('tenants')
          .update({
            settings: mergedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update tenant settings');

        log.info('Tenant settings updated', { id });
        return updated as Tenant;
      } catch (error) {
        throw handleError(error, 'useUpdateTenantSettings mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      invalidateQueries(queryKeys.tenants.current);
      log.track('tenant_settings_updated', { tenantId: data.id });
    },
  });
}

/**
 * Update tenant features
 */
export function useUpdateTenantFeatures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      features 
    }: { 
      id: string; 
      features: Record<string, boolean>;
    }) => {
      try {
        log.info('Updating tenant features', { id, features });

        // Get current features
        const { data: tenant, error: fetchError } = await supabase
          .from('tenants')
          .select('features')
          .eq('id', id)
          .single();

        if (fetchError) throw handleError(fetchError, 'Failed to fetch tenant');

        // Merge features
        const mergedFeatures = { ...(tenant.features || {}), ...features };

        const { data: updated, error } = await supabase
          .from('tenants')
          .update({
            features: mergedFeatures,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update tenant features');

        log.info('Tenant features updated', { id });
        return updated as Tenant;
      } catch (error) {
        throw handleError(error, 'useUpdateTenantFeatures mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      invalidateQueries(queryKeys.tenants.current);
      log.track('tenant_features_updated', { tenantId: data.id });
    },
  });
}

/**
 * Invite user to tenant
 */
export function useInviteToTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      tenantId, 
      userId, 
      role 
    }: { 
      tenantId: string; 
      userId: string; 
      role: TenantMembership['role'];
    }) => {
      try {
        log.info('Inviting user to tenant', { tenantId, userId, role });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        const { data, error } = await supabase
          .from('user_tenant_memberships')
          .insert({
            tenant_id: tenantId,
            user_id: userId,
            role,
            is_active: true,
            invited_by: user.id,
            invitation_accepted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to invite user');

        log.info('User invited to tenant', { tenantId, userId });
        return data as TenantMembership;
      } catch (error) {
        throw handleError(error, 'useInviteToTenant mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(['tenants', 'members', data.tenant_id]);
      log.track('user_invited_to_tenant', { tenantId: data.tenant_id, userId: data.user_id });
    },
  });
}

/**
 * Remove user from tenant
 */
export function useRemoveFromTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      tenantId, 
      userId 
    }: { 
      tenantId: string; 
      userId: string;
    }) => {
      try {
        log.info('Removing user from tenant', { tenantId, userId });

        const { error } = await supabase
          .from('user_tenant_memberships')
          .update({ is_active: false })
          .eq('tenant_id', tenantId)
          .eq('user_id', userId);

        if (error) throw handleError(error, 'Failed to remove user');

        log.info('User removed from tenant', { tenantId, userId });
        return { tenantId, userId };
      } catch (error) {
        throw handleError(error, 'useRemoveFromTenant mutation failed');
      }
    },
    onSuccess: ({ tenantId, userId }) => {
      invalidateQueries(['tenants', 'members', tenantId]);
      log.track('user_removed_from_tenant', { tenantId, userId });
    },
  });
}

/**
 * Update member role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      membershipId, 
      role 
    }: { 
      membershipId: string; 
      role: TenantMembership['role'];
    }) => {
      try {
        log.info('Updating member role', { membershipId, role });

        const { data: updated, error } = await supabase
          .from('user_tenant_memberships')
          .update({ 
            role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', membershipId)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update role');

        log.info('Member role updated', { membershipId, role });
        return updated as TenantMembership;
      } catch (error) {
        throw handleError(error, 'useUpdateMemberRole mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(['tenants', 'members', data.tenant_id]);
      log.track('member_role_updated', { membershipId: data.id, role: data.role });
    },
  });
}

/**
 * Delete tenant (soft delete)
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting tenant', { id });

        const { error } = await supabase
          .from('tenants')
          .update({ 
            deleted_at: new Date().toISOString(),
            is_active: false,
          })
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete tenant');
        }

        log.info('Tenant deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteTenant mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.tenants.detail(id) });
      invalidateQueries(queryKeys.tenants.all);
      log.track('tenant_deleted', { tenantId: id });
    },
  });
}

/**
 * Check if slug is available
 */
export function useCheckSlugAvailability(slug: string | null) {
  return useQuery({
    queryKey: ['tenants', 'checkSlug', slug],
    queryFn: async () => {
      if (!slug || slug.length < 3) return { available: false, reason: 'Slug too short' };

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw handleError(error, 'Failed to check slug');
        
        return { 
          available: !data, 
          reason: data ? 'Slug already taken' : null 
        };
      } catch (error) {
        throw handleError(error, 'useCheckSlugAvailability query failed');
      }
    },
    enabled: !!slug && slug.length >= 3,
    staleTime: 30 * 1000, // 30 seconds
  });
}
