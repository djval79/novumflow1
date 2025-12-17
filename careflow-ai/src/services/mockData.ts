
import { StaffMember, Client, CareGoal, ProgressLog, Conversation, UserRole, LeaveRequest, PolicyDocument, PayrollRecord, Medication, MarRecord, FormTemplate, FormSubmission, TrainingModule, OnboardingTask, Incident, JobPosting, Candidate, Enquiry, TelehealthSession, StoredDocument, OfficeTask, Asset, ExpenseClaim, MarketShift, SocialEvent, SystemUser, SecurityLog, FeedbackRecord, AppNotification, MealPlan, HydrationLog, InventoryItem } from '../types';

export const MOCK_STAFF: StaffMember[] = [
  { 
    id: '1', name: "Sarah Jenkins", role: "Senior Carer", status: "Active", email: "sarah.j@careflow.com", phone: "07700 900123",
    availability: "Mon-Fri", joinedDate: "2021-03-15", avatar: "SJ", skills: ["Dementia L2", "Manual Handling", "Medication Admin", "Personal Care"],
    compliance: [
      { id: 'c1', name: 'DBS Check', expiryDate: '2024-12-01', status: 'Valid' },
      { id: 'c2', name: 'Safeguarding Adults', expiryDate: '2023-11-15', status: 'Due Soon' },
      { id: 'c3', name: 'First Aid', expiryDate: '2024-05-20', status: 'Valid' }
    ]
  },
  { 
    id: '2', name: "Mike Ross", role: "Care Assistant", status: "On Leave", email: "mike.r@careflow.com", phone: "07700 900456",
    availability: "Weekends", joinedDate: "2022-08-01", avatar: "MR", skills: ["Basic Care", "Driving", "Domestic", "Social"],
    compliance: [
      { id: 'c1', name: 'DBS Check', expiryDate: '2023-10-01', status: 'Expired' },
      { id: 'c2', name: 'Safeguarding Adults', expiryDate: '2024-08-01', status: 'Valid' }
    ]
  },
  { 
    id: '3', name: "Jessica Pearson", role: "Manager", status: "Active", email: "j.pearson@careflow.com", phone: "07700 900789",
    availability: "Mon-Fri", joinedDate: "2020-01-10", avatar: "JP", skills: ["Management", "CQC Compliance", "Nursing", "Medical"],
    compliance: [
      { id: 'c1', name: 'DBS Check', expiryDate: '2025-01-01', status: 'Valid' },
      { id: 'c2', name: 'NMC Pin', expiryDate: '2024-03-15', status: 'Valid' }
    ]
  },
  { 
    id: '4', name: "Donna Paulsen", role: "Care Coordinator", status: "Active", email: "donna.p@careflow.com", phone: "07700 900999",
    availability: "Mon-Fri", joinedDate: "2019-05-20", avatar: "DP", skills: ["Administration", "Scheduling", "Basic Care"],
    compliance: [
      { id: 'c1', name: 'DBS Check', expiryDate: '2024-06-01', status: 'Valid' }
    ]
  },
];

export const MOCK_CLIENTS: Client[] = [
  { 
    id: '1', name: "Edith Crawley", age: 84, address: "Highclere Castle, Downton", careLevel: "High", 
    coordinates: { x: 20, y: 30 },
    lastVisit: "Today 14:00",
    fundingDetails: { source: "Private", contractId: "PVT-001", budgetLimit: 2500 },
    emergencyContact: { name: "Lady Mary", relation: "Daughter", phone: "07700 123456" },
    dietaryRequirements: ['Diabetic', 'Low Salt'],
    allergies: ['Penicillin', 'Shellfish']
  },
  { 
    id: '2', name: "Robert Grantham", age: 78, address: "Highclere Village, Downton", careLevel: "Medium", 
    coordinates: { x: 60, y: 25 },
    lastVisit: "Tomorrow 09:00",
    fundingDetails: { source: "NHS", contractId: "NHS-CHC-992" },
    emergencyContact: { name: "Cora Grantham", relation: "Wife", phone: "07700 654321" },
    dietaryRequirements: ['Soft Diet', 'Thickened Fluids (Lvl 2)'],
    allergies: []
  },
  { 
    id: '3', name: "Violet Crawley", age: 92, address: "The Dower House, Downton", careLevel: "Low", 
    coordinates: { x: 75, y: 65 },
    lastVisit: "Today 10:00",
    fundingDetails: { source: "Private", contractId: "PVT-002" },
    emergencyContact: { name: "Isobel Crawley", relation: "Cousin", phone: "07700 987654" },
    dietaryRequirements: ['Vegetarian'],
    allergies: ['Nuts']
  },
  {
    id: '4', name: "Isobel Crawley", age: 80, address: "Crawley House, Village", careLevel: "Low",
    coordinates: { x: 40, y: 70 },
    lastVisit: "Yesterday",
    fundingDetails: { source: "Private", contractId: "PVT-003" },
    emergencyContact: { name: "Matthew", relation: "Son", phone: "07700 111222" },
    dietaryRequirements: ['None'],
    allergies: []
  }
];

export const MOCK_GOALS: CareGoal[] = [
  { id: 'g1', category: 'Mobility', description: 'Walk to the garden gate unassisted', targetDate: '2023-12-31', status: 'In Progress', progress: 65 },
  { id: 'g2', category: 'Nutrition', description: 'Maintain weight above 70kg', targetDate: '2024-01-15', status: 'In Progress', progress: 90 },
  { id: 'g3', category: 'Social', description: 'Attend day centre twice weekly', targetDate: '2023-11-30', status: 'Stalled', progress: 40 },
];

export const MOCK_PROGRESS_LOGS: ProgressLog[] = [
  { id: 'l1', date: '2023-10-20', category: 'Mobility', note: 'Managed to walk to the door but felt dizzy.', mood: 'Neutral', progressScore: 6 },
  { id: 'l2', date: '2023-10-21', category: 'Social', note: 'Refused to go to day centre today.', mood: 'Sad', progressScore: 3 },
  { id: 'l3', date: '2023-10-22', category: 'Mobility', note: 'Good energy today, walked further than usual.', mood: 'Happy', progressScore: 8 },
  { id: 'l4', date: '2023-10-23', category: 'Nutrition', note: 'Ate full meal and took supplements.', mood: 'Happy', progressScore: 9 },
  { id: 'l5', date: '2023-10-24', category: 'Mobility', note: 'Used walker confidently.', mood: 'Happy', progressScore: 8 },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participants: ['Dr. A. Admin', 'Lady Mary'],
    subject: 'Medication Change Query',
    category: 'Care Update',
    unreadCount: 1,
    lastMessageTime: '10:30 AM',
    lastMessage: 'Has the GP approved the new dosage?',
    relatedClientId: '1',
    messages: [
      { id: 'm1', senderId: '3', senderName: 'Lady Mary', role: UserRole.FAMILY, timestamp: '09:00 AM', content: 'Good morning, I noticed mum was a bit drowsy yesterday.', isRead: true },
      { id: 'm2', senderId: '1', senderName: 'Dr. A. Admin', role: UserRole.ADMIN, timestamp: '09:15 AM', content: 'Hello Lady Mary. I will check the logs. We are monitoring her new medication.', isRead: true },
      { id: 'm3', senderId: '3', senderName: 'Lady Mary', role: UserRole.FAMILY, timestamp: '10:30 AM', content: 'Has the GP approved the new dosage?', isRead: false },
    ]
  },
  {
    id: 'c2',
    participants: ['Sarah Jenkins', 'Dr. A. Admin'],
    subject: 'Shift Swap Request',
    category: 'Scheduling',
    unreadCount: 0,
    lastMessageTime: 'Yesterday',
    lastMessage: 'Approved. I updated the roster.',
    messages: [
      { id: 'm1', senderId: '2', senderName: 'Sarah Jenkins', role: UserRole.CARER, timestamp: 'Yesterday 14:00', content: 'Hi, can I swap my Friday shift? My car is in the garage.', isRead: true },
      { id: 'm2', senderId: '1', senderName: 'Dr. A. Admin', role: UserRole.ADMIN, timestamp: 'Yesterday 14:30', content: 'Approved. I updated the roster.', isRead: true },
    ]
  },
  {
    id: 'c3',
    participants: ['Dr. A. Admin', 'Cora Grantham'],
    subject: 'Upcoming Invoice',
    category: 'General',
    unreadCount: 0,
    lastMessageTime: 'Oct 24',
    lastMessage: 'Thank you, received.',
    relatedClientId: '2',
    messages: [
      { id: 'm1', senderId: '1', senderName: 'Dr. A. Admin', role: UserRole.ADMIN, timestamp: 'Oct 24 09:00', content: 'Please find attached the invoice for September care.', isRead: true },
      { id: 'm2', senderId: '3', senderName: 'Cora Grantham', role: UserRole.FAMILY, timestamp: 'Oct 24 10:00', content: 'Thank you, received.', isRead: true },
    ]
  }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'lr1', type: 'Holiday', startDate: '2023-11-20', endDate: '2023-11-25', status: 'Approved' },
  { id: 'lr2', type: 'Sick', startDate: '2023-09-10', endDate: '2023-09-12', status: 'Approved', reason: 'Flu' },
  { id: 'lr3', type: 'Holiday', startDate: '2023-12-24', endDate: '2023-12-26', status: 'Pending' },
];

export const MOCK_POLICIES: PolicyDocument[] = [
  { id: 'p1', title: 'Safeguarding Adults Policy', category: 'Compliance', lastUpdated: '2023-09-01', mustSign: true, isSigned: true, contentPreview: 'This policy outlines the procedures for identifying and reporting abuse...' },
  { id: 'p2', title: 'Lone Working Policy', category: 'Safety', lastUpdated: '2023-10-15', mustSign: true, isSigned: false, contentPreview: 'Procedures for staff working alone in the community...' },
  { id: 'p3', title: 'Uniform & Dress Code', category: 'HR', lastUpdated: '2023-01-10', mustSign: false, isSigned: false, contentPreview: 'All staff must wear the provided tunic and ID badge at all times...' },
];

export const MOCK_PAYROLL: PayrollRecord[] = [
  { id: 'P1', staffId: '1', staffName: 'Sarah Jenkins', role: 'Senior Carer', period: 'Oct 2023', totalHours: 160, hourlyRate: 15.50, bonuses: 50, deductions: 0, grossPay: 2530, netPay: 2024, status: 'Paid' },
  { id: 'P2', staffId: '2', staffName: 'Mike Ross', role: 'Care Assistant', period: 'Oct 2023', totalHours: 145, hourlyRate: 12.00, bonuses: 0, deductions: 0, grossPay: 1740, netPay: 1450, status: 'Approved' },
  { id: 'P3', staffId: '3', staffName: 'Jessica Pearson', role: 'Manager', period: 'Oct 2023', totalHours: 160, hourlyRate: 25.00, bonuses: 500, deductions: 100, grossPay: 4400, netPay: 3200, status: 'Draft' },
];

export const MOCK_MEDICATIONS: Medication[] = [
  { id: 'med1', name: 'Aspirin', dosage: '75mg', frequency: 'Morning', route: 'Oral', stockLevel: 24, totalStock: 56, startDate: '2023-01-15', instructions: 'Take with food. Do not chew.' },
  { id: 'med2', name: 'Metformin', dosage: '500mg', frequency: 'Morning, Evening', route: 'Oral', stockLevel: 12, totalStock: 100, startDate: '2023-03-10', instructions: 'Take with a meal to reduce stomach upset.' },
  { id: 'med3', name: 'Simvastatin', dosage: '40mg', frequency: 'Evening', route: 'Oral', stockLevel: 48, totalStock: 56, startDate: '2022-11-20', instructions: 'Take at night.' },
  { id: 'med4', name: 'Lactulose', dosage: '15ml', frequency: 'Morning', route: 'Oral', stockLevel: 150, totalStock: 500, startDate: '2023-09-01', instructions: 'Measure carefully using provided cup.' },
];

export const MOCK_MAR_RECORDS: MarRecord[] = [
  { id: 'mr1', medicationId: 'med1', date: 'Today', timeSlot: 'Morning', status: 'Taken', administeredBy: 'Sarah Jenkins' },
  { id: 'mr2', medicationId: 'med2', date: 'Today', timeSlot: 'Morning', status: 'Taken', administeredBy: 'Sarah Jenkins' },
  { id: 'mr3', medicationId: 'med4', date: 'Today', timeSlot: 'Morning', status: 'Refused', administeredBy: 'Sarah Jenkins', note: 'Client felt nauseous' },
  { id: 'mr4', medicationId: 'med2', date: 'Yesterday', timeSlot: 'Tea', status: 'Taken', administeredBy: 'Mike Ross' },
  { id: 'mr5', medicationId: 'med3', date: 'Yesterday', timeSlot: 'Tea', status: 'Taken', administeredBy: 'Mike Ross' },
];

export const MOCK_FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'ft1', title: 'Staff Spot Check', category: 'HR', createdBy: 'Dr. A. Admin', createdAt: '2023-09-10',
    questions: [
      { id: 'q1', text: 'Is the staff member wearing the correct uniform?', type: 'YesNo', required: true },
      { id: 'q2', text: 'Did they arrive on time?', type: 'YesNo', required: true },
      { id: 'q3', text: 'Staff knowledge rating (1-5)', type: 'Rating', required: true },
      { id: 'q4', text: 'Additional Comments', type: 'Text', required: false }
    ]
  },
  {
    id: 'ft2', title: 'Home Environment Risk Assessment', category: 'Safety', createdBy: 'Jessica Pearson', createdAt: '2023-08-15',
    questions: [
      { id: 'q1', text: 'Are there loose rugs or trip hazards?', type: 'YesNo', required: true },
      { id: 'q2', text: 'Is the smoke alarm functional?', type: 'YesNo', required: true },
      { id: 'q3', text: 'Date of assessment', type: 'Date', required: true },
    ]
  }
];

export const MOCK_FORM_SUBMISSIONS: FormSubmission[] = [
  {
    id: 'sub1', templateId: 'ft1', templateTitle: 'Staff Spot Check', submittedBy: 'Jessica Pearson', submittedAt: '2023-10-20', status: 'Submitted',
    answers: { 'q1': true, 'q2': true, 'q3': 5, 'q4': 'Excellent interaction with client.' }
  },
  {
    id: 'sub2', templateId: 'ft2', templateTitle: 'Home Environment Risk Assessment', submittedBy: 'Sarah Jenkins', submittedAt: '2023-10-18', status: 'Flagged',
    answers: { 'q1': true, 'q2': true, 'q3': '2023-10-18' } // q1 True means hazard present
  }
];

export const MOCK_TRAINING_MODULES: TrainingModule[] = [
  { id: 'tm1', title: 'Dementia Awareness', category: 'Clinical', duration: '45 mins', progress: 100, status: 'Completed', dueDate: '2023-10-01', thumbnailColor: 'bg-blue-500' },
  { id: 'tm2', title: 'Manual Handling (Practical)', category: 'Safety', duration: '60 mins', progress: 100, status: 'Completed', dueDate: '2023-09-15', thumbnailColor: 'bg-green-500' },
  { id: 'tm3', title: 'Information Governance', category: 'Compliance', duration: '30 mins', progress: 0, status: 'Not Started', dueDate: '2023-11-15', thumbnailColor: 'bg-purple-500' },
  { id: 'tm4', title: 'First Aid Basic Life Support', category: 'Safety', duration: '90 mins', progress: 30, status: 'In Progress', dueDate: '2023-12-01', thumbnailColor: 'bg-red-500' },
];

export const MOCK_ONBOARDING_TASKS: OnboardingTask[] = [
  { id: 'ot1', staffId: '2', staffName: 'Mike Ross', task: 'Upload ID Documents', completed: true, dueDate: '2023-08-01' },
  { id: 'ot2', staffId: '2', staffName: 'Mike Ross', task: 'Complete Shadow Shift', completed: true, dueDate: '2023-08-03' },
  { id: 'ot3', staffId: '2', staffName: 'Mike Ross', task: 'Sign Employment Contract', completed: false, dueDate: '2023-08-05' },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc1', date: '2023-10-24', clientName: 'Edith Crawley', staffName: 'Sarah Jenkins', 
    type: 'Fall', severity: 'Medium', status: 'Investigating',
    description: 'Client slipped in hallway. No visible injury but complained of wrist pain. Ambulance called as precaution.',
    investigationNotes: 'Witness statement collected. Floor was dry.',
  },
  {
    id: 'inc2', date: '2023-10-20', clientName: 'Robert Grantham', staffName: 'Mike Ross',
    type: 'Medication Error', severity: 'High', status: 'Resolved',
    description: 'Missed evening dose of Warfarin due to blister pack issue.',
    rootCause: 'Pharmacy dispensed incorrect pack size.',
    actionsTaken: 'GP contacted, dose administered later. Pharmacy complaint filed.',
    reportedToCQC: true
  },
  {
    id: 'inc3', date: '2023-10-15', clientName: 'Violet Crawley', staffName: 'Sarah Jenkins',
    type: 'Safeguarding', severity: 'Low', status: 'Closed',
    description: 'Unexplained bruise on left arm. Client states she bumped into door frame.',
    rootCause: 'Accidental injury consistent with explanation.',
    actionsTaken: 'Monitored for 48 hours, bruise faded.'
  }
];

export const MOCK_JOBS: JobPosting[] = [
  { id: 'j1', title: 'Senior Care Assistant', type: 'Full-Time', location: 'North District', postedDate: '2023-10-01', applicantsCount: 12, status: 'Active' },
  { id: 'j2', title: 'Weekend Support Worker', type: 'Part-Time', location: 'Village Area', postedDate: '2023-10-15', applicantsCount: 5, status: 'Active' },
];

export const MOCK_CANDIDATES: Candidate[] = [
  { 
    id: 'can1', name: 'Alice Walker', email: 'alice@email.com', appliedFor: 'Senior Care Assistant', appliedDate: '2023-10-05', stage: 'New', experienceYears: 5,
    bio: 'Experienced carer with 5 years in residential homes. NVQ Level 3 qualified. Passionate about dementia care.', skills: ['NVQ L3', 'Dementia', 'Team Leader']
  },
  {
    id: 'can2', name: 'Bob Builder', email: 'bob@email.com', appliedFor: 'Weekend Support Worker', appliedDate: '2023-10-18', stage: 'Screening', experienceYears: 1,
    bio: 'Looking to switch careers into care. Hardworking and reliable. Valid driving license.', skills: ['Driving', 'First Aid']
  },
  {
    id: 'can3', name: 'Clara Oswald', email: 'clara@email.com', appliedFor: 'Senior Care Assistant', appliedDate: '2023-10-02', stage: 'Interview', experienceYears: 8,
    bio: 'Registered Nurse looking for community role. Extensive medical experience.', skills: ['Nursing', 'Medication', 'Palliative']
  }
];

export const MOCK_ENQUIRIES: Enquiry[] = [
  { 
    id: 'enq1', prospectName: 'John Smith (Senior)', contactName: 'Jane Smith (Daughter)', contactPhone: '07800 111222', 
    receivedDate: '2023-10-25', status: 'New', 
    initialNotes: 'Father is 82, recently discharged from hospital after a hip replacement. Needs help getting up in morning and meals. Live in village area. Self-funding.' 
  },
  { 
    id: 'enq2', prospectName: 'Mary Berry', contactName: 'Self', contactPhone: '01234 567890', 
    receivedDate: '2023-10-24', status: 'Assessment', estimatedValue: 450,
    initialNotes: 'Looking for companionship and domestic help 2x a week. Very independent but lonely.' 
  },
  { 
    id: 'enq3', prospectName: 'Tom Jones', contactName: 'Social Services', contactPhone: '020 7000 0000', 
    receivedDate: '2023-10-22', status: 'Quote', estimatedValue: 1200,
    initialNotes: 'Referral from Council. High needs, 4x daily double up visits required. Hoist transfer.' 
  }
];

export const MOCK_SESSIONS: TelehealthSession[] = [
  { 
    id: 'ts1', hostName: 'Dr. A. Admin', clientName: 'Edith Crawley', 
    scheduledTime: 'Today 15:00', duration: '30 min', status: 'Upcoming', topic: 'Monthly Care Review'
  },
  { 
    id: 'ts2', hostName: 'Sarah Jenkins', clientName: 'Robert Grantham', 
    scheduledTime: 'Tomorrow 10:00', duration: '15 min', status: 'Upcoming', topic: 'Medication Check' 
  },
];

export const MOCK_DOCUMENTS: StoredDocument[] = [
  { 
    id: 'd1', name: 'Care Contract - Arthur Dent', type: 'PDF', category: 'Client Record', ownerName: 'Arthur Dent',
    uploadedDate: '2023-01-10', size: '2.4 MB', tags: ['Contract', 'Legal'], summary: 'Signed service agreement for personal care.'
  },
  { 
    id: 'd2', name: 'Public Liability Insurance 2024', type: 'PDF', category: 'Corporate', 
    uploadedDate: '2023-09-01', expiryDate: '2024-09-01', size: '1.1 MB', tags: ['Insurance', 'Finance'], summary: 'Policy document covering public and employer liability.'
  },
  { 
    id: 'd3', name: 'Sarah Jenkins - DBS Certificate', type: 'Image', category: 'Staff HR', ownerName: 'Sarah Jenkins',
    uploadedDate: '2023-05-12', expiryDate: '2024-05-12', size: '450 KB', tags: ['DBS', 'Compliance'], summary: 'Clear Enhanced DBS check.'
  },
];

export const MOCK_TASKS: OfficeTask[] = [
  { id: 't1', title: 'Call GP about Edith', description: 'Check if new prescription is ready.', priority: 'High', status: 'To Do', tags: ['Clinical'], dueDate: '2023-10-28' },
  { id: 't2', title: 'Order PPE Stock', description: 'Low on large gloves and aprons.', priority: 'Medium', status: 'In Progress', tags: ['Supplies'] },
  { id: 't3', title: 'Update Policy', description: 'Review lone worker policy updates.', priority: 'Low', status: 'Done', tags: ['Compliance'] },
];

export const MOCK_ASSETS: Asset[] = [
  { 
    id: 'a1', name: 'Oxford Midi Hoist', type: 'Mobility', serialNumber: 'OX-992-11', 
    assignedTo: 'Edith Crawley', assignedType: 'Client', purchaseDate: '2022-01-10', 
    nextInspectionDate: '2023-11-15', status: 'Active', value: 1200 
  },
  { 
    id: 'a2', name: 'Samsung Tab A8', type: 'IT', serialNumber: 'SN-2210-99', 
    assignedTo: 'Sarah Jenkins', assignedType: 'Staff', purchaseDate: '2023-05-01', 
    status: 'Active', value: 180 
  },
  { 
    id: 'a3', name: 'Key Safe (Supra C500)', type: 'Safety', serialNumber: 'KS-882', 
    assignedTo: 'Robert Grantham', assignedType: 'Client', purchaseDate: '2021-08-15', 
    status: 'Active', value: 65 
  },
  { 
    id: 'a4', name: 'Wheelchair (Transit)', type: 'Mobility', serialNumber: 'WC-101', 
    assignedTo: 'Office', assignedType: 'Office', purchaseDate: '2020-03-20', 
    nextInspectionDate: '2023-10-01', status: 'Repair', value: 350 
  }
];

export const MOCK_EXPENSES: ExpenseClaim[] = [
  { id: 'ex1', staffId: '1', staffName: 'Sarah Jenkins', date: '2023-10-25', type: 'Mileage', amount: 12.60, description: 'Travel to Client A and B (28 miles)', status: 'Pending' },
  { id: 'ex2', staffId: '1', staffName: 'Sarah Jenkins', date: '2023-10-20', type: 'Purchase', amount: 8.50, description: 'Bread and Milk for Edith', status: 'Approved', merchantName: 'Tesco' },
  { id: 'ex3', staffId: '2', staffName: 'Mike Ross', date: '2023-10-22', type: 'Training', amount: 45.00, description: 'First Aid Refresher Course', status: 'Pending', merchantName: 'Red Cross' },
];

export const MOCK_MARKET_SHIFTS: MarketShift[] = [
  { id: 'ms1', date: 'Today', time: '18:00 - 22:00', clientName: 'Edith Crawley', location: 'Downton', role: 'Carer', baseRate: 12.50, surgeBonus: 2.00, status: 'Open', applicants: 0 },
  { id: 'ms2', date: 'Tomorrow', time: '07:00 - 14:00', clientName: 'Robert Grantham', location: 'Village', role: 'Senior', baseRate: 14.50, surgeBonus: 0, status: 'Open', applicants: 1 },
  { id: 'ms3', date: 'Sat 28 Oct', time: '20:00 - 08:00', clientName: 'Violet Crawley', location: 'Dower House', role: 'Nurse', baseRate: 25.00, surgeBonus: 5.00, status: 'Pending', applicants: 3 },
];

export const MOCK_EVENTS: SocialEvent[] = [
  { id: 'e1', title: 'Afternoon Tea & Quiz', type: 'Social', date: '2023-10-28', time: '14:00', location: 'Communal Lounge', attendeesCount: 12, status: 'Upcoming', description: 'Traditional afternoon tea with a history quiz.' },
  { id: 'e2', title: 'Seated Yoga', type: 'Exercise', date: '2023-10-29', time: '10:30', location: 'Garden Room', attendeesCount: 8, status: 'Upcoming', description: 'Gentle mobility exercises for all abilities.' },
  { id: 'e3', title: 'Movie Night: Grease', type: 'Social', date: '2023-10-27', time: '18:00', location: 'Cinema Room', attendeesCount: 15, status: 'Completed', description: 'Classic movie screening with popcorn.' },
];

export const MOCK_SYSTEM_USERS: SystemUser[] = [
  { id: '1', name: 'Dr. A. Admin', email: 'admin@careflow.com', role: UserRole.ADMIN, lastLogin: 'Just now', status: 'Active' },
  { id: '2', name: 'Sarah Jenkins', email: 'sarah.j@careflow.com', role: UserRole.CARER, lastLogin: '20 mins ago', status: 'Active', relatedEntityId: '1' },
  { id: '3', name: 'Mike Ross', email: 'mike.r@careflow.com', role: UserRole.CARER, lastLogin: '3 days ago', status: 'Suspended', relatedEntityId: '2' },
  { id: '4', name: 'Lady Mary', email: 'mary@downton.com', role: UserRole.FAMILY, lastLogin: 'Yesterday', status: 'Active' },
];

export const MOCK_SECURITY_LOGS: SecurityLog[] = [
  { id: 'sl1', timestamp: '2023-10-27 08:05:22', user: 'Dr. A. Admin', action: 'Login Success', details: 'Standard login via web.', ipAddress: '192.168.1.10', severity: 'Info' },
  { id: 'sl2', timestamp: '2023-10-27 03:15:00', user: 'Mike Ross', action: 'Bulk Export', details: 'Exported 50 client records.', ipAddress: '84.12.99.1', severity: 'Critical' },
  { id: 'sl3', timestamp: '2023-10-26 14:20:11', user: 'Sarah Jenkins', action: 'View Record', details: 'Accessed profile: Edith Crawley', ipAddress: '192.168.1.12', severity: 'Info' },
  { id: 'sl4', timestamp: '2023-10-26 09:00:05', user: 'Unknown', action: 'Login Failed', details: 'Invalid password attempts (3).', ipAddress: '104.22.11.5', severity: 'Warning' },
];

export const MOCK_FEEDBACK: FeedbackRecord[] = [
  { id: 'fb1', date: '2023-10-26', source: 'Lady Mary', category: 'Praise', rating: 5, comment: 'Sarah was wonderful with mum today. Really patient and kind.', status: 'New' },
  { id: 'fb2', date: '2023-10-25', source: 'Anonymous Family', category: 'Complaint', rating: 2, comment: 'The carer was 20 minutes late and didnt call. This is the second time.', status: 'New' },
  { id: 'fb3', date: '2023-10-24', source: 'Robert Grantham', category: 'Suggestion', rating: 4, comment: 'Would prefer if the evening visit was slightly later, maybe 8pm.', status: 'Reviewed', response: 'Noted, we will adjust the schedule from next week.' },
  { id: 'fb4', date: '2023-10-23', source: 'Violet Crawley', category: 'Praise', rating: 5, comment: 'Excellent service as always. Very professional.', status: 'Actioned' },
  { id: 'fb5', date: '2023-10-22', source: 'Tom Branson', category: 'Complaint', rating: 1, comment: 'Medication was missed on Saturday morning. Very concerned.', status: 'New' },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Late Visit Alert', message: 'Sarah Jenkins is 15m late for visit with Robert Grantham', type: 'Critical', time: '10 mins ago', isRead: false, link: '/rostering' },
  { id: 'n2', title: 'New Incident Reported', message: 'Medication Error reported by Mike Ross', type: 'Warning', time: '45 mins ago', isRead: false, link: '/incidents' },
  { id: 'n3', title: 'New Message', message: 'Lady Mary sent a message regarding medication', type: 'Info', time: '1 hour ago', isRead: false, link: '/messages' },
  { id: 'n4', title: 'DBS Expiring', message: 'Mike Ross DBS expires in 30 days', type: 'Warning', time: '3 hours ago', isRead: true, link: '/people' },
  { id: 'n5', title: 'Payroll Generated', message: 'October payroll draft is ready for approval', type: 'Success', time: '5 hours ago', isRead: true, link: '/finance' },
];

export const MOCK_MEALS: MealPlan[] = [
  { id: 'm1', day: 'Monday', breakfast: 'Porridge with Honey', lunch: 'Shepherds Pie', dinner: 'Vegetable Soup', snacks: 'Biscuits, Fruit', calories: 1800 },
  { id: 'm2', day: 'Tuesday', breakfast: 'Scrambled Eggs on Toast', lunch: 'Fish & Chips', dinner: 'Sandwiches', snacks: 'Cake, Yoghurt', calories: 2000 },
  { id: 'm3', day: 'Wednesday', breakfast: 'Cereal & Toast', lunch: 'Roast Chicken', dinner: 'Jacket Potato', snacks: 'Fruit, Toast', calories: 1900 },
];

export const MOCK_HYDRATION: HydrationLog[] = [
  { id: 'h1', clientId: '1', clientName: 'Edith Crawley', date: '2023-10-27', amountMl: 1200, targetMl: 1500, status: 'Warning' },
  { id: 'h2', clientId: '2', clientName: 'Robert Grantham', date: '2023-10-27', amountMl: 1800, targetMl: 1500, status: 'Good' },
  { id: 'h3', clientId: '3', clientName: 'Violet Crawley', date: '2023-10-27', amountMl: 800, targetMl: 1500, status: 'Critical' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Vinyl Gloves (Medium)', category: 'PPE', quantity: 45, unit: 'Boxes (100)', minLevel: 20, location: 'Store A', lastRestocked: '2023-10-01' },
  { id: 'i2', name: 'Disposable Aprons (Roll)', category: 'PPE', quantity: 120, unit: 'Rolls', minLevel: 50, location: 'Store B', lastRestocked: '2023-09-20' },
  { id: 'i3', name: 'Hand Sanitizer (500ml)', category: 'Cleaning', quantity: 8, unit: 'Bottles', minLevel: 10, location: 'Office', lastRestocked: '2023-08-15' },
  { id: 'i4', name: 'Agency Tunic (L)', category: 'Uniform', quantity: 5, unit: 'Unit', minLevel: 2, location: 'Office', lastRestocked: '2023-01-10' },
];
