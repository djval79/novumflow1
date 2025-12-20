
import React, { useState, useMemo } from 'react';
import { HelpCircle, Search, X, ChevronRight, MessageCircle, ExternalLink, Book } from 'lucide-react';
import { helpTopics } from '../data/helpContent';

export default function HelpCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const filteredTopics = useMemo(() => {
        if (!searchQuery) return helpTopics;
        return helpTopics.filter(topic =>
            topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery]);

    const categories = useMemo(() => {
        const cats: Record<string, typeof helpTopics> = {};
        filteredTopics.forEach(topic => {
            if (!cats[topic.category]) cats[topic.category] = [];
            cats[topic.category].push(topic);
        });
        return cats;
    }, [filteredTopics]);

    const activeTopic = helpTopics.find(t => t.id === selectedTopic);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-500 hover:text-cyan-600 transition-colors rounded-full hover:bg-cyan-50 relative group"
                title="Help & Support"
            >
                <HelpCircle className="w-6 h-6" />
                <span className="absolute hidden group-hover:block top-full mt-1 right-0 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
                    Help Center
                </span>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-over Panel */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
                        <h2 className="text-lg font-semibold flex items-center">
                            <Book className="w-5 h-5 mr-2" />
                            Help Center
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {selectedTopic ? (
                            <div className="p-6">
                                <button
                                    onClick={() => setSelectedTopic(null)}
                                    className="mb-4 text-sm text-cyan-600 hover:text-cyan-700 flex items-center font-medium"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                                    Back to topics
                                </button>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">{activeTopic?.title}</h3>
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mb-6">
                                    {activeTopic?.category}
                                </span>

                                <div className="prose prose-sm prose-cyan text-gray-600">
                                    <p className="whitespace-pre-line leading-relaxed">
                                        {activeTopic?.content}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 mb-3">Still need help?</p>
                                    <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700">
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search for help..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-shadow"
                                    />
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(categories).map(([category, topics]) => (
                                        <div key={category}>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                                {category}
                                            </h3>
                                            <div className="space-y-2">
                                                {topics.map(topic => (
                                                    <button
                                                        key={topic.id}
                                                        onClick={() => setSelectedTopic(topic.id)}
                                                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-cyan-100 group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-gray-700 group-hover:text-cyan-700">
                                                                {topic.title}
                                                            </span>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-400" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {filteredTopics.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No help topics found matching "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <a
                            href="#"
                            className="flex items-center justify-center text-sm text-gray-600 hover:text-cyan-600 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Documentation Hub
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
