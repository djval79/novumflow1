import React, { useState, useEffect } from 'react';
import { Link, Plug, Mail, Calendar, DollarSign, Clock, Users, CheckCircle, AlertCircle, Settings, Zap, TrendingUp } from 'lucide-react';
import { log } from '../lib/logger';
import { integrationEngine, IntegrationConfig, CommunicationTemplate } from '../lib/integrationEngine';

export default function IntegrationDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'communications' | 'sequences'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboard = integrationEngine.getIntegrationsDashboard();
      const integrationsList = integrationEngine.getAvailableIntegrations();
      const templatesList = integrationEngine.getCommunicationTemplates();

      setDashboardData(dashboard);
      setIntegrations(integrationsList);
      setTemplates(templatesList);
    } catch (error) {
      log.error('Failed to load integration data', error, { component: 'IntegrationDashboard', action: 'loadDashboardData' });
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'payroll': return DollarSign;
      case 'email': return Mail;
      case 'calendar': return Calendar;
      case 'time_tracking': return Clock;
      default: return Plug;
    }
  };

  const IntegrationCard = ({ integration }: { integration: IntegrationConfig }) => {
    const Icon = getIntegrationIcon(integration.type);

    return (
      <div className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${integration.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${integration.isActive ? 'bg-green-100' : 'bg-gray-100'
              }`}>
              <Icon className={`w-6 h-6 ${integration.isActive ? 'text-green-600' : 'text-gray-400'
                }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{integration.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{integration.type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${integration.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
            }`}>
            {integration.isActive ? 'Connected' : 'Inactive'}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-2">Sync Frequency</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {integration.syncFrequency.replace('_', ' ')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Field Mappings</p>
            <p className="text-sm text-gray-700">{integration.mapping.length} fields mapped</p>
          </div>

          {integration.isActive && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center text-blue-700 mb-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Last Sync: 9:30 AM</span>
              </div>
              <p className="text-xs text-blue-600">45 records synchronized successfully</p>
            </div>
          )}

          <button className={`w-full py-2 px-4 rounded-lg font-medium transition ${integration.isActive
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}>
            {integration.isActive ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    );
  };

  const CommunicationCard = ({ template }: { template: CommunicationTemplate }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${template.isActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
            <Mail className={`w-5 h-5 ${template.isActive ? 'text-blue-600' : 'text-gray-400'
              }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{template.type.replace('_', ' ')}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
          {template.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 mb-1">Channels</p>
          <div className="flex flex-wrap gap-1">
            {template.channels.map(channel => (
              <span key={channel} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                {channel}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Trigger</p>
          <p className="text-sm text-gray-900">{template.trigger.replace('_', ' ')}</p>
        </div>

        {template.isActive && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700">Sent today:</span>
              <span className="font-medium text-green-900">
                {Math.floor(Math.random() * 20)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-green-700">Success rate:</span>
              <span className="font-medium text-green-900">
                {(95 + Math.random() * 5).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Link className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Link className="w-8 h-8 text-indigo-600 mr-3" />
              🔗 Smart Integrations
            </h1>
            <p className="text-gray-600 mt-1">
              Seamless data flow eliminating 15-20 hours of manual work monthly
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 mt-4">
          {[
            { id: 'overview', label: '📊 Overview', icon: TrendingUp },
            { id: 'integrations', label: '🔌 Integrations', icon: Plug },
            { id: 'communications', label: '📧 Communications', icon: Mail },
            { id: 'sequences', label: '🔄 Sequences', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Integrations</p>
                    <p className="text-3xl font-bold">{dashboardData.total_integrations}</p>
                  </div>
                  <Plug className="w-10 h-10 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Active Connections</p>
                    <p className="text-3xl font-bold">{dashboardData.active_integrations}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Messages Sent Today</p>
                    <p className="text-3xl font-bold">
                      {dashboardData.communication_stats.reduce((sum: number, stat: any) => sum + stat.sent_today, 0)}
                    </p>
                  </div>
                  <Mail className="w-10 h-10 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Time Saved</p>
                    <p className="text-3xl font-bold">18h</p>
                    <p className="text-orange-100 text-sm">This week</p>
                  </div>
                  <Clock className="w-10 h-10 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Sync Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Recent Sync Activity</h3>
              <div className="space-y-3">
                {dashboardData.sync_status.map((sync: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">{sync.integration}</p>
                        <p className="text-sm text-gray-600">Last sync: {sync.last_sync}</p>
                      </div>
                    </div>
                    <div className="text-sm text-green-600 font-medium">Success</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Communication Performance</h3>
              <div className="grid grid-cols-2 gap-6">
                {dashboardData.communication_stats.slice(0, 4).map((stat: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{stat.template}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Sent today</span>
                      <span className="font-medium text-gray-900">{stat.sent_today}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Success rate</span>
                      <span className="font-medium text-green-600">
                        {(stat.success_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Available Integrations</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Add Integration
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>

            {/* Integration Benefits */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">💡 Integration Benefits</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Time Savings</h4>
                  <ul className="text-indigo-100 text-sm space-y-1">
                    <li>• Eliminate duplicate data entry</li>
                    <li>• Automatic payroll updates</li>
                    <li>• Real-time benefits sync</li>
                    <li>• Instant calendar integration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Accuracy</h4>
                  <ul className="text-indigo-100 text-sm space-y-1">
                    <li>• Single source of truth</li>
                    <li>• Automated error checking</li>
                    <li>• Consistent data formats</li>
                    <li>• Real-time synchronization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Communication Templates</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <CommunicationCard key={template.id} template={template} />
              ))}
            </div>

            {/* Communication Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Communication Analytics</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">156</p>
                  <p className="text-sm text-gray-600">Emails sent today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">98.2%</p>
                  <p className="text-sm text-gray-600">Delivery rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">67%</p>
                  <p className="text-sm text-gray-600">Open rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">23%</p>
                  <p className="text-sm text-gray-600">Click rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sequences' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Automation Sequences</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                Create Sequence
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {integrationEngine.getAutomationSequences().map(sequence => (
                <div key={sequence.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{sequence.name}</h3>
                      <p className="text-sm text-gray-600">Trigger: {sequence.trigger.replace('_', ' ')}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${sequence.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {sequence.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Sequence Steps</p>
                      <div className="space-y-2">
                        {sequence.steps.slice(0, 3).map((step, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700">
                              {step.action.replace('_', ' ')} ({sequence.delays[index]} days)
                            </p>
                          </div>
                        ))}
                        {sequence.steps.length > 3 && (
                          <p className="text-xs text-gray-500 ml-9">
                            +{sequence.steps.length - 3} more steps
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">Active instances:</span>
                        <span className="font-medium text-blue-900">
                          {Math.floor(Math.random() * 15) + 5}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}