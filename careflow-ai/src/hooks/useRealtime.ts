
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types for real-time events
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
    table: string;
    schema?: string;
    event?: RealtimeEventType;
    filter?: string;
}

export interface RealtimeUpdate<T = any> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: T | null;
    timestamp: Date;
}

/**
 * Hook to subscribe to real-time database changes
 */
export function useRealtimeSubscription<T = any>(
    subscription: RealtimeSubscription,
    tenantId?: string,
    onUpdate?: (update: RealtimeUpdate<T>) => void
) {
    const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate<T> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!subscription.table) return;

        const channelName = `realtime:${subscription.table}:${tenantId || 'all'}`;

        // Build filter with tenant_id if provided
        let filter = subscription.filter || '';
        if (tenantId && !filter.includes('tenant_id')) {
            filter = filter ? `${filter},tenant_id=eq.${tenantId}` : `tenant_id=eq.${tenantId}`;
        }

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes' as any, {
                event: subscription.event || '*',
                schema: subscription.schema || 'public',
                table: subscription.table,
                filter: filter || undefined
            }, (payload: any) => {
                const update: RealtimeUpdate<T> = {
                    eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                    new: payload.new as T,
                    old: payload.old as T,
                    timestamp: new Date()
                };

                setLastUpdate(update);
                onUpdate?.(update);
            })
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
                if (status === 'SUBSCRIBED') {
                    console.log(`Realtime: Subscribed to ${subscription.table}`);
                }
            });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [subscription.table, subscription.event, subscription.filter, tenantId]);

    return { lastUpdate, isConnected };
}

/**
 * Hook to subscribe to multiple tables
 */
export function useMultipleRealtimeSubscriptions(
    subscriptions: RealtimeSubscription[],
    tenantId?: string,
    onAnyUpdate?: (table: string, update: RealtimeUpdate) => void
) {
    const [updates, setUpdates] = useState<Map<string, RealtimeUpdate>>(new Map());
    const [isConnected, setIsConnected] = useState(false);
    const channelsRef = useRef<RealtimeChannel[]>([]);

    useEffect(() => {
        if (subscriptions.length === 0) return;

        const channels: RealtimeChannel[] = [];

        subscriptions.forEach((sub) => {
            const channelName = `realtime:${sub.table}:${tenantId || 'all'}:${Date.now()}`;

            let filter = sub.filter || '';
            if (tenantId && !filter.includes('tenant_id')) {
                filter = filter ? `${filter},tenant_id=eq.${tenantId}` : `tenant_id=eq.${tenantId}`;
            }

            const channel = supabase
                .channel(channelName)
                .on('postgres_changes' as any, {
                    event: sub.event || '*',
                    schema: sub.schema || 'public',
                    table: sub.table,
                    filter: filter || undefined
                }, (payload: any) => {
                    const update: RealtimeUpdate = {
                        eventType: payload.eventType,
                        new: payload.new,
                        old: payload.old,
                        timestamp: new Date()
                    };

                    setUpdates(prev => {
                        const newMap = new Map(prev);
                        newMap.set(sub.table, update);
                        return newMap;
                    });

                    onAnyUpdate?.(sub.table, update);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        setIsConnected(true);
                    }
                });

            channels.push(channel);
        });

        channelsRef.current = channels;

        return () => {
            channels.forEach(ch => ch.unsubscribe());
            channelsRef.current = [];
        };
    }, [JSON.stringify(subscriptions.map(s => s.table)), tenantId]);

    return { updates, isConnected };
}

/**
 * Hook for dashboard real-time updates with automatic data refresh
 */
export function useDashboardRealtime(
    tenantId?: string,
    options?: {
        onVisitUpdate?: () => void;
        onIncidentUpdate?: () => void;
        onClientUpdate?: () => void;
        onStaffUpdate?: () => void;
    }
) {
    const [realtimeIndicator, setRealtimeIndicator] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });

    const showNotification = useCallback((message: string) => {
        setRealtimeIndicator({ visible: true, message });
        setTimeout(() => {
            setRealtimeIndicator({ visible: false, message: '' });
        }, 3000);
    }, []);

    // Subscribe to visits
    useRealtimeSubscription(
        { table: 'visits', event: '*' },
        tenantId,
        (update) => {
            if (update.eventType === 'INSERT') {
                showNotification('New visit scheduled');
            } else if (update.eventType === 'UPDATE') {
                const newData = update.new as any;
                if (newData?.status === 'Completed') {
                    showNotification('Visit completed');
                } else if (newData?.status === 'In Progress') {
                    showNotification('Visit started');
                }
            }
            options?.onVisitUpdate?.();
        }
    );

    // Subscribe to incidents
    useRealtimeSubscription(
        { table: 'careflow_incidents', event: 'INSERT' },
        tenantId,
        (update) => {
            const incident = update.new as any;
            const severity = incident?.severity || 'new';
            showNotification(`New ${severity} incident reported`);
            options?.onIncidentUpdate?.();
        }
    );

    // Subscribe to clients
    useRealtimeSubscription(
        { table: 'clients', event: '*' },
        tenantId,
        (update) => {
            if (update.eventType === 'INSERT') {
                showNotification('New client added');
            }
            options?.onClientUpdate?.();
        }
    );

    // Subscribe to staff
    useRealtimeSubscription(
        { table: 'employees', event: '*' },
        tenantId,
        (update) => {
            if (update.eventType === 'INSERT') {
                showNotification('New staff member added');
            }
            options?.onStaffUpdate?.();
        }
    );

    return realtimeIndicator;
}

export default { useRealtimeSubscription, useMultipleRealtimeSubscriptions, useDashboardRealtime };
