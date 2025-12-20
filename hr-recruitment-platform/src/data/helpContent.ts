
export interface HelpTopic {
    id: string;
    title: string;
    category: string;
    content: string;
    keywords: string[];
}

export const helpTopics: HelpTopic[] = [
    {
        id: 'create-job',
        title: 'How to create a new job posting',
        category: 'Recruitment',
        content: 'To create a new job posting, navigate to the **Recruitment** page and click the "**+ New Job**" button. Fill in the job details, including title, description, and requirements, then click "Publish" to make it live.',
        keywords: ['job', 'posting', 'recruitment', 'hire', 'vacancy']
    },
    {
        id: 'schedule-interview',
        title: 'Scheduling an interview',
        category: 'Recruitment',
        content: 'Go to the **Recruitment** section > **Interviews**. Click "**Schedule Interview**". Select the candidate, the interviewer(s), and the date/time. An email invitation will be automatically sent to the candidate.',
        keywords: ['interview', 'schedule', 'calendar', 'meeting']
    },
    {
        id: 'add-employee',
        title: 'Adding a new employee',
        category: 'Onboarding',
        content: 'Navigate to **Team** > "**Add Employee**". Enter the employee\'s personal details, role, and department. Once created, you can assign onboarding checklists and compliance documents.',
        keywords: ['employee', 'staff', 'add', 'team', 'member']
    },
    {
        id: 'update-compliance',
        title: 'Updating compliance documents',
        category: 'Compliance',
        content: 'Go to the **Compliance** module or an employee\'s profile. Locate the document (e.g., DBS, Right to Work) and click "**Update**" or "**Upload**". Enter the new expiry date and upload the file.',
        keywords: ['compliance', 'document', 'dbs', 'upload', 'expiry']
    },
    {
        id: 'approve-leave',
        title: 'Approving leave requests',
        category: 'HR',
        content: 'When an employee requests leave, you will receive a notification. Go to **Dashboard** or **HR Module** > **Leave Requests**. Click "Approve" or "Reject" on the pending request.',
        keywords: ['leave', 'holiday', 'time off', 'approve', 'request']
    },
    {
        id: 'run-payroll',
        title: 'Exporting payroll data',
        category: 'HR',
        content: 'Navigate to **Reports**. Select "**Payroll Report**". Choose the date range and click "**Export CSV**" to download the data for your payroll software.',
        keywords: ['payroll', 'report', 'export', 'finance', 'salary']
    },
    {
        id: 'automation-workflow',
        title: 'Creating an automation workflow',
        category: 'Automation',
        content: 'Go to **Automation**. Click "**+ New Workflow**". Select a trigger (e.g., "Candidate Applied") and an action (e.g., "Send Email"). tailored to your process.',
        keywords: ['automation', 'workflow', 'email', 'trigger']
    }
];
