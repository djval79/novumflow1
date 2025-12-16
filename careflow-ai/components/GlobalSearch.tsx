import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/context/TenantContext';
import {
    Search, X, Command, FileText, Users, Calendar,
    FileHeart, Pill, Clock, Settings, ArrowRight,
    Building2, Map, GraduationCap, ShieldAlert
} from 'lucide-react';

interface SearchResult {
    id: string;
    type: 'client' | 'staff' | 'visit' | 'care_plan' | 'medication' | 'page';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    url: string;
}

const PAGES: SearchResult[] = [
    { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'Overview and stats', icon: <Building2 className="w-4 h-4" />, url: '/' },
    { id: 'rostering', type: 'page', title: 'Rostering', subtitle: 'Staff schedules and shifts', icon: <Calendar className="w-4 h-4" />, url: '/rostering' },
    { id: 'care-plans', type: 'page', title: 'Care Plans', subtitle: 'Client care documentation', icon: <FileHeart className="w-4 h-4" />, url: '/care-plans' },
    { id: 'medication', type: 'page', title: 'Medication', subtitle: 'eMAR and prescriptions', icon: <Pill className="w-4 h-4" />, url: '/medication' },
    { id: 'people', type: 'page', title: 'People', subtitle: 'Staff and clients', icon: <Users className="w-4 h-4" />, url: '/people' },
    { id: 'routes', type: 'page', title: 'Routes & Map', subtitle: 'Visit optimization', icon: <Map className="w-4 h-4" />, url: '/routes' },
    { id: 'training', type: 'page', title: 'Training Academy', subtitle: 'Staff development', icon: <GraduationCap className="w-4 h-4" />, url: '/training' },
    { id: 'incidents', type: 'page', title: 'Incidents & Risk', subtitle: 'Safeguarding and CQC', icon: <ShieldAlert className="w-4 h-4" />, url: '/incidents' },
    { id: 'settings', type: 'page', title: 'Settings', subtitle: 'App configuration', icon: <Settings className="w-4 h-4" />, url: '/settings' },
];

export default function GlobalSearch() {
    const navigate = useNavigate();
    const { currentTenant } = useTenant();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut to open (Cmd+K or Ctrl+K)
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

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search function
    const search = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(PAGES.slice(0, 6));
            return;
        }

        setLoading(true);
        const lowerQuery = searchQuery.toLowerCase();

        try {
            const searchResults: SearchResult[] = [];

            // Search pages
            const matchingPages = PAGES.filter(page =>
                page.title.toLowerCase().includes(lowerQuery) ||
                page.subtitle?.toLowerCase().includes(lowerQuery)
            );
            searchResults.push(...matchingPages);

            // Search clients
            const { data: clients } = await supabase
                .from('clients')
                .select('id, name, address')
                .eq('tenant_id', currentTenant?.id)
                .ilike('name', `%${searchQuery}%`)
                .limit(5);

            if (clients) {
                searchResults.push(...clients.map(c => ({
                    id: c.id,
                    type: 'client' as const,
                    title: c.name,
                    subtitle: c.address,
                    icon: <Users className="w-4 h-4 text-cyan-500" />,
                    url: `/people?client=${c.id}`
                })));
            }

            // Search staff
            const { data: staff } = await supabase
                .from('employees')
                .select('id, full_name, role')
                .eq('tenant_id', currentTenant?.id)
                .ilike('full_name', `%${searchQuery}%`)
                .limit(5);

            if (staff) {
                searchResults.push(...staff.map(s => ({
                    id: s.id,
                    type: 'staff' as const,
                    title: s.full_name,
                    subtitle: s.role,
                    icon: <Users className="w-4 h-4 text-blue-500" />,
                    url: `/people?staff=${s.id}`
                })));
            }

            setResults(searchResults.slice(0, 10));
        } catch (error) {
            console.error('Search error:', error);
            // Fallback to page search only
            setResults(PAGES.filter(page =>
                page.title.toLowerCase().includes(lowerQuery)
            ));
        } finally {
            setLoading(false);
        }
    }, [currentTenant]);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 150);
        return () => clearTimeout(timer);
    }, [query, search]);

    // Keyboard navigation
    function handleKeyDown(e: React.KeyboardEvent) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
        }
    }

    function handleSelect(result: SearchResult) {
        navigate(result.url);
        setIsOpen(false);
        setQuery('');
    }

    function close() {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-500 transition"
            >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search...</span>
                <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded text-xs font-medium border border-slate-200">
                    <Command className="w-3 h-3" />K
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={close}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-start justify-center pt-[20vh] px-4">
                <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center px-4 border-b border-slate-200">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search clients, staff, pages..."
                            className="flex-1 px-4 py-4 text-base outline-none bg-transparent"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={close} className="ml-2 px-2 py-1 text-xs text-slate-500 bg-slate-100 rounded">
                            ESC
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto py-2">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-slate-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600 mx-auto" />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500">
                                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">No results found</p>
                            </div>
                        ) : (
                            <div>
                                {results.map((result, index) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${index === selectedIndex ? 'bg-cyan-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${result.type === 'page' ? 'bg-slate-100' :
                                                result.type === 'client' ? 'bg-cyan-100' : 'bg-blue-100'
                                            }`}>
                                            {result.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${index === selectedIndex ? 'text-cyan-900' : 'text-slate-900'}`}>
                                                {result.title}
                                            </p>
                                            {result.subtitle && (
                                                <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                            )}
                                        </div>
                                        <div className={`text-xs px-2 py-0.5 rounded ${result.type === 'page' ? 'bg-slate-100 text-slate-600' :
                                                result.type === 'client' ? 'bg-cyan-100 text-cyan-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {result.type}
                                        </div>
                                        {index === selectedIndex && (
                                            <ArrowRight className="w-4 h-4 text-cyan-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd> navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd> select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border">esc</kbd> close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
