
export enum UserRole {
  ADMIN = 'Admin',
  CARER = 'Carer',
  FAMILY = 'Family',
  CLIENT = 'Client'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ComplianceRecord {
  id: string;
  name: string; // e.g. "DBS Check", "Safeguarding L2"
  expiryDate: string;
  status: 'Valid' | 'Due Soon' | 'Expired';
  docUrl?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  compliance: ComplianceRecord[];
  skills: string[];
  availability: string; // e.g., "Mon-Fri"
  avatar?: string;
  joinedDate: string;
}

export interface Client {
  id: string;
  name: string;
  age: number;
  address: string;
  coordinates?: { x: number; y: number }; // 0-100 grid for demo map
  careLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  fundingDetails: {
    source: 'Private' | 'Council' | 'NHS';
    budgetLimit?: number;
    contractId: string;
  };
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  lastVisit: string;
  dietaryRequirements?: string[];
  allergies?: string[];
}

export interface Visit {
  id: string;
  clientId: string;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
  visitType: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled';
  clientName?: string;
  staffName?: string;
}

export interface CarePlan {
  id: string;
  clientId: string;
  title: string;
  summary: string;
  startDate: string;
  reviewDate?: string;
  status: 'Active' | 'Draft' | 'Archived';
  needs: any[];
  risks: any[];
  goals: any[];
}

export interface Shift {
  id: string;
  clientName: string;
  staffName?: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'Missed' | 'Unassigned';
  type: 'Personal Care' | 'Domestic' | 'Social' | 'Medical';
}

export interface GeneratedCarePlan {
  summary: string;
  needs: {
    category: string;
    description: string;
    frequency: string;
  }[];
  risks: {
    risk: string;
    mitigation: string;
    score: number; // 1-5
  }[];
  goals: string[];
}

export interface CareGoal {
  id: string;
  category: string;
  description: string;
  targetDate: string;
  status: 'In Progress' | 'Achieved' | 'Stalled';
  progress: number; // 0-100
}

export interface ProgressLog {
  id: string;
  date: string;
  category: string;
  note: string;
  mood: 'Happy' | 'Neutral' | 'Sad' | 'Agitated';
  progressScore: number; // 1-10 daily score
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  period: string;
  totalHours: number;
  hourlyRate: number;
  bonuses: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  status: 'Draft' | 'Approved' | 'Paid';
}

export interface InvoiceItem {
  description: string;
  quantity: number; // hours or visits
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
}

// Messaging Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  role: UserRole;
  timestamp: string;
  content: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // Participant Names
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  category: 'General' | 'Urgent' | 'Care Update' | 'Scheduling';
  relatedClientId?: string;
}

// HR & Staff Portal Types
export interface LeaveRequest {
  id: string;
  type: 'Holiday' | 'Sick' | 'Compassionate';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  mustSign: boolean;
  isSigned: boolean;
  contentPreview: string;
}

// Medication & eMAR Types
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "Morning, Evening" or "OD"
  route: 'Oral' | 'Topical' | 'Injection' | 'Inhaler';
  stockLevel: number;
  totalStock: number;
  startDate: string;
  instructions: string;
}

export interface MarRecord {
  id: string;
  medicationId: string;
  date: string;
  timeSlot: 'Morning' | 'Lunch' | 'Tea' | 'Bed';
  status: 'Taken' | 'Missed' | 'Refused' | 'N/A';
  administeredBy?: string;
  note?: string;
}

// Forms & Audits
export interface FormQuestion {
  id: string;
  text: string;
  type: 'Text' | 'YesNo' | 'Rating' | 'Date';
  required: boolean;
}

export interface FormTemplate {
  id: string;
  title: string;
  category: string;
  questions: FormQuestion[];
  createdBy: string;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  templateId: string;
  templateTitle: string;
  submittedBy: string;
  submittedAt: string;
  answers: Record<string, string | number | boolean>; // key is questionId
  status: 'Submitted' | 'Flagged';
}

// Training & Onboarding
export interface TrainingModule {
  id: string;
  title: string;
  category: string; // e.g. Clinical, Safety, Soft Skills
  duration: string; // e.g. "30 mins"
  progress: number; // 0-100
  status: 'Not Started' | 'In Progress' | 'Completed';
  dueDate: string;
  thumbnailColor: string;
}

export interface OnboardingTask {
  id: string;
  staffId: string;
  staffName: string;
  task: string;
  completed: boolean;
  dueDate: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

// Incidents & Risk Management
export interface Incident {
  id: string;
  date: string;
  clientName: string;
  staffName: string;
  type: 'Fall' | 'Medication Error' | 'Safeguarding' | 'Injury' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  status: 'Reported' | 'Investigating' | 'Resolved' | 'Closed';
  investigationNotes?: string;
  rootCause?: string;
  actionsTaken?: string;
  reportedToCQC?: boolean;
}

export interface IncidentAnalysis {
  rootCause: string;
  recommendedActions: string[];
  riskScore: number; // 1-10
  preventionStrategy: string;
}

// Recruitment & ATS
export type ApplicationStage = 'New' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface JobPosting {
  id: string;
  title: string;
  type: 'Full-Time' | 'Part-Time' | 'Bank';
  location: string;
  postedDate: string;
  applicantsCount: number;
  status: 'Active' | 'Closed';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  appliedFor: string; // Job ID or Title
  appliedDate: string;
  stage: ApplicationStage;
  experienceYears: number;
  bio: string; // Summary or CV text
  skills: string[];
}

export interface CandidateAnalysis {
  matchScore: number; // 0-100
  strengths: string[];
  concerns: string[];
  interviewQuestions: string[];
}

// Client Intake & CRM
export type EnquiryStatus = 'New' | 'Contacted' | 'Assessment' | 'Quote' | 'Won' | 'Lost';

export interface Enquiry {
  id: string;
  prospectName: string; // The client
  contactName: string; // Family member/Caller
  contactPhone: string;
  receivedDate: string;
  status: EnquiryStatus;
  initialNotes: string;
  estimatedValue?: number; // Weekly £
}

export interface EnquiryAnalysis {
  summary: string;
  careLevel: 'Low' | 'Medium' | 'High';
  fundingSource: string;
  estimatedHours: number;
  urgency: 'Low' | 'Medium' | 'High';
  suggestedAction: string;
}

// Telehealth
export interface TelehealthSession {
  id: string;
  hostName: string;
  clientName: string;
  scheduledTime: string;
  duration: string;
  status: 'Upcoming' | 'Live' | 'Completed';
  topic: string;
}

// Document Management
export interface StoredDocument {
  id: string;
  name: string;
  type: 'PDF' | 'Image' | 'Word';
  category: 'Client Record' | 'Staff HR' | 'Corporate' | 'Compliance';
  ownerName?: string; // e.g. Client Name or Staff Name
  uploadedDate: string;
  expiryDate?: string;
  tags: string[];
  summary?: string;
  size: string;
}

export interface DocumentAnalysis {
  suggestedCategory: string;
  summary: string;
  detectedExpiryDate?: string;
  suggestedTags: string[];
}

// Task Management
export interface OfficeTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Done';
  tags: string[];
}

// Assets & Equipment
export interface Asset {
  id: string;
  name: string;
  type: 'Medical' | 'IT' | 'Mobility' | 'Safety';
  serialNumber: string;
  assignedTo: string; // Client or Staff Name
  assignedType: 'Client' | 'Staff' | 'Office';
  purchaseDate: string;
  nextInspectionDate?: string; // e.g. LOLER due date
  status: 'Active' | 'Repair' | 'Retired';
  value: number;
}

export interface AssetAnalysis {
  recommendedMaintenanceInterval: string;
  riskFactors: string[];
  predictedEndOfLife: string;
  maintenanceTips: string[];
}

// Expenses
export interface ExpenseClaim {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  type: 'Mileage' | 'Purchase' | 'Training' | 'Other';
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  receiptUrl?: string; // Mock URL
  merchantName?: string;
}

export interface ReceiptAnalysis {
  merchant: string;
  date: string;
  total: number;
  category: 'Mileage' | 'Purchase' | 'Training' | 'Other';
}

// Shift Marketplace
export interface MarketShift {
  id: string;
  date: string;
  time: string;
  clientName: string;
  location: string;
  role: 'Carer' | 'Nurse' | 'Senior';
  baseRate: number;
  surgeBonus: number; // Extra £ per hour
  status: 'Open' | 'Pending' | 'Filled';
  applicants: number;
}

export interface MarketPrediction {
  fillProbability: number; // 0-100
  recommendedSurge: number;
  reasoning: string;
}

// Activities
export interface SocialEvent {
  id: string;
  title: string;
  type: 'Social' | 'Exercise' | 'Outing' | 'Creative';
  date: string;
  time: string;
  location: string;
  attendeesCount: number;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  description: string;
}

export interface ActivitySuggestion {
  title: string;
  type: string;
  description: string;
  suitabilityReason: string;
  requiredResources: string[];
}

// User Management & Security
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  status: 'Active' | 'Suspended' | 'Locked';
  relatedEntityId?: string; // Link to Staff/Client profile
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string; // e.g. "Login", "Export Data", "View Record"
  details: string;
  ipAddress: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface SecurityAnalysis {
  threatLevel: 'Low' | 'Medium' | 'High';
  suspiciousActivities: string[];
  recommendations: string[];
}

// Feedback & Quality
export interface FeedbackRecord {
  id: string;
  date: string;
  source: string; // e.g. Client Name or "Anonymous Family"
  category: 'Praise' | 'Complaint' | 'Suggestion';
  rating: number; // 1-5
  comment: string;
  status: 'New' | 'Reviewed' | 'Actioned';
  response?: string;
}

export interface SentimentSummary {
  overallScore: number; // -100 to 100
  keyThemes: string[];
  positiveHighlights: string[];
  areasForImprovement: string[];
}

// Notifications
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'Critical' | 'Warning' | 'Info' | 'Success';
  time: string;
  isRead: boolean;
  link?: string; // Path to navigate to
}

// Nutrition
export interface MealPlan {
  id: string;
  day: string; // Mon, Tue...
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  calories?: number;
}

export interface HydrationLog {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  targetMl: number;
  status: 'Good' | 'Warning' | 'Critical';
}

// Inventory
export interface InventoryItem {
  id: string;
  name: string;
  category: 'PPE' | 'Uniform' | 'Office' | 'Cleaning';
  quantity: number;
  unit: string; // e.g. "Box of 100", "Unit"
  minLevel: number;
  location: string;
  lastRestocked: string;
}

export interface StockPrediction {
  itemId: string;
  itemName: string;
  daysRemaining: number;
  depletionDate: string;
  suggestedOrder: number;
  reasoning: string;
}
