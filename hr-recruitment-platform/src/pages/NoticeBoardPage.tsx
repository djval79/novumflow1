import React, { useState, useEffect } from 'react';
import { Bell, Plus, Filter, Pin, Eye, CheckCircle, AlertTriangle, Calendar, User, X } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  created_at: string;
  expires_at?: string;
  is_pinned: boolean;
  user_viewed: boolean;
  user_acknowledged: boolean;
  total_views: number;
  users_profiles: {
    full_name: string;
    role: string;
  };
}

export default function NoticeBoardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    expiresAt: '',
    isPinned: false,
    visibilityLevel: 'company-wide',
    targetAudience: []
  });

  const categories = [
    { value: 'all', label: 'All', color: 'gray' },
    { value: 'general', label: 'General', color: 'blue' },
    { value: 'urgent', label: 'Urgent', color: 'red' },
    { value: 'job-related', label: 'Job Related', color: 'green' },
    { value: 'policy', label: 'Policy Updates', color: 'yellow' },
    { value: 'compliance', label: 'Compliance Alerts', color: 'purple' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', icon: null },
    { value: 'normal', label: 'Normal', icon: null },
    { value: 'high', label: 'High', icon: AlertTriangle },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle }
  ];

  useEffect(() => {
    loadUserRole();
    loadAnnouncements();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [selectedCategory, announcements]);

  const loadUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      setCurrentUserRole(profile?.role || '');
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/noticeboard-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'GET_ANNOUNCEMENTS',
          data: { category: selectedCategory === 'all' ? null : selectedCategory }
        })
      });

      const result = await response.json();
      if (result.success) {
        setAnnouncements(result.announcements);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/noticeboard-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'GET_UNREAD_COUNT' })
      });

      const result = await response.json();
      if (result.success) {
        setUnreadCount(result.unread_count);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const filterAnnouncements = () => {
    if (selectedCategory === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      setFilteredAnnouncements(announcements.filter(ann => ann.category === selectedCategory));
    }
  };

  const markAsViewed = async (announcementId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${supabaseUrl}/functions/v1/noticeboard-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'MARK_VIEWED', data: { announcementId } })
      });
      loadAnnouncements();
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
    }
  };

  const acknowledgeAnnouncement = async (announcementId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${supabaseUrl}/functions/v1/noticeboard-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'ACKNOWLEDGE_ANNOUNCEMENT', data: { announcementId } })
      });
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${supabaseUrl}/functions/v1/noticeboard-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'CREATE_ANNOUNCEMENT', data: newAnnouncement })
      });

      const result = await response.json();
      if (result.success) {
        setShowCreateModal(false);
        setNewAnnouncement({
          title: '',
          content: '',
          category: 'general',
          priority: 'normal',
          expiresAt: '',
          isPinned: false,
          visibilityLevel: 'company-wide',
          targetAudience: []
        });
        loadAnnouncements();
        loadUnreadCount();
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCreateAnnouncement = ['admin', 'hr manager'].includes(currentUserRole?.toLowerCase() || '');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
              <p className="text-gray-600 mt-1">Company announcements and important updates</p>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">{unreadCount} unread</span>
                </div>
              )}
              {canCreateAnnouncement && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Announcement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === category.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">No announcements to display</p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${announcement.is_pinned ? 'border-yellow-500' : 'border-transparent'
                  } ${!announcement.user_viewed ? 'bg-indigo-50' : ''}`}
                onMouseEnter={() => !announcement.user_viewed && markAsViewed(announcement.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {announcement.is_pinned && (
                        <Pin className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {announcement.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getCategoryColor(announcement.category)}-100 text-${getCategoryColor(announcement.category)}-800`}>
                            {announcement.category}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-4">{announcement.content}</p>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{announcement.users_profiles.full_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{announcement.total_views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!announcement.user_acknowledged && (
                    <button
                      onClick={() => acknowledgeAnnouncement(announcement.id)}
                      className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Acknowledge
                    </button>
                  )}

                  {announcement.user_acknowledged && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm">
                      <CheckCircle className="w-4 h-4 fill-current" />
                      Acknowledged
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create Announcement</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Enter announcement title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Enter announcement content"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newAnnouncement.category}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {categories.filter(c => c.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newAnnouncement.expiresAt}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={newAnnouncement.isPinned}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="pinned" className="text-sm font-medium text-gray-700">
                  Pin this announcement to the top
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createAnnouncement}
                  disabled={loading || !newAnnouncement.title || !newAnnouncement.content}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
