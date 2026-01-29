import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, Plus, X, CheckCheck } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { log } from '@/lib/logger';
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  sent_at: string;
  is_edited: boolean;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  unread_count: number;
  last_message?: { content: string; sent_at: string };
}

interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [conversationTitle, setConversationTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadConversations = async () => {
    setIsPageLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/messaging-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'GET_CONVERSATIONS' })
      });

      const result = await response.json();
      if (result.success) {
        setConversations(result.conversations);
      }
    } catch (error) {
      log.error('Failed to load conversations', error, { component: 'MessagingPage', action: 'loadConversations' });
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/messaging-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'GET_MESSAGES', data: { conversationId } })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      log.error('Failed to load messages', error, { component: 'MessagingPage', action: 'loadMessages', metadata: { conversationId } });
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${supabaseUrl}/functions/v1/messaging-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'MARK_READ', data: { conversationId } })
      });
      loadConversations();
    } catch (error) {
      log.error('Failed to mark as read', error, { component: 'MessagingPage', action: 'markAsRead', metadata: { conversationId } });
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/messaging-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'SEND_MESSAGE',
          data: {
            conversationId: selectedConversation,
            content: messageInput
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessageInput('');
        loadMessages(selectedConversation);
        loadConversations();
      }
    } catch (error) {
      log.error('Failed to send message', error, { component: 'MessagingPage', action: 'sendMessage', metadata: { conversationId: selectedConversation } });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/messaging-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'SEARCH_USERS', data: { query } })
      });

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.users);
      }
    } catch (error) {
      log.error('Failed to search users', error, { component: 'MessagingPage', action: 'searchUsers', metadata: { query } });
    }
  };

  const createConversation = async () => {
    if (selectedUsers.length === 0 || !conversationTitle.trim()) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/messaging-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'CREATE_CONVERSATION',
          data: {
            title: conversationTitle,
            participantIds: selectedUsers.map(u => u.user_id),
            conversationType: selectedUsers.length > 1 ? 'group' : 'direct'
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowNewConversation(false);
        setConversationTitle('');
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
        loadConversations();
        setSelectedConversation(result.conversation.id);
      }
    } catch (error) {
      log.error('Failed to create conversation', error, { component: 'MessagingPage', action: 'createConversation', metadata: { title: conversationTitle, participantCount: selectedUsers.length } });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <Tooltip content="New Conversation">
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isPageLoading ? (
            <div className="p-4">
              <SkeletonList count={5} />
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation === conv.id ? 'bg-indigo-50' : ''
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{conv.title || 'Conversation'}</h3>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(conv.updated_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {conversations.find(c => c.id === selectedConversation)?.title || 'Conversation'}
                  </h2>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${msg.sender_id === currentUser?.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                      }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className={`text-xs ${msg.sender_id === currentUser?.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {formatTime(msg.sent_at)}
                      </span>
                      {msg.sender_id === currentUser?.id && (
                        <CheckCheck className="w-3 h-3 text-indigo-200" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                />
                <Tooltip content="Send Message">
                  <button
                    onClick={sendMessage}
                    disabled={loading || !messageInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Conversation</h3>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setConversationTitle('');
                  setSelectedUsers([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conversation Title
                </label>
                <input
                  type="text"
                  value={conversationTitle}
                  onChange={(e) => setConversationTitle(e.target.value)}
                  placeholder="Enter conversation title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Participants
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        onClick={() => {
                          if (!selectedUsers.find(u => u.user_id === user.user_id)) {
                            setSelectedUsers([...selectedUsers, user]);
                            setSearchQuery('');
                            setSearchResults([]);
                          }
                        }}
                        className="p-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <span
                        key={user.user_id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {user.full_name}
                        <button
                          onClick={() => setSelectedUsers(selectedUsers.filter(u => u.user_id !== user.user_id))}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={createConversation}
                disabled={loading || selectedUsers.length === 0 || !conversationTitle.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
