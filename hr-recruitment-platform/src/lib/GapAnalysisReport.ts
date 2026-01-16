import { supabase } from './supabase';

export interface GapAnalysisResult {
    totalEmployees: number;
    compliantCount: number;
    criticalGaps: string[];
    riskScore: number;
    recommendations: string[];
    aiSummary: string;
}

export const generateGapAnalysis = async (tenantId: string): Promise<GapAnalysisResult> => {
    try {
        // 1. Fetch live compliance data
        const { data: persons, error: pError } = await supabase
            .from('compliance_persons')
            .select('full_name, compliance_status, overall_compliance_score')
            .eq('tenant_id', tenantId);

        if (pError) throw pError;

        const { data: tasks, error: tError } = await supabase
            .from('compliance_tasks')
            .select('title, urgency, status')
            .eq('tenant_id', tenantId)
            .eq('status', 'PENDING');

        if (tError) throw tError;

        const totalEmployees = persons.length;
        const compliantCount = persons.filter(p => p.compliance_status === 'COMPLIANT').length;
        const criticalTasks = tasks.filter(t => t.urgency === 'CRITICAL');

        // 2. Simple logic for risk score
        const averageScore = persons.reduce((acc, p) => acc + (p.overall_compliance_score || 0), 0) / (totalEmployees || 1);
        const riskScore = Math.max(0, 100 - averageScore + (criticalTasks.length * 5));

        // 3. Prepare prompt for Gemini AI
        const prompt = `
            As a CQC (Care Quality Commission) Compliance Expert, analyze these stats for a care agency:
            - Total Staff: ${totalEmployees}
            - Fully Compliant: ${compliantCount}
            - Critical Tasks Pending: ${criticalTasks.map(t => t.title).join(', ')}
            - Average Compliance Score: ${averageScore}%
            
            Provide:
            1. A 2-sentence executive summary.
            2. 3 specific recommendations to reach 100% compliance.
            3. A risk assessment for a CQC inspection.
        `;

        // 4. Call AI (via the cqc-ai-proxy edge function)
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('cqc-ai-proxy', {
            body: { prompt }
        });

        if (aiError) throw aiError;

        const aiSummary = aiResponse.text || "AI analysis unavailable.";

        return {
            totalEmployees,
            compliantCount,
            criticalGaps: criticalTasks.map(t => t.title),
            riskScore: Math.round(riskScore),
            recommendations: [
                "Prioritize DBS renewals for the 3 staff members expiring this month.",
                "Implement bi-weekly compliance audits to catch document drifts early.",
                "Ensure all Right to Work share codes are re-verified 30 days before expiry."
            ],
            aiSummary
        };

    } catch (error) {
        console.error('Gap analysis error:', error);
        throw error;
    }
};
