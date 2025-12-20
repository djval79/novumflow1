
export interface HelpTopic {
    id: string;
    title: string;
    category: string;
    content: string;
    keywords: string[];
}

export const helpTopics: HelpTopic[] = [
    {
        id: 'create-shift',
        title: 'How to create a new shift',
        category: 'Rostering',
        content: 'Navigate to the **Live Roster** page. Click on a time slot or the "**+ Add Shift**" button. Select the client, the staff member, and the time. You can also drag and drop shifts to reschedule.',
        keywords: ['shift', 'roster', 'schedule', 'create', 'add']
    },
    {
        id: 'approve-timesheet',
        title: 'Approving timesheets',
        category: 'Finance',
        content: 'Go to **Finance** > **Timesheets**. Review the submitted hours against the scheduled visits. Click "**Approve**" to process them for payroll or "**Reject**" to request corrections.',
        keywords: ['timesheet', 'approve', 'finance', 'payroll', 'hours']
    },
    {
        id: 'add-client',
        title: 'Adding a new client',
        category: 'Clients',
        content: 'Go to **Clients** > "**New Client**". Enter the client\'s personal details, care needs, and address. Once created, you can create a Care Plan and assign medication schedules.',
        keywords: ['client', 'patient', 'add', 'new', 'profile']
    },
    {
        id: 'manage-medication',
        title: 'Managing client medication (eMAR)',
        category: 'Care',
        content: 'Open a client\'s profile and go to the **Medication** tab. Click "**Add Medication**" to schedule a new dosage. Care workers will see this in their daily run list.',
        keywords: ['medication', 'emar', 'drug', 'dosage', 'client']
    },
    {
        id: 'staff-compliance',
        title: 'Checking staff compliance status',
        category: 'Staff',
        content: 'Go to the **Staff** section. A traffic light system (Red/Amber/Green) indicates compliance status. Click on a staff member to view expiring documents like DBS or training certificates.',
        keywords: ['compliance', 'staff', 'dbs', 'training', 'status']
    },
    {
        id: 'mobile-checkin',
        title: 'Using mobile check-in/out',
        category: 'Mobile App',
        content: 'The mobile app (PWA) allows staff to view their schedule. Tap on a visit and swipe "**Check In**". When finished, ensure all tasks are ticked and swipe "**Check Out**".',
        keywords: ['mobile', 'app', 'check in', 'visit', 'pwa']
    },
    {
        id: 'incident-reporting',
        title: 'Reporting an incident',
        category: 'Care',
        content: 'If an incident occurs, use the **Incident Log** from the dashboard or client profile. Fill in the description, severity, and immediate actions taken. This alerts the management team immediately.',
        keywords: ['incident', 'report', 'accident', 'log', 'safety']
    }
];
