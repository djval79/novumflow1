import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HelpContextType {
    isOpen: boolean;
    openHelp: (topicId?: string) => void;
    closeHelp: () => void;
    toggleHelp: () => void;
    currentTopicId: string | null;
    openTopic: (topicId: string) => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);

    const openHelp = (topicId?: string) => {
        if (topicId) {
            setCurrentTopicId(topicId);
        }
        setIsOpen(true);
    };

    const closeHelp = () => {
        setIsOpen(false);
    };

    const toggleHelp = () => {
        setIsOpen(prev => !prev);
    };

    const openTopic = (topicId: string) => {
        setCurrentTopicId(topicId);
        setIsOpen(true);
    };

    return (
        <HelpContext.Provider value={{
            isOpen,
            openHelp,
            closeHelp,
            toggleHelp,
            currentTopicId,
            openTopic
        }}>
            {children}
        </HelpContext.Provider>
    );
}

export function useHelp() {
    const context = useContext(HelpContext);
    if (context === undefined) {
        throw new Error('useHelp must be used within a HelpProvider');
    }
    return context;
}
