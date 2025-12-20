
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/context/TenantContext';
import {
    Search, X, Command, FileText, Users, Calendar,
    FileHeart, Pill, Clock, Settings, ArrowRight,
    Building2, Map, GraduationCap, ShieldAlert, Zap, Target, History, ShieldAlert as ShieldIcon, Cpu, Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface SearchResult {
    id: string;
    type: 'client' | 'staff' | 'visit' | 'care_plan' | 'medication' | 'page';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    url: string;
}

const PAGES: SearchResult[] = [
    { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'Global Mission Overview', icon: <Building2 className="w-5 h-5" />, url: '/' },
    { id: 'rostering', type: 'page', title: 'Rostering', subtitle: 'Deployment & Logic Matrix', icon: <Calendar className="w-5 h-5" />, url: '/rostering' },
    { id: 'care-plans', type: 'page', title: 'Care Plans', subtitle: 'Clinical Architect Console', icon: <FileHeart className="w-5 h-5" />, url: '/care-plans' },
    { id: 'medication', type: 'page', title: 'Medication', subtitle: 'Neural eMAR Pipeline', icon: <Pill className="w-5 h-5" />, url: '/medication' },
    { id: 'people', type: 'page', title: 'People', subtitle: 'Entity Matrix Registry', icon: <Users className="w-5 h-5" />, url: '/people' },
    { id: 'routes', type: 'page', title: 'Routes & Map', subtitle: 'Geospatial Optimization', icon: <Map className="w-5 h-5" />, url: '/routes' },
    { id: 'training', type: 'page', title: 'Training Academy', subtitle: 'Neural Skill Synthesis', icon: <GraduationCap className="w-5 h-5" />, url: '/training' },
    { id: 'incidents', type: 'page', title: 'Incidents & Risk', subtitle: 'Hazard Response Hub', icon: <ShieldAlert className="w-5 h-5" />, url: '/incidents' },
    { id: 'settings', type: 'page', title: 'Settings', subtitle: 'Lattice Configuration', icon: <Settings className="w-5 h-5" />, url: '/settings' },
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

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                toast.info('Initializing Neural Command Palette');
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const search = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(PAGES.slice(0, 6));
            return;
        }

        setLoading(true);
        const lowerQuery = searchQuery.toLowerCase();

        try {
            const searchResults: SearchResult[] = [];

            const matchingPages = PAGES.filter(page =>
                page.title.toLowerCase().includes(lowerQuery) ||
                page.subtitle?.toLowerCase().includes(lowerQuery)
            );
            searchResults.push(...matchingPages);

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
                    title: c.name.toUpperCase(),
                    subtitle: c.address?.toUpperCase(),
                    icon: <Users className="w-5 h-5 text-primary-500" />,
                    url: `/people?client=${c.id}`
                })));
            }

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
                    title: s.full_name.toUpperCase(),
                    subtitle: s.role.toUpperCase(),
                    icon: <Users className="w-5 h-5 text-emerald-500" />,
                    url: `/people?staff=${s.id}`
                })));
            }

            setResults(searchResults.slice(0, 10));
        } catch (error) {
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
        toast.success(`Bridge Authorized: Redirecting to ${result.title}`);
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
                onClick={() => {
                    setIsOpen(true);
                    toast.info('Initializing Neural Command Palette');
                }}
                className="flex items-center gap-4 px-6 py-2.5 bg-slate-900 border border-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-white transition-all shadow-2xl active:scale-95 group"
            >
                <Search className="w-4 h-4 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Command Search</span>
                <kbd className="hidden md:flex items-center gap-1 px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black text-slate-500 border border-white/5">
                    CMD K
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl animate-in fade-in duration-500"
                onClick={close}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-[0_100px_200px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-[60px] -mr-16 -mt-16" />

                {/* Search Input */}
                <div className="flex items-center px-12 py-10 border-b border-slate-50 relative z-10">
                    <Search className="w-8 h-8 text-primary-600 mr-6" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="ENTER NEURAL SEARCH PARAMETERS..."
                        className="flex-1 text-2xl font-black outline-none bg-transparent text-slate-900 uppercase tracking-tighter placeholder:text-slate-100"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="p-3 text-slate-300 hover:text-slate-900 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                    <button onClick={close} className="ml-6 px-6 py-2 text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 rounded-xl tracking-widestAlpha">
                        ESC
                    </button>
                </div>

                {/* Results Matrix */}
                <div className="max-h-[500px] overflow-y-auto scrollbar-hide py-4 relative z-10 bg-white">
                    {loading ? (
                        <div className="py-32 text-center text-slate-900 grayscale opacity-10 flex flex-col items-center gap-10">
                            <Cpu size={80} className="animate-spin" />
                            <p className="font-black uppercase tracking-[0.8em] text-[18px]">Synchronizing Command Results...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-32 text-center text-slate-900 grayscale opacity-10 flex flex-col items-center gap-10">
                            <Globe size={100} />
                            <div className="space-y-4">
                                <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Spectrum Detected</p>
                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em]">Query parameters returned no active nodes</p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 space-y-2">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center gap-8 px-10 py-6 text-left rounded-[2rem] transition-all relative group ${index === selectedIndex ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`p-4 rounded-[1.5rem] shadow-2xl transition-transform group-hover:rotate-6 ${index === selectedIndex ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-900'}`}>
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xl font-black uppercase tracking-tighter leading-none ${index === selectedIndex ? 'text-white' : 'text-slate-900'}`}>
                                            {result.title}
                                        </p>
                                        {result.subtitle && (
                                            <p className={`text-[9px] font-black uppercase tracking-widestAlpha mt-1 ${index === selectedIndex ? 'text-slate-400' : 'text-slate-300'}`}>{result.subtitle}</p>
                                        )}
                                    </div>
                                    <div className={`text-[9px] font-black uppercase tracking-[0.4em] px-6 py-2 rounded-xl border ${index === selectedIndex ? 'bg-white/10 border-white/20 text-primary-400' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                        {result.type}
                                    </div>
                                    {index === selectedIndex && (
                                        <ArrowRight className="w-8 h-8 text-primary-600 animate-in slide-in-from-left-4" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Command Footer */}
                <div className="px-12 py-6 bg-slate-50 border-t border-slate-50 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-10 text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">
                        <span className="flex items-center gap-3">
                            <kbd className="px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-900 font-black">↑↓</kbd> NAVIGATE
                        </span>
                        <span className="flex items-center gap-3">
                            <kbd className="px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-900 font-black">↵</kbd> AUTHORIZE
                        </span>
                        <span className="flex items-center gap-3">
                            <kbd className="px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-900 font-black">ESC</kbd> DECOMMISSION
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em]">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Neural Bridge: OPTIMIZED
                    </div>
                </div>
            </div>
        </div>
    );
}
