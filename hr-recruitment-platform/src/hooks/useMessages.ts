/**
 * Messaging Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for internal messaging operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export interface Conversation {
  id: string;
  title?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_pinned: boolean;
  conversation_type: 'direct' | 'group' | 'announcement';
  metadata?: Record<string, any>;
  // Joined data
  participants?: MessageParticipant[];
  last_message?: Message;
  unread_count?: number;
  [key: string]: any;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  sent_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  metadata?: Record<string, any>;
  // Joined data
  sender?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  [key: string]: any;
}

export interface MessageParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  role_in_conversation: 'owner' | 'admin' | 'member';
  is_active: boolean;
  // Joined data
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  [key: string]: any;
}

export interface ConversationFilters {
  type?: string;
  is_archived?: boolean;
  search?: string;
}

// ==================== Conversations ====================

/**
 * Fetch all conversations for current user
 */
export function useConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: queryKeys.messages.list(filters),
    queryFn: async () => {
      try {
        log.info('Fetching conversations', { filters });
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        // First get conversations user is part of
        const { data: participantData, error: participantError } = await supabase
          .from('message_participants')
          .select('conversation_id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (participantError) throw handleError(participantError, 'Failed to fetch conversations');

        const conversationIds = participantData?.map(p => p.conversation_id) || [];
        
        if (conversationIds.length === 0) {
          return [];
        }

        // Fetch conversations
        let query = supabase
          .from('conversations')
          .select('*')
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        // Apply filters
        if (filters?.type) {
          query = query.eq('conversation_type', filters.type);
        }
        if (filters?.is_archived !== undefined) {
          query = query.eq('is_archived', filters.is_archived);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch conversations');
        }

        log.info(`Fetched ${data?.length || 0} conversations`);
        return data as Conversation[];
      } catch (error) {
        throw handleError(error, 'useConversations query failed');
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - messages need to be fresh
  });
}

/**
 * Fetch single conversation with participants
 */
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.messages.conversation(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Conversation ID is required');
      }

      try {
        log.info('Fetching conversation', { id });

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            message_participants (
              id,
              user_id,
              role_in_conversation,
              is_active,
              last_read_at
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Conversation', { id });
          }
          throw handleError(error, 'Failed to fetch conversation');
        }

        return data as Conversation;
      } catch (error) {
        throw handleError(error, 'useConversation query failed');
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch unread messages count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.messages.unread,
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        // Get participant records with last_read_at
        const { data: participants, error: participantError } = await supabase
          .from('message_participants')
          .select('conversation_id, last_read_at')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (participantError) throw handleError(participantError, 'Failed to fetch participants');

        let totalUnread = 0;

        // Count unread messages for each conversation
        for (const participant of participants || []) {
          const lastRead = participant.last_read_at || '1970-01-01T00:00:00.000Z';
          
          const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', participant.conversation_id)
            .gt('sent_at', lastRead)
            .neq('sender_id', user.id)
            .eq('is_deleted', false);

          if (!error && count) {
            totalUnread += count;
          }
        }

        return totalUnread;
      } catch (error) {
        log.error('Failed to fetch unread count', error);
        return 0;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - keep unread count fresh
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Create new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      title, 
      type, 
      participantIds 
    }: { 
      title?: string; 
      type: Conversation['conversation_type']; 
      participantIds: string[];
    }) => {
      try {
        log.info('Creating conversation', { title, type, participantIds });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        // Create conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            title,
            conversation_type: type,
            created_by: user.id,
          })
          .select()
          .single();

        if (convError) throw handleError(convError, 'Failed to create conversation');

        // Add creator as owner
        const participants = [
          {
            conversation_id: conversation.id,
            user_id: user.id,
            role_in_conversation: 'owner',
          },
          // Add other participants as members
          ...participantIds.filter(id => id !== user.id).map(userId => ({
            conversation_id: conversation.id,
            user_id: userId,
            role_in_conversation: 'member',
          })),
        ];

        const { error: partError } = await supabase
          .from('message_participants')
          .insert(participants);

        if (partError) throw handleError(partError, 'Failed to add participants');

        log.info('Conversation created successfully', { id: conversation.id });
        return conversation as Conversation;
      } catch (error) {
        throw handleError(error, 'useCreateConversation mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.messages.all);
      queryClient.setQueryData(queryKeys.messages.conversation(data.id), data);
      log.track('conversation_created', { conversationId: data.id, type: data.conversation_type });
    },
  });
}

/**
 * Archive conversation
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Archiving conversation', { id });

        const { data: updated, error } = await supabase
          .from('conversations')
          .update({ 
            is_archived: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to archive conversation');

        log.info('Conversation archived', { id });
        return updated as Conversation;
      } catch (error) {
        throw handleError(error, 'useArchiveConversation mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.messages.conversation(data.id), data);
      invalidateQueries(queryKeys.messages.all);
      log.track('conversation_archived', { conversationId: data.id });
    },
  });
}

// ==================== Messages ====================

/**
 * Fetch messages for a conversation
 */
export function useMessages(conversationId: string | null, limit: number = 50) {
  return useQuery({
    queryKey: ['messages', 'list', conversationId, limit],
    queryFn: async () => {
      if (!conversationId) throw createError.validation('Conversation ID is required');

      try {
        log.info('Fetching messages', { conversationId, limit });

        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            users_profiles:sender_id (
              user_id,
              first_name,
              last_name
            )
          `)
          .eq('conversation_id', conversationId)
          .eq('is_deleted', false)
          .order('sent_at', { ascending: false })
          .limit(limit);

        if (error) throw handleError(error, 'Failed to fetch messages');

        // Return in chronological order for display
        return (data || []).reverse() as Message[];
      } catch (error) {
        throw handleError(error, 'useMessages query failed');
      }
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Send new message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      attachmentUrl 
    }: { 
      conversationId: string; 
      content: string; 
      attachmentUrl?: string;
    }) => {
      try {
        log.info('Sending message', { conversationId });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
            attachment_url: attachmentUrl,
          })
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to send message');

        // Update conversation's updated_at
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        log.info('Message sent successfully', { id: data.id });
        return data as Message;
      } catch (error) {
        throw handleError(error, 'useSendMessage mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(['messages', 'list', data.conversation_id]);
      invalidateQueries(queryKeys.messages.all);
      log.track('message_sent', { messageId: data.id, conversationId: data.conversation_id });
    },
  });
}

/**
 * Edit message
 */
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      content 
    }: { 
      id: string; 
      content: string;
    }) => {
      try {
        log.info('Editing message', { id });

        const { data: updated, error } = await supabase
          .from('messages')
          .update({
            content,
            is_edited: true,
            metadata: { edited_at: new Date().toISOString() },
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to edit message');

        log.info('Message edited', { id });
        return updated as Message;
      } catch (error) {
        throw handleError(error, 'useEditMessage mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(['messages', 'list', data.conversation_id]);
      log.track('message_edited', { messageId: data.id });
    },
  });
}

/**
 * Delete message (soft delete)
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting message', { id });

        // Get message first to get conversation_id
        const { data: message, error: fetchError } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('id', id)
          .single();

        if (fetchError) throw handleError(fetchError, 'Failed to fetch message');

        const { error } = await supabase
          .from('messages')
          .update({ is_deleted: true })
          .eq('id', id);

        if (error) throw handleError(error, 'Failed to delete message');

        log.info('Message deleted', { id });
        return { id, conversationId: message.conversation_id };
      } catch (error) {
        throw handleError(error, 'useDeleteMessage mutation failed');
      }
    },
    onSuccess: ({ id, conversationId }) => {
      invalidateQueries(['messages', 'list', conversationId]);
      log.track('message_deleted', { messageId: id });
    },
  });
}

/**
 * Mark conversation as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        const { error } = await supabase
          .from('message_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);

        if (error) throw handleError(error, 'Failed to mark as read');

        log.info('Conversation marked as read', { conversationId });
        return conversationId;
      } catch (error) {
        throw handleError(error, 'useMarkAsRead mutation failed');
      }
    },
    onSuccess: (conversationId) => {
      invalidateQueries(queryKeys.messages.unread);
      invalidateQueries(queryKeys.messages.conversation(conversationId));
    },
  });
}

/**
 * Add participants to conversation
 */
export function useAddParticipants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      userIds 
    }: { 
      conversationId: string; 
      userIds: string[];
    }) => {
      try {
        log.info('Adding participants', { conversationId, userIds });

        const participants = userIds.map(userId => ({
          conversation_id: conversationId,
          user_id: userId,
          role_in_conversation: 'member',
        }));

        const { error } = await supabase
          .from('message_participants')
          .insert(participants);

        if (error) throw handleError(error, 'Failed to add participants');

        log.info('Participants added', { conversationId, count: userIds.length });
        return { conversationId, userIds };
      } catch (error) {
        throw handleError(error, 'useAddParticipants mutation failed');
      }
    },
    onSuccess: ({ conversationId }) => {
      invalidateQueries(queryKeys.messages.conversation(conversationId));
      log.track('participants_added', { conversationId });
    },
  });
}

/**
 * Leave conversation
 */
export function useLeaveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw createError.auth('User not authenticated');

        log.info('Leaving conversation', { conversationId });

        const { error } = await supabase
          .from('message_participants')
          .update({ is_active: false })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);

        if (error) throw handleError(error, 'Failed to leave conversation');

        log.info('Left conversation', { conversationId });
        return conversationId;
      } catch (error) {
        throw handleError(error, 'useLeaveConversation mutation failed');
      }
    },
    onSuccess: (conversationId) => {
      invalidateQueries(queryKeys.messages.all);
      queryClient.removeQueries({ queryKey: queryKeys.messages.conversation(conversationId) });
      log.track('conversation_left', { conversationId });
    },
  });
}
