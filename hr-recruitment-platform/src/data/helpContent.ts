
export interface HelpTopic {
    id: string;
    title: string;
    category: string;
    content: string;
    keywords: string[];
}

export const helpTopics: HelpTopic[] = [
    // RECRUITMENT - JOBS
    {
        id: 'recruit-create-job',
        title: 'Creating and Publishing a Job',
        category: 'Recruitment',
        content: `**Step 1: Navigate to Recruitment**
Click on **Recruitment** in the main sidebar to access the recruitment dashboard.

**Step 2: Create New Job**
Click the **+ New Job** button in the top right corner.

**Step 3: Fill in Job Details**
- **Job Title**: The public-facing title of the role.
- **Department**: Clinical, Admin, Housekeeping, etc.
- **Location**: Which care home/site this role is for.
- **Type**: Full-time, Part-time, Bank, etc.
- **Description**: Detailed requirements and responsibilities.

**Step 4: AI Screening Configuration (Optional)**
You can set up AI screening questions to automatically score candidates based on their experience and qualifications.

**Step 5: Publish**
Click **Create Job**. The job is now live and can be shared via the provided link or posted to job boards.`,
        keywords: ['job', 'posting', 'create', 'publish', 'vacancy', 'advert']
    },
    {
        id: 'recruit-edit-close-job',
        title: 'Editing or Closing a Job',
        category: 'Recruitment',
        content: `**Editing a Job**
1. In the **Recruitment** dashboard, find the job card.
2. Click the **Edit** (pencil) icon.
3. Update details as needed and click **Save**.

**Closing a Job**
1. Open the job details.
2. Change the status from **Active** to **Closed**.
3. This prevents new applications but keeps existing ones for your records.`,
        keywords: ['edit', 'close', 'job', 'status', 'remove']
    },

    // RECRUITMENT - CANDIDATES
    {
        id: 'recruit-kanban',
        title: 'Managing Candidates (Kanban Board)',
        category: 'Recruitment',
        content: `The Kanban board visualizes your hiring pipeline.

**Moving Candidates**
Simply **drag and drop** a candidate card from one column to another (e.g., from "Applied" to "Interview").

**Stages:**
- **Applied**: New applications.
- **Screening**: AI or manual review in progress.
- **Interview**: Scheduling or interview scheduled.
- **Offer**: Offer letter sent.
- **Hired**: Offer accepted.
- **Rejected**: Candidate unavailable or unsuitable.

**Tip:** Moving a candidate to "Hired" can trigger the automated onboarding workflow if configured.`,
        keywords: ['kanban', 'pipeline', 'stages', 'drag', 'drop', 'move', 'candidate']
    },
    {
        id: 'recruit-ai-screening',
        title: 'Understanding AI Screening Scores',
        category: 'Recruitment',
        content: `NovumFlow uses AI to analyze CVs against your job description.

**The Score (0-100)**
- **90+ (High Match)**: Strong candidate, likely meets all criteria.
- **70-89 (Good Match)**: Potential candidate, meets most criteria.
- **< 70 (Low Match)**: May lack key experience or qualifications.

**Auto-Automation**
You can configure rules (in **Recruit Settings**) to:
- Automatically **Shortlist** candidates scoring > 85.
- Automatically **Reject** candidates scoring < 40.

**Note:** The AI is a tool to assist, not replace, human judgment. Always review profiles before making final decisions.`,
        keywords: ['ai', 'score', 'ranking', 'match', 'automation', 'shortlist', 'reject']
    },

    // RECRUITMENT - INTERVIEWS
    {
        id: 'recruit-schedule-interview',
        title: 'Scheduling Interviews',
        category: 'Recruitment',
        content: `**Step 1: Open Candidate Profile**
Click on a candidate's name to view their full profile.

**Step 2: Schedule Interview**
Click the **Schedule Interview** button.

**Step 3: Details**
- **Date & Time**: Select the slot.
- **Interviewers**: Add team members who should attend.
- **Type**: In-person, Video Call, or Phone.

**Step 4: Send Invite**
Click **Confirm**. The candidate receives an email invitation with the details. The interview will also appear on your Dashboard calendar.`,
        keywords: ['interview', 'schedule', 'calendar', 'invite', 'meeting']
    },

    // COMPLIANCE - DBS & RTW
    {
        id: 'compliance-dbs',
        title: 'Managing DBS Checks',
        category: 'Compliance',
        content: `**Adding a New DBS Check**
1. Navigate to **Compliance Hub** > **DBS Register**.
2. Click **+ Record DBS Check**.
3. Select the employee and enter the Certificate Number.
4. Set the **Issue Date** (the system auto-calculates the next due date based on the 3-year standard).
5. Upload a scanned copy if available.

**Tracking Expiries**
The system automatically tracks expiring DBS checks. 
- **Amber Warning**: 3 months before expiry.
- **Red Alert**: 1 month before expiry or overdue.
You will receive notifications on the Dashboard and via email.`,
        keywords: ['dbs', 'criminal record', 'background', 'check', 'expiry', 'compliance']
    },
    {
        id: 'compliance-rtw',
        title: 'Right to Work (RTW) Verification',
        category: 'Compliance',
        content: `**Conducting a Check**
1. Go to **Compliance Hub** > **Sponsor Guardian** (or Right to Work tab).
2. Click **+ New RTW Check**.
3. **Visa Holders**: Enter the Share Code and Date of Birth. The system initiates a real-time Home Office check.
4. **UK/Irish Nationals**: Upload a copy of their passport.

**Visa Expiry Tracking**
NovumFlow automatically tracks visa end dates.
- For **Student Visas**, it also tracks term times (20h work limit).
- You will be notified 3 months, 1 month, and 1 week before a visa expires.`,
        keywords: ['rtw', 'right to work', 'visa', 'immigration', 'share code', 'home office']
    },

    // COMPLIANCE - TRAINING
    {
        id: 'compliance-training',
        title: 'Training Matrix & Mandatory Training',
        category: 'Compliance',
        content: `**The Training Matrix**
Access the matrix via **Training** > **Matrix View**. This gives a bird's-eye view of all staff compliance.
- **Green**: Valid
- **Amber**: Expiring soon
- **Red**: Expired or Missing

**Assigning Mandatory Training**
1. Go to **Training settings**.
2. Select a role (e.g., "Carer").
3. Choose modules (e.g., Manual Handling, Fire Safety) as "Mandatory".
4. These will now appear as "Required" on all Carer profiles.`,
        keywords: ['training', 'matrix', 'mandatory', 'learning', 'certificate', 'course']
    },
    {
        id: 'compliance-dashboard',
        title: 'Understanding Key Compliance Metrics',
        category: 'Compliance',
        content: `**Safe Recruit %**
The percentage of staff with ALL initial recruitment checks complete (DBS, References, RTW).

**Training Compliance %**
The percentage of mandatory training modules completed across the organization.

**Safety Score**
A composite score (0-100) indicating overall risk.
- **< 80**: High Risk (Action required immediately)
- **80-95**: Good (Minor gaps)
- **95+**: Excellent

**Action Needed**
The "Action Needed" widget on your dashboard prioritizes the most urgent tasks (e.g., expired visas, missing references) so you know exactly what to fix first.`,
        keywords: ['dashboard', 'metrics', 'safe recruit', 'score', 'risk', 'compliance']
    },

    // ONBOARDING
    // ONBOARDING & HR
    {
        id: 'hr-add-employee',
        title: 'Adding & Onboarding New Staff',
        category: 'HR',
        content: `**Step 1: Add Employee**
Navigate to **HR Module** (or Team) and click **+ Add Employee**.
- Enter personal details, contact info, and role.
- **Tip**: Ensure the email is correct so they can receive their invite.

**Step 2: Assign Access**
- **Role**: Determines permissions (e.g., Admin, Manager, Staff).
- **Department**: affects reporting lines.

**Step 3: Onboarding Checklist**
Once added, the system automatically assigns the default onboarding checklist (if configured). Monitor progress in the **Onboarding** tab of their profile.`,
        keywords: ['employee', 'staff', 'add', 'onboarding', 'new starter', 'profile']
    },
    {
        id: 'hr-employee-profile',
        title: 'Managing Employee Profiles',
        category: 'HR',
        content: `**The Employee Profile**
Clicking an employee's name opens their digital personnel file.
- **Overview**: Key stats and recent activity.
- **Documents**: Contracts, ID, Certifications.
- **Leave**: Holiday calendar and history.
- **Training**: Training matrix specific to this person.
- **Performance**: Appraisal history and notes.

**Updating Details**
Click the **Edit** button on any section to update information (e.g., change of address, new bank details).`,
        keywords: ['profile', 'details', 'address', 'bank', 'personnel file']
    },
    {
        id: 'hr-leave-management',
        title: 'Managing Leave & Absence',
        category: 'HR',
        content: `**Approving Requests**
1. When staff request leave, you receive a notification.
2. Go to **HR Module** > **Leave Requests**.
3. Review the dates and type (Holiday, Sickness, Compassionate).
4. Click **Approve** or **Reject**.

**Booking on Behalf of Staff**
You can manually record absence (e.g., sickness call) by clicking **+ Record Absence** on the employee's profile or the Leave calendar.`,
        keywords: ['leave', 'holiday', 'sickness', 'absence', 'time off', 'approve']
    },
    {
        id: 'hr-documents',
        title: 'Document Management',
        category: 'HR',
        content: `**Employee Documents**
Store contracts, disciplinary notes, and medical records securely.
1. Go to **Employee Profile** > **Documents**.
2. Click **Upload**.
3. Select category (e.g., "Contract").
4. **Visibility**: Choose who can see this (e.g., "Admin Only" or "Employee & Admin").

**Global Documents**
Use the main **Documents** module for company-wide policies (e.g., Staff Handbook) accessible to everyone.`,
        keywords: ['document', 'file', 'upload', 'contract', 'handbook', 'policy']
    },
    {
        id: 'hr-shifts',
        title: 'Shift Rota Overview',
        category: 'HR',
        content: `**Viewing the Rota**
Go to **Shift Rota**. You can view by Day, Week, or Month.
- **Blue**: Scheduled Shift
- **Green**: Completed
- **Red**: Unfilled/Open

**Creating Shifts**
Click **+ Add Shift** or drag on the calendar. Assign a specific staff member or leave as "Open" for staff to claim (if allowed).`,
        keywords: ['shift', 'rota', 'schedule', 'calendar', 'work']
    },

    // AUTOMATION
    {
        id: 'automation-workflow',
        title: 'Creating an automation workflow',
        category: 'Automation',
        content: 'Go to **Automation**. Click "**+ New Workflow**". Select a trigger (e.g., "Candidate Applied") and an action (e.g., "Send Email"). tailored to your process.',
        keywords: ['automation', 'workflow', 'email', 'trigger']
    },

    // ADMIN & SETTINGS
    {
        id: 'admin-settings',
        title: 'Company Settings',
        category: 'Admin',
        content: `**Organization Profile**
Go to **Settings** > **Company Details**.
- **Logo**: Update your company branding (appears on emails and valid letters).
- **Address**: Used for official documentation.
- **Support Contact**: Where automated system emails appear to come from.

**Feature Configuration**
Customize your experience by enabling/disabling modules (e.g., if you don't need 'Sponsor Guardian', filter it out here).`,
        keywords: ['settings', 'logo', 'branding', 'company', 'address', 'admin']
    },
    {
        id: 'admin-users',
        title: 'Managing System Users',
        category: 'Admin',
        content: `**Inviting Admins & Managers**
1. Go to **Settings** > **Team Members**.
2. Click **+ Invite User**.
3. Enter email and select Role:
   - **Super Admin**: Full access to everything.
   - **HR Manager**: Access to staff and recruitment, but not billing.
   - **Recruiter**: Access to recruitment only.
   
**Revoking Access**
To remove a user, find them in the list and click **Remove**. They will immediately lose login access.`,
        keywords: ['user', 'admin', 'manager', 'invite', 'access', 'role']
    },
    {
        id: 'admin-billing',
        title: 'Billing & Subscriptions',
        category: 'Admin',
        content: `**Managing Your Plan**
Navigate to **Billing** (or Settings > Billing).
- **Current Plan**: See your usage (User count, Storage).
- **Upgrade**: Move to a higher tier for more features (e.g., AI Screening unlimited).
- **Invoices**: Download past invoices for your accounts.

**Payment Methods**
Update your credit card details securely via the Stripe portal linked here.`,
        keywords: ['billing', 'payment', 'invoice', 'plan', 'subscription', 'upgrade']
    },
    {
        id: 'admin-audit',
        title: 'Audit Logs & Security',
        category: 'Admin',
        content: `**System Audit Trail**
For compliance and security, NovumFlow logs key actions.
Go to **Audit Logs** (Super Admin only).
- **Filter**: Search by User, Action (e.g., "Deleted Document"), or Date.
- **Export**: Download logs for external audits or inspections.`,
        keywords: ['audit', 'log', 'security', 'track', 'history', 'compliance']
    }
];
