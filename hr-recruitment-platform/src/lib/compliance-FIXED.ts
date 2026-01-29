// Enhanced Compliance and Audit Trail System
// Fixed: Comprehensive logging, regulatory compliance, automated monitoring, audit trails

import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

// Compliance framework
export const COMPLIANCE_FRAMEWORK = {
  GDPR: {
    consentRequired: true,
    dataRetentionDays: 365,
    rightToBeForgotten: true,
    dataPortability: true,
    encryptionRequired: true
  },
  HIPAA: {
    auditLogRetention: 6 * 365, // 6 years
    accessLogEnabled: true,
    emergencyAccessProcedures: true,
    backupProcedures: true,
    breachNotification: 72 // 72 hours
  },
  ISO27001: {
    riskAssessmentRequired: true,
    securityControlsRequired: true,
    incidentManagement: true,
    businessContinuity: true,
    complianceMonitoring: true
  },
  SOX: {
    financialControls: true,
    auditTrails: true,
    changeManagement: true,
    accessControls: true,
    dataIntegrity: true
  }
};

// Enhanced audit logger
export class ComplianceAuditor {
  private static logEvent = async (
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
    metadata?: any
  ) => {
    try {
      const { error } = await supabase
        .from('security_audit_logs')
        .insert({
          tenant_id: metadata?.tenantId || '00000000-0000-0000-0000-000000000000',
          user_id: supabase.auth.user?.id,
          event_type: eventType,
          severity,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: await this.getClientIP(),
            sessionId: this.getSessionId(),
            environment: import.meta.env.MODE,
            complianceFramework: metadata?.complianceFramework || 'ISO27001'
          },
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });

      if (error) {
        log.error('Audit log failed', error, {
          component: 'ComplianceAuditor',
          action: 'logEvent',
          metadata: { eventType, severity, details }
        });
      }
    } catch (error: any) {
      log.error('Unexpected audit error', error, {
        component: 'ComplianceAuditor',
        action: 'logEvent',
        metadata: { eventType, severity, details }
      });
    }
  };

  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      // Fallback to a safe default
      return '127.0.0.1';
    }
  }

  private static getSessionId(): string {
    // Generate a session identifier for tracking
    let sessionId = sessionStorage.getItem('novumflow_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('novumflow_session_id', sessionId);
    }
    return sessionId;
  }

  // GDPR compliance methods
  static async logDataAccess(dataType: string, recordId: string, purpose: string): Promise<void> {
    await this.logEvent('data_access', 'medium', {
      dataType,
      recordId,
      purpose,
      consent: await this.getConsentRecord(dataType),
      legalBasis: 'GDPR_Article6'
    }, { complianceFramework: 'GDPR' });
  }

  static async logDataModification(dataType: string, recordId: string, changes: any[]): Promise<void> {
    await this.logEvent('data_modification', 'medium', {
      dataType,
      recordId,
      changes: changes.map(change => ({
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        timestamp: change.timestamp,
        reason: change.reason
      })),
      legalBasis: 'GDPR_Article5'
    }, { complianceFramework: 'GDPR' });
  }

  static async logDataDeletion(dataType: string, recordId: string, method: 'soft' | 'hard'): Promise<void> {
    await this.logEvent('data_deletion', 'high', {
      dataType,
      recordId,
      method,
      retentionPeriod: COMPLIANCE_FRAMEWORK.GDPR.dataRetentionDays,
      legalBasis: 'GDPR_Article17'
    }, { complianceFramework: 'GDPR' });
  }

  // HIPAA compliance methods
  static async logPHIAccess(recordType: string, patientId: string, accessedBy: string): Promise<void> {
    await this.logEvent('phi_access', 'high', {
      recordType,
      patientId,
      accessedBy,
      minimumNecessary: true,
      purpose: 'Treatment, Payment, Healthcare Operations',
      legalBasis: 'HIPAA_PrivacyRule'
    }, { complianceFramework: 'HIPAA' });
  }

  static async logPHIBreach(incidentType: string, affectedRecords: number, description: string): Promise<void> {
    await this.logEvent('phi_breach', 'critical', {
      incidentType,
      affectedRecords,
      description,
      notificationRequired: true,
      notificationDeadline: new Date(Date.now() + (72 * 60 * 60 * 1000)).toISOString(),
      legalBasis: 'HIPAA_BreachNotification'
    }, { complianceFramework: 'HIPAA' });
  }

  // SOX compliance methods
  static async logFinancialTransaction(transactionId: string, amount: number, category: string): Promise<void> {
    await this.logEvent('financial_transaction', 'medium', {
      transactionId,
      amount,
      category,
      approverRequired: amount > 10000, // Large transactions require approval
      legalBasis: 'SOX_Section404'
    }, { complianceFramework: 'SOX' });
  }

  // ISO27001 compliance methods
  static async logSystemChange(changeType: string, component: string, riskLevel: 'low' | 'medium' | 'high'): Promise<void> {
    await this.logEvent('system_change', 'medium', {
      changeType,
      component,
      riskLevel,
      authorizationRequired: riskLevel !== 'low',
      reviewRequired: riskLevel === 'high',
      legalBasis: 'ISO27001_A12.1.3'
    }, { complianceFramework: 'ISO27001' });
  }

  static async logAccessControl(accessType: string, resource: string, granted: boolean, reason?: string): Promise<void> {
    await this.logEvent('access_control', 'medium', {
      accessType,
      resource,
      granted,
      reason,
      sessionInfo: {
        userId: supabase.auth.user?.id,
        sessionId: this.getSessionId()
      }
    }, { complianceFramework: 'ISO27001' });
  }

  // Consent management
  private static async getConsentRecord(dataType: string): Promise<{
    given: boolean;
    timestamp: string;
    withdrawnAt?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', supabase.auth.user?.id)
        .eq('data_type', dataType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        log.error('Failed to get consent record', error);
        return { given: false, timestamp: new Date().toISOString() };
      }

      return data || { given: false, timestamp: new Date().toISOString() };
    } catch {
      return { given: false, timestamp: new Date().toISOString() };
    }
  }

  // Automated compliance checks
  static async runComplianceCheck(tenantId?: string): Promise<{
    overall: 'compliant' | 'non_compliant' | 'requires_action';
    issues: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
    score: number; // 0-100
  }> {
    const issues = [];
    let totalScore = 100;

    try {
      // Check data retention compliance
      const retentionIssues = await this.checkDataRetention(tenantId);
      issues.push(...retentionIssues);
      totalScore -= retentionIssues.length * 10;

      // Check access control compliance
      const accessIssues = await this.checkAccessControls(tenantId);
      issues.push(...accessIssues);
      totalScore -= accessIssues.length * 15;

      // Check encryption compliance
      const encryptionIssues = await this.checkEncryptionCompliance(tenantId);
      issues.push(...encryptionIssues);
      totalScore -= encryptionIssues.length * 20;

      // Check audit trail completeness
      const auditIssues = await this.checkAuditTrailCompleteness(tenantId);
      issues.push(...auditIssues);
      totalScore -= auditIssues.length * 5;

      // Check GDPR compliance
      const gdprIssues = await this.checkGDPRCompliance(tenantId);
      issues.push(...gdprIssues);
      totalScore -= gdprIssues.length * 15;

      const overall = totalScore >= 80 ? 'compliant' : 
                     totalScore >= 60 ? 'requires_action' : 'non_compliant';

      // Log compliance check
      await this.logEvent('compliance_check', 'low', {
        overall,
        score: totalScore,
        issueCount: issues.length,
        categories: [...new Set(issues.map(issue => issue.category))],
        timestamp: new Date().toISOString()
      }, { tenantId, complianceFramework: 'ISO27001' });

      return { overall, issues, score: totalScore };
    } catch (error) {
      log.error('Compliance check failed', error);
      return {
        overall: 'non_compliant',
        issues: [{
          category: 'system',
          severity: 'high',
          description: `Compliance check failed: ${error.message}`,
          recommendation: 'Review system configuration and retry'
        }],
        score: 0
      };
    }
  }

  private static async checkDataRetention(tenantId?: string): Promise<any[]> {
    const issues = [];

    try {
      // Check if data is retained longer than required
      const { data: expiredData } = await supabase
        .from('security_audit_logs')
        .select('*')
        .lt('created_at', new Date(Date.now() - (COMPLIANCE_FRAMEWORK.GDPR.dataRetentionDays * 24 * 60 * 60 * 1000)).toISOString())
        .limit(100);

      if (expiredData && expiredData.length > 0) {
        issues.push({
          category: 'data_retention',
          severity: 'high',
          description: `Found ${expiredData.length} audit records older than ${COMPLIANCE_FRAMEWORK.GDPR.dataRetentionDays} days`,
          recommendation: 'Implement automatic data retention cleanup'
        });
      }
    } catch (error) {
      issues.push({
        category: 'data_retention',
        severity: 'medium',
        description: `Data retention check failed: ${error.message}`,
        recommendation: 'Review data retention policies'
      });
    }

    return issues;
  }

  private static async checkAccessControls(tenantId?: string): Promise<any[]> {
    const issues = [];

    try {
      // Check for users without proper access controls
      const { data: usersWithoutRoles } = await supabase
        .from('users_profiles')
        .select('id, email, role')
        .is('role', null)
        .limit(10);

      if (usersWithoutRoles && usersWithoutRoles.length > 0) {
        issues.push({
          category: 'access_control',
          severity: 'high',
          description: `Found ${usersWithoutRoles.length} users without assigned roles`,
          recommendation: 'Assign proper roles to all users'
        });
      }

      // Check for elevated access without review
      const { data: unreviewedAdmins } = await supabase
        .from('users_profiles')
        .select('id, email, created_at')
        .eq('role', 'admin')
        .lt('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString())
        .limit(5);

      if (unreviewedAdmins && unreviewedAdmins.length > 0) {
        issues.push({
          category: 'access_control',
          severity: 'medium',
          description: `Found ${unreviewedAdmins.length} admin users created without review`,
          recommendation: 'Implement admin approval workflow'
        });
      }
    } catch (error) {
      issues.push({
        category: 'access_control',
        severity: 'medium',
        description: `Access control check failed: ${error.message}`,
        recommendation: 'Review access control implementation'
      });
    }

    return issues;
  }

  private static async checkEncryptionCompliance(tenantId?: string): Promise<any[]> {
    const issues = [];

    try {
      // Check for unencrypted sensitive data
      const { data: unencryptedData } = await supabase
        .from('employees')
        .select('id, email, phone, national_insurance_number')
        .is('phone_encrypted', false)
        .or('email_encrypted', false)
        .or('national_insurance_number_encrypted', false)
        .limit(5);

      if (unencryptedData && unencryptedData.length > 0) {
        issues.push({
          category: 'encryption',
          severity: 'high',
          description: `Found ${unencryptedData.length} records with unencrypted sensitive data`,
          recommendation: 'Implement field-level encryption for sensitive data'
        });
      }
    } catch (error) {
      issues.push({
        category: 'encryption',
        severity: 'medium',
        description: `Encryption compliance check failed: ${error.message}`,
        recommendation: 'Review encryption implementation'
      });
    }

    return issues;
  }

  private static async checkAuditTrailCompleteness(tenantId?: string): Promise<any[]> {
    const issues = [];

    try {
      // Check for gaps in audit trail
      const { data: auditGaps } = await supabase
        .from('security_audit_logs')
        .select('event_type, created_at')
        .gte('created_at', new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString())
        .is('event_type', null) // Missing audit events
        .limit(10);

      if (auditGaps && auditGaps.length > 0) {
        issues.push({
          category: 'audit_trail',
          severity: 'medium',
          description: `Found ${auditGaps.length} gaps in audit trail for the last 7 days`,
          recommendation: 'Ensure all critical operations are logged'
        });
      }
    } catch (error) {
      issues.push({
        category: 'audit_trail',
        severity: 'medium',
        description: `Audit trail check failed: ${error.message}`,
        recommendation: 'Review audit logging configuration'
      });
    }

    return issues;
  }

  private static async checkGDPRCompliance(tenantId?: string): Promise<any[]> {
    const issues = [];

    try {
      // Check for consent records
      const { data: consentIssues } = await supabase
        .from('consent_records')
        .select('*')
        .is('given', false)
        .limit(5);

      if (consentIssues && consentIssues.length > 0) {
        issues.push({
          category: 'gdpr',
          severity: 'high',
          description: `Found ${consentIssues.length} records without proper consent`,
          recommendation: 'Implement GDPR consent management'
        });
      }

      // Check data portability
      const { data: portabilityIssues } = await supabase
        .from('data_export_requests')
        .select('*')
        .is('completed', false)
        .lt('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString())
        .limit(5);

      if (portabilityIssues && portabilityIssues.length > 0) {
        issues.push({
          category: 'gdpr',
          severity: 'medium',
          description: `Found ${portabilityIssues.length} outstanding data export requests`,
          recommendation: 'Implement automated data export system'
        });
      }
    } catch (error) {
      issues.push({
        category: 'gdpr',
        severity: 'medium',
        description: `GDPR compliance check failed: ${error.message}`,
        recommendation: 'Review GDPR implementation'
      });
    }

    return issues;
  }
}

// Compliance monitoring dashboard
export class ComplianceMonitor {
  static async generateComplianceReport(tenantId?: string, dateRange?: {
    start: Date;
    end: Date;
  }): Promise<{
      summary: any;
      charts: any;
      recommendations: any[];
    }> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      const endDate = dateRange?.end || new Date();

      // Get compliance metrics
      const { data: metrics } = await supabase
        .from('security_audit_logs')
        .select('event_type, severity, created_at, details')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Process metrics
      const summary = {
        totalEvents: metrics?.length || 0,
        criticalEvents: metrics?.filter(e => e.severity === 'critical').length || 0,
        highEvents: metrics?.filter(e => e.severity === 'high').length || 0,
        mediumEvents: metrics?.filter(e => e.severity === 'medium').length || 0,
        lowEvents: metrics?.filter(e => e.severity === 'low').length || 0,
        complianceScore: 100 - ((metrics?.filter(e => e.severity === 'critical').length || 0) * 30) -
                      ((metrics?.filter(e => e.severity === 'high').length || 0) * 20) -
                      ((metrics?.filter(e => e.severity === 'medium').length || 0) * 10) -
                      ((metrics?.filter(e => e.severity === 'low').length || 0) * 5)
      };

      // Generate chart data
      const charts = {
        eventsBySeverity: {
          critical: summary.criticalEvents,
          high: summary.highEvents,
          medium: summary.mediumEvents,
          low: summary.lowEvents
        },
        timeline: metrics?.map(event => ({
          date: new Date(event.created_at).toLocaleDateString(),
          severity: event.severity,
          type: event.event_type,
          description: event.details?.description || ''
        })) || [],
        complianceTrend: this.calculateComplianceTrend(metrics || [])
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(summary, metrics || []);

      return {
        summary,
        charts,
        recommendations
      };
    } catch (error) {
      log.error('Failed to generate compliance report', error);
      return {
        summary: { error: error.message },
        charts: [],
        recommendations: [{
          category: 'system',
          severity: 'high',
          description: 'Failed to generate compliance report',
          recommendation: 'Review system configuration'
        }]
      };
    }
  }

  private static calculateComplianceTrend(events: any[]): any[] {
    const last30Days = [];
    const now = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayEvents = events.filter(event => 
        new Date(event.created_at).toDateString() === date.toDateString()
      );

      if (dayEvents.length > 0) {
        const score = dayEvents.reduce((acc, event) => {
          return acc + (event.severity === 'critical' ? 5 : 
                       event.severity === 'high' ? 4 : 
                       event.severity === 'medium' ? 3 : 
                       event.severity === 'low' ? 2 : 1);
        }, 100) / dayEvents.length;

        last30Days.push({
          date: date.toISOString().split('T')[0],
          score: Math.min(100, score)
        });
      }
    }

    return last30Days;
  }

  private static generateRecommendations(summary: any, events: any[]): any[] {
    const recommendations = [];

    if (summary.complianceScore < 50) {
      recommendations.push({
        category: 'compliance',
        severity: 'high',
        description: 'Compliance score is critically low',
        recommendation: 'Immediate action required to address compliance issues'
      });
    }

    if (summary.criticalEvents > 0) {
      recommendations.push({
        category: 'security',
        severity: 'high',
        description: 'Critical security events detected',
        recommendation: 'Investigate and remediate critical security issues immediately'
      });
    }

    const recentFailures = events?.filter(e => 
      e.event_type === 'login_failure' && 
      new Date(e.created_at) > new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
    );

    if (recentFailures && recentFailures.length > 5) {
      recommendations.push({
        category: 'security',
        severity: 'medium',
        description: 'Multiple recent login failures detected',
        recommendation: 'Review access controls and implement account lockout policies'
      });
    }

    return recommendations;
  }
}

// Automated compliance enforcement
export class ComplianceEnforcement {
  static async enforceDataRetentionPolicy(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (COMPLIANCE_FRAMEWORK.GDPR.dataRetentionDays * 24 * 60 * 60 * 1000));
      
      const { data } = await supabase
        .from('security_audit_logs')
        .select('id, details')
        .lt('created_at', cutoffDate.toISOString());

      if (data && data.length > 0) {
        // Archive old records instead of deleting them
        const { error } = await supabase
          .from('security_audit_logs_archived')
          .insert(data);

        if (error) {
          throw error;
        }

        // Delete original records
        const { error: deleteError } = await supabase
          .from('security_audit_logs')
          .delete()
          .lt('created_at', cutoffDate.toISOString());

        if (deleteError) {
          throw deleteError;
        }

        return data.length;
      }

      return 0;
    } catch (error) {
      log.error('Data retention enforcement failed', error);
      throw error;
    }
  }

  static async enforceAccessControl(userId: string, requiredAction: string): Promise<boolean> {
    try {
      // Check user's current access level
      const { data: user } = await supabase
        .from('users_profiles')
        .select('role, permissions, last_access_review')
        .eq('user_id', userId)
        .single();

      if (!user) {
        return false;
      }

      // Implement role-based access control
      const allowedActions = {
        admin: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
        hr_manager: ['read', 'write', 'delete', 'manage_employees'],
        recruiter: ['read', 'write', 'manage_jobs', 'manage_applications'],
        employee: ['read', 'update_profile']
      };

      const userActions = allowedActions[user.role as keyof typeof allowedActions] || [];
      const hasPermission = userActions.includes(requiredAction);

      if (!hasPermission) {
        // Log access attempt
        await ComplianceAuditor.logAccessControl('unauthorized_access_attempt', 'system', false, 
          `User ${userId} attempted ${requiredAction} without permission`);
        
        return false;
      }

      return true;
    } catch (error) {
      log.error('Access control enforcement failed', error);
      return false;
    }
  }

  static async generateComplianceReport(): Promise<Blob> {
    try {
      const complianceData = await ComplianceMonitor.generateComplianceReport();
      
      // Generate PDF report
      const report = `
        NOVUMFLOW COMPLIANCE REPORT
        Generated: ${new Date().toISOString()}
        
        COMPLIANCE SCORE: ${complianceData.summary.complianceScore}
        
        TOTAL EVENTS: ${complianceData.summary.totalEvents}
        CRITICAL EVENTS: ${complianceData.summary.criticalEvents}
        HIGH EVENTS: ${complianceData.summary.highEvents}
        MEDIUM EVENTS: ${complianceData.summary.mediumEvents}
        LOW EVENTS: ${complianceData.summary.lowEvents}
        
        RECOMMENDATIONS:
        ${complianceData.recommendations.map(rec => `- ${rec.description}`).join('\n')}
      `;

      return new Blob([report], { type: 'text/plain' });
    } catch (error) {
      log.error('Failed to generate compliance report', error);
      return new Blob(['Report generation failed'], { type: 'text/plain' });
    }
  }
}

// React hooks for compliance
export const useComplianceMonitor = () => {
  const [complianceStatus, setComplianceStatus] = React.useState<'loading' | 'compliant' | 'non_compliant' | 'error'>('loading');
  const [complianceScore, setComplianceScore] = React.useState(0);
  const [lastCheck, setLastCheck] = React.useState<Date | null>(null);

  const runComplianceCheck = React.useCallback(async () => {
    setComplianceStatus('loading');
    
    try {
      const result = await ComplianceAuditor.runComplianceCheck();
      setComplianceStatus(result.overall);
      setComplianceScore(result.score);
      setLastCheck(new Date());
      
      if (result.overall !== 'compliant') {
        // Send notification to administrators
        log.warn('Compliance issues detected', {
          component: 'useComplianceMonitor',
          action: 'runComplianceCheck',
          metadata: result
        });
      }
    } catch (error) {
      setComplianceStatus('error');
      log.error('Compliance check failed', error);
    }
  }, []);

  // Auto-check compliance every 24 hours
  React.useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const hoursSinceLastCheck = lastCheck ? (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60) : 24;
      
      if (hoursSinceLastCheck >= 24) {
        runComplianceCheck();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(checkInterval);
  }, [lastCheck, runComplianceCheck]);

  const downloadComplianceReport = React.useCallback(async () => {
    try {
      const blob = await ComplianceEnforcement.generateComplianceReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      log.error('Failed to download compliance report', error);
    }
  }, []);

  return {
    complianceStatus,
    complianceScore,
    lastCheck,
    runComplianceCheck,
    downloadComplianceReport
  };
};