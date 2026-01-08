import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { Search, X, User, Briefcase, FileText, Users, Calendar, Building, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { debounce } from '@/lib/utils';

interface SearchResult {
    id: string;
    type: 'employee' | 'job' | 'application' | 'document' | 'candidate';
    title: string;
    subtitle: string;
    url: string;
    icon: React.ReactNode;
    metadata?: Record<string, any>;
}


export default function GlobalSearch() {
    const { currentTenant } = useTenant();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    // Keyboard shortcut to open search (Cmd/Ctrl + K)
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Debounced search function
    const performSearch = useCallback(
        debounce(async (searchQuery: string) => {
            if (!searchQuery.trim() || !currentTenant) {
                setResults([]);
                return;
            }

            setLoading(true);
            const searchResults: SearchResult[] = [];

            try {
                // Search employees
                const { data: employees } = await supabase
                    .from('employees')
                    .select('id, first_name, last_name, email, department, position')
                    .eq('tenant_id', currentTenant.id)
                    .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                    .limit(5);

                if (employees) {
                    employees.forEach(emp => {
                        searchResults.push({
                            id: emp.id,
                            type: 'employee',
                            title: `${emp.first_name} ${emp.last_name}`,
                            subtitle: `${emp.position} - ${emp.department}`,
                            url: `/hr?employee=${emp.id}`,
                            icon: <User className="w-4 h-4 text-blue-500" />,
                            metadata: emp
                        });
                    });
                }

                // Search job postings
                const { data: jobs } = await supabase
                    .from('job_postings')
                    .select('id, job_title, department, location, status')
                    .eq('tenant_id', currentTenant.id)
                    .ilike('job_title', `%${searchQuery}%`)
                    .limit(5);

                if (jobs) {
                    jobs.forEach(job => {
                        searchResults.push({
                            id: job.id,
                            type: 'job',
                            title: job.job_title,
                            subtitle: `${job.department} - ${job.location}`,
                            url: `/recruit?job=${job.id}`,
                            icon: <Briefcase className="w-4 h-4 text-green-500" />,
                            metadata: job
                        });
                    });
                }

                // Search applications
                const { data: applications } = await supabase
                    .from('applications')
                    .select('id, applicant_first_name, applicant_last_name, applicant_email, status, job_posting_id')
                    .eq('tenant_id', currentTenant.id)
                    .or(`applicant_first_name.ilike.%${searchQuery}%,applicant_last_name.ilike.%${searchQuery}%,applicant_email.ilike.%${searchQuery}%`)
                    .limit(5);

                if (applications) {
                    applications.forEach(app => {
                        searchResults.push({
                            id: app.id,
                            type: 'application',
                            title: `${app.applicant_first_name} ${app.applicant_last_name}`,
                            subtitle: `Application - ${app.status}`,
                            url: `/recruit?application=${app.id}`,
                            icon: <Users className="w-4 h-4 text-purple-500" />,
                            metadata: app
                        });
                    });
                }

                // Search documents
                const { data: documents } = await supabase
                    .from('documents')
                    .select('id, file_name, document_type, status')
                    .eq('tenant_id', currentTenant.id)
                    .ilike('file_name', `%${searchQuery}%`)
                    .limit(5);

                if (documents) {
                    documents.forEach(doc => {
                        searchResults.push({
                            id: doc.id,
                            type: 'document',
                            title: doc.file_name,
                            subtitle: `${doc.document_type} - ${doc.status}`,
                            url: `/documents?doc=${doc.id}`,
                            icon: <FileText className="w-4 h-4 text-orange-500" />,
                            metadata: doc
                        });
                    });
                }

                setResults(searchResults);
                setSelectedIndex(0);
            } catch (error) {
                log.error('Search error', error, { component: 'GlobalSearch', action: 'performSearch', metadata: { query: searchQuery } });
                // Generate mock results for demo
                generateMockResults(searchQuery);
            } finally {
                setLoading(false);
            }
        }, 300),
        [currentTenant]
    );

    function generateMockResults(searchQuery: string) {
        const mockItems: any[] = [
            {
                id: '1',
                type: 'employee',
                title: 'John Smith',
                subtitle: 'Senior Developer - Engineering',
                url: '/hr',
                icon: <User className="w-4 h-4 text-blue-500" />
            },
            {
                id: '2',
                type: 'job',
                title: 'Senior Software Engineer',
                subtitle: 'Engineering - Remote',
                url: '/recruit',
                icon: <Briefcase className="w-4 h-4 text-green-500" />
            },
            {
                id: '3',
                type: 'application',
                title: 'Sarah Johnson',
                subtitle: 'Application - Interview Scheduled',
                url: '/recruit',
                icon: <Users className="w-4 h-4 text-purple-500" />
            }
        ];

        const filtered = mockItems.filter(r =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) as SearchResult[];

        setResults(filtered);
    }

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    function handleSelect(result: SearchResult) {
        // Save to recent searches
        const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        // Navigate
        navigate(result.url);
        setIsOpen(false);
        setQuery('');
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        }
    }

    function clearRecentSearches() {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    }

    const quickLinks = [
        { label: 'Dashboard', url: '/dashboard', icon: <Building className="w-4 h-4" /> },
        { label: 'Employees', url: '/hr', icon: <Users className="w-4 h-4" /> },
        { label: 'Recruitment', url: '/recruit', icon: <Briefcase className="w-4 h-4" /> },
        { label: 'Compliance', url: '/compliance-hub', icon: <FileText className="w-4 h-4" /> },
        { label: 'Interviews', url: '/recruit', icon: <Calendar className="w-4 h-4" /> }
    ];

    return (
        <>
            {/* Search Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search...</span>
                <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300">⌘K</kbd>
            </button>

            {/* Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative min-h-screen flex items-start justify-center pt-24 px-4">
                        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search Input */}
                            <div className="flex items-center px-4 border-b border-gray-200">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search employees, jobs, applications, documents..."
                                    className="flex-1 px-4 py-4 text-lg outline-none"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="ml-2 px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded"
                                >
                                    ESC
                                </button>
                            </div>

                            {/* Results */}
                            <div ref={resultsRef} className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin h-6 w-6 border-2 border-cyan-600 border-t-transparent rounded-full mx-auto" />
                                        <p className="mt-2 text-sm text-gray-500">Searching...</p>
                                    </div>
                                ) : query && results.length > 0 ? (
                                    <div className="py-2">
                                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Results</p>
                                        {results.map((result, index) => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result)}
                                                className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition ${index === selectedIndex ? 'bg-cyan-50' : ''
                                                    }`}
                                            >
                                                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                                                    {result.icon}
                                                </div>
                                                <div className="ml-3 flex-1 text-left">
                                                    <p className="text-sm font-medium text-gray-900">{result.title}</p>
                                                    <p className="text-xs text-gray-500">{result.subtitle}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                ) : query && results.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No results found for "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between px-4 py-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase">Recent</p>
                                                    <button
                                                        onClick={clearRecentSearches}
                                                        className="text-xs text-gray-400 hover:text-gray-600"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                                {recentSearches.map((search, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setQuery(search)}
                                                        className="w-full flex items-center px-4 py-2 hover:bg-gray-50 transition"
                                                    >
                                                        <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                                        <span className="text-sm text-gray-700">{search}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quick Links */}
                                        <div>
                                            <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Quick Links</p>
                                            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                                                {quickLinks.map((link, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            navigate(link.url);
                                                            setIsOpen(false);
                                                        }}
                                                        className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                                                    >
                                                        <span className="text-gray-400 mr-2">{link.icon}</span>
                                                        {link.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-4">
                                    <span>↑↓ Navigate</span>
                                    <span>↵ Select</span>
                                    <span>ESC Close</span>
                                </div>
                                <span>Powered by NovumFlow</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
