import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface AuditLog {
    id: string;
    tenant_id: string;
    user_id: string;
    user_email: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entity_type: string;
    entity_id: string;
    entity_name: string;
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        fields_changed?: string[];
    };
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

export interface AuditLogInput {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entity_type: string;
    entity_id: string;
    entity_name: string;
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        fields_changed?: string[];
    };
}

export interface AuditSearchFilters {
    entity_type?: string;
    entity_id?: string;
    action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
}

// ============================================
// AUDIT SERVICE
// ============================================

class AuditService {
    /**
     * Log an action to the audit trail
     */
    async log(input: AuditLogInput): Promise<boolean> {
        try {
            const startTime = performance.now();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                log.warn('No authenticated user for audit log', {
                    component: 'AuditService'
                });
                return false;
            }

            log.debug(`Logging audit action: ${input.action}`, {
                component: 'AuditService',
                action: input.action,
                metadata: {
                    entityType: input.entity_type,
                    entityId: input.entity_id
                }
            });

            // Get user's tenant_id
            const { data: profile } = await supabase
                .from('users_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!profile?.tenant_id) {
                log.warn('No profile found for user, cannot log audit', {
                    component: 'AuditService',
                    userId: user.id
                });
                return false;
            }

            // Create audit log entry
            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    tenant_id: profile.tenant_id,
                    user_id: user.id,
                    user_email: user.email,
                    action: input.action,
                    entity_type: input.entity_type,
                    entity_id: input.entity_id,
                    entity_name: input.entity_name,
                    changes: input.changes || null,
                });

            if (error) {
                log.error('Error creating audit log', error, {
                    component: 'AuditService'
                });
                return false;
            }

            const duration = performance.now() - startTime;
            log.performance('Create audit log', duration, {
                component: 'AuditService'
            });

            return true;
        } catch (error) {
            log.error('Error in audit log', error, {
                component: 'AuditService'
            });
            return false;
        }
    }

    /**
     * Get audit trail for a specific entity
     */
    async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) {
            log.error('Error fetching entity history', error, {
                component: 'AuditService',
                metadata: { entityType, entityId }
            });
            return [];
        }

        return data || [];
    }

    /**
     * Get user activity
     */
    async getUserActivity(userId: string, limit: number = 50): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            log.error('Error fetching user activity', error, {
                component: 'AuditService',
                userId
            });
            return [];
        }

        return data || [];
    }

    /**
     * Search audit logs with filters
     */
    async search(filters: AuditSearchFilters): Promise<AuditLog[]> {
        const startTime = performance.now();

        let query = supabase
            .from('audit_logs')
            .select('*');

        log.debug('Searching audit logs', {
            component: 'AuditService',
            metadata: { filters }
        });

        if (filters.entity_type) {
            query = query.eq('entity_type', filters.entity_type);
        }

        if (filters.entity_id) {
            query = query.eq('entity_id', filters.entity_id);
        }

        if (filters.action) {
            query = query.eq('action', filters.action);
        }

        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }

        if (filters.date_from) {
            query = query.gte('created_at', filters.date_from);
        }

        if (filters.date_to) {
            query = query.lte('created_at', filters.date_to);
        }

        query = query.order('created_at', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
            log.error('Error searching audit logs', error, {
                component: 'AuditService'
            });
            return [];
        }

        const duration = performance.now() - startTime;
        log.performance('Audit log search', duration, {
            component: 'AuditService',
            metadata: { resultsCount: data?.length || 0 }
        });

        return data || [];
    }

    /**
     * Get recent activity for dashboard
     */
    async getRecentActivity(limit: number = 20): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            log.error('Error fetching recent activity', error, {
                component: 'AuditService'
            });
            return [];
        }

        return data || [];
    }

    /**
     * Get audit statistics
     */
    async getStatistics(dateFrom?: string, dateTo?: string): Promise<{
        total: number;
        by_action: Record<string, number>;
        by_entity_type: Record<string, number>;
    }> {
        let query = supabase
            .from('audit_logs')
            .select('action, entity_type');

        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }

        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data, error } = await query;

        if (error) {
            log.error('Error fetching audit statistics', error, {
                component: 'AuditService'
            });
            return { total: 0, by_action: {}, by_entity_type: {} };
        }

        const by_action: Record<string, number> = {};
        const by_entity_type: Record<string, number> = {};

        data?.forEach(logEntry => {
            by_action[logEntry.action] = (by_action[logEntry.action] || 0) + 1;
            by_entity_type[logEntry.entity_type] = (by_entity_type[logEntry.entity_type] || 0) + 1;
        });

        return {
            total: data?.length || 0,
            by_action,
            by_entity_type
        };
    }
}

export const auditService = new AuditService();

