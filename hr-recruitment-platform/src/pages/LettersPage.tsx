import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, Download, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import AddTemplateModal from '@/components/AddTemplateModal';
import Toast from '@/components/Toast';

type TabType = 'templates' | 'generated';

export default function LettersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<any[]>([]);
  const [generatedLetters, setGeneratedLetters] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'templates') {
        const { data } = await supabase
          .from('letter_templates')
          .select('*')
          .eq('is_active', true)
          .order('template_name');
        setTemplates(data || []);
      } else {
        const { data } = await supabase
          .from('generated_letters')
          .select('*')
          .order('generated_at', { ascending: false });
        setGeneratedLetters(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateLetter(templateId: string) {
    // Placeholder for letter generation logic
    setToast({ message: 'Letter generation feature - Would open modal to select employee and fill merge fields', type: 'warning' });
  }

  function handleAddNew() {
    if (activeTab === 'templates') {
      setShowAddTemplateModal(true);
    } else {
      setToast({ message: 'Generate letter feature coming soon', type: 'warning' });
    }
  }

  function handleSuccess() {
    setToast({ message: 'Template created successfully!', type: 'success' });
    loadData();
  }

  function handleError(message: string) {
    setToast({ message, type: 'error' });
  }

  function editTemplate(template: any) {
    setToast({ message: 'Template edit functionality will be available in the next update', type: 'warning' });
  }

  async function deleteTemplate(templateId: string) {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setToast({ message: 'Template deletion will be available in the next update', type: 'warning' });
    }
  }

  function downloadLetter(letter: any) {
    setToast({ message: 'Letter download functionality will be available in the next update', type: 'warning' });
  }

  function editLetter(letter: any) {
    setToast({ message: 'Letter edit functionality will be available in the next update', type: 'warning' });
  }

  const tabs = [
    { id: 'templates', label: 'Letter Templates' },
    { id: 'generated', label: 'Generated Letters' },
  ];

  const filteredTemplates = templates.filter(t =>
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Letter Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage document templates and letters</p>
        </div>
        
        <button 
          onClick={handleAddNew}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'templates' ? 'New Template' : 'Generate Letter'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Templates Table */}
            {activeTab === 'templates' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{template.template_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {template.template_type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {template.category || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            v{template.version}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => generateLetter(template.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              title="Generate Letter"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => editTemplate(template)}
                              className="text-gray-600 hover:text-gray-900 mr-3 p-1 rounded"
                              title="Edit Template"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete Template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                          No templates found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Generated Letters Table */}
            {activeTab === 'generated' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Letter Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedLetters.length > 0 ? (
                      generatedLetters.map((letter) => (
                        <tr key={letter.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {letter.letter_type}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {letter.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(letter.generated_at), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              letter.status === 'sent' ? 'bg-green-100 text-green-800' :
                              letter.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              letter.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {letter.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {letter.pdf_url && (
                              <button 
                                onClick={() => downloadLetter(letter)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                                title="Download Letter"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => editLetter(letter)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded"
                              title="Edit Letter"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                          No generated letters found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddTemplateModal
        isOpen={showAddTemplateModal}
        onClose={() => setShowAddTemplateModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
