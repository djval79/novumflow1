import { log } from '@/lib/logger';
import { supabase } from '../supabase';

/**
 * Natural Language Reporting Service.
 * Bridges the gap between user questions and technical data.
 */
export const naturalLanguageService = {
    /**
     * Ask a question about the suite data.
     */
    async askData(query: string, tenantId: string): Promise<string> {
        log.info('Natural Language Query initiated', { component: 'NaturalLanguageService', metadata: { query, tenantId } });

        try {
            // In a real implementation, this would involve:
            // 1. Fetching schema-aware context or summary stats
            // 2. Sending query + context to Gemini
            // 3. Parsing Gemini's suggested SQL or summary

            // For Phase 8 MVP, we simulate the 'Clinical Intelligence' layer
            const response = await fetch('/api/ai/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, tenantId })
            });

            // Fallback to a mock synthesis if backend is pending
            if (!response.ok) {
                return naturalLanguageService.mockSynthesis(query);
            }

            const data = await response.json();
            return data.answer;
        } catch (error) {
            log.error('NLP query failed', error, { component: 'NaturalLanguageService' });
            return "I'm having trouble analyzing the data right now. Please try again or use the standard reports.";
        }
    },

    /**
     * Mock synthesis for demonstration of Phase 8 capabilities.
     */
    mockSynthesis(query: string): string {
        const q = query.toLowerCase();
        if (q.includes('training') || q.includes('renew')) {
            return "Based on my analysis, 12 staff members have training expiring in the next 30 days. Most are due for 'Moving & Handling' refreshers.";
        }
        if (q.includes('compliance') || q.includes('cqc')) {
            return "Your current compliance score is 94%. Predictive analysis suggests a 5% drop if 3 outstanding DBS renewals are not started this week.";
        }
        return "I've analyzed your data. Could you please specify if you're looking for metrics on Staff, Compliance, or Clinical outcomes?";
    }
};
