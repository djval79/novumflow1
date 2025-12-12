/**
 * Automated Document Classification Service
 * 
 * Uses AI to automatically classify and extract information from uploaded documents
 * - Document type detection (passport, visa, DBS, training certificates, etc.)
 * - Expiry date extraction
 * - Authority classification (Home Office vs CQC)
 * - Data extraction for verification
 */

import { ALL_COMPLIANCE_DOCUMENTS, ComplianceAuthority, DocumentTypeId } from './complianceTypes';

// ===========================================
// TYPES
// ===========================================

export interface ClassificationResult {
  documentTypeId: string;
  documentTypeName: string;
  authority: ComplianceAuthority;
  confidence: number;
  extractedData: ExtractedDocumentData;
  suggestions: string[];
  needsManualReview: boolean;
  reviewReasons?: string[];
}

export interface ExtractedDocumentData {
  // Common fields
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  
  // Person details
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  
  // Document-specific
  passportNumber?: string;
  visaType?: string;
  visaStatus?: string;
  brpNumber?: string;
  shareCode?: string;
  niNumber?: string;
  dbsNumber?: string;
  dbsLevel?: string;
  nmcPin?: string;
  qualificationLevel?: string;
  qualificationTitle?: string;
  trainingType?: string;
  trainingProvider?: string;
  
  // Raw text for manual review
  rawText?: string;
}

export interface DocumentPattern {
  type: DocumentTypeId;
  patterns: RegExp[];
  keywords: string[];
  requiredFields: string[];
  expiryPattern?: RegExp;
  numberPattern?: RegExp;
}

// ===========================================
// DOCUMENT PATTERNS
// ===========================================

const DOCUMENT_PATTERNS: DocumentPattern[] = [
  // Passport
  {
    type: 'rtw_passport',
    patterns: [
      /passport/i,
      /travel\s*document/i,
      /nationality.*british|british.*nationality/i
    ],
    keywords: ['passport', 'travel document', 'nationality', 'place of birth', 'date of issue', 'date of expiry'],
    requiredFields: ['fullName', 'passportNumber', 'dateOfBirth', 'expiryDate', 'nationality'],
    expiryPattern: /(?:date\s*of\s*)?expiry[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i,
    numberPattern: /passport\s*(?:no\.?|number)[:\s]*([A-Z0-9]{9})/i
  },
  
  // Visa
  {
    type: 'rtw_visa',
    patterns: [
      /visa/i,
      /entry\s*clearance/i,
      /leave\s*to\s*(?:enter|remain)/i,
      /immigration.*status/i
    ],
    keywords: ['visa', 'entry clearance', 'leave to remain', 'work permit', 'skilled worker', 'tier 2'],
    requiredFields: ['visaType', 'expiryDate'],
    expiryPattern: /(?:valid\s*(?:until|to)|expir[yies])[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i
  },
  
  // BRP
  {
    type: 'rtw_brp',
    patterns: [
      /biometric\s*residence\s*permit/i,
      /brp/i,
      /residence\s*permit/i
    ],
    keywords: ['biometric residence permit', 'brp', 'immigration', 'home office'],
    requiredFields: ['brpNumber', 'expiryDate'],
    expiryPattern: /expiry[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4})/i,
    numberPattern: /(?:brp|permit)\s*(?:no\.?|number)[:\s]*([A-Z]{2}\d{7})/i
  },
  
  // Share Code
  {
    type: 'rtw_share_code',
    patterns: [
      /share\s*code/i,
      /right\s*to\s*work\s*share\s*code/i,
      /gov\.uk.*share.*code/i
    ],
    keywords: ['share code', 'right to work', 'immigration status', 'view your status'],
    requiredFields: ['shareCode', 'expiryDate'],
    numberPattern: /share\s*code[:\s]*([A-Z0-9]{9})/i
  },
  
  // National Insurance
  {
    type: 'national_insurance',
    patterns: [
      /national\s*insurance/i,
      /ni\s*number/i,
      /hmrc.*national\s*insurance/i
    ],
    keywords: ['national insurance', 'ni number', 'hmrc', 'insurance number'],
    requiredFields: ['niNumber'],
    numberPattern: /(?:ni|national\s*insurance)\s*(?:no\.?|number)?[:\s]*([A-Z]{2}\d{6}[A-Z])/i
  },
  
  // Birth Certificate
  {
    type: 'birth_certificate',
    patterns: [
      /birth\s*certificate/i,
      /certified\s*copy.*birth/i,
      /register\s*of\s*births/i
    ],
    keywords: ['birth certificate', 'register of births', 'registration district'],
    requiredFields: ['fullName', 'dateOfBirth']
  },
  
  // DBS Certificate
  {
    type: 'dbs_certificate',
    patterns: [
      /dbs/i,
      /disclosure.*barring/i,
      /enhanced\s*(?:dbs|disclosure)/i,
      /police\s*check/i
    ],
    keywords: ['dbs', 'disclosure and barring', 'enhanced check', 'barred list', 'police check'],
    requiredFields: ['dbsNumber', 'issueDate', 'dbsLevel'],
    numberPattern: /(?:dbs|certificate)\s*(?:no\.?|number)[:\s]*(\d{12})/i
  },
  
  // DBS Update Service
  {
    type: 'dbs_update_service',
    patterns: [
      /update\s*service/i,
      /dbs\s*update/i,
      /subscription.*dbs/i
    ],
    keywords: ['update service', 'dbs online', 'subscription', 'annual fee'],
    requiredFields: ['dbsNumber', 'expiryDate']
  },
  
  // Care Certificate
  {
    type: 'care_certificate',
    patterns: [
      /care\s*certificate/i,
      /skills\s*for\s*care/i,
      /15\s*standards/i
    ],
    keywords: ['care certificate', 'skills for care', 'standards', 'health and social care'],
    requiredFields: ['issueDate']
  },
  
  // NVQ/QCF Qualification
  {
    type: 'nvq_qualification',
    patterns: [
      /nvq/i,
      /qcf/i,
      /level\s*[2-5].*health.*social\s*care/i,
      /diploma.*health.*social\s*care/i
    ],
    keywords: ['nvq', 'qcf', 'diploma', 'health and social care', 'level 2', 'level 3', 'level 4', 'level 5'],
    requiredFields: ['qualificationLevel', 'qualificationTitle', 'issueDate']
  },
  
  // NMC PIN
  {
    type: 'nmc_pin',
    patterns: [
      /nmc/i,
      /nursing.*midwifery\s*council/i,
      /registered\s*nurse/i,
      /pin\s*number/i
    ],
    keywords: ['nmc', 'nursing and midwifery council', 'registered nurse', 'pin', 'registration'],
    requiredFields: ['nmcPin', 'expiryDate'],
    numberPattern: /(?:nmc|pin)[:\s]*(\d{2}[A-Z]\d{4}[A-Z])/i,
    expiryPattern: /(?:expiry|renewal)[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4})/i
  },
  
  // Mandatory Training
  {
    type: 'mandatory_training',
    patterns: [
      /certificate.*training/i,
      /training\s*certificate/i,
      /safeguarding/i,
      /manual\s*handling/i,
      /first\s*aid/i,
      /fire\s*safety/i,
      /health.*safety/i,
      /infection\s*control/i
    ],
    keywords: ['training certificate', 'safeguarding', 'manual handling', 'first aid', 'fire safety', 
               'health and safety', 'infection control', 'food hygiene', 'medication', 'cpr'],
    requiredFields: ['trainingType', 'issueDate', 'trainingProvider'],
    expiryPattern: /(?:valid\s*(?:until|to)|expir[yies])[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4})/i
  },
  
  // Health Declaration
  {
    type: 'health_declaration',
    patterns: [
      /health\s*declaration/i,
      /fitness\s*to\s*work/i,
      /medical\s*declaration/i
    ],
    keywords: ['health declaration', 'fitness to work', 'medical condition', 'disability'],
    requiredFields: []
  },
  
  // Immunization Records
  {
    type: 'immunization_records',
    patterns: [
      /immuni[sz]ation/i,
      /vaccination/i,
      /hepatitis\s*b/i,
      /tb\s*(?:test|screening)/i
    ],
    keywords: ['immunization', 'vaccination', 'hepatitis', 'tb', 'tuberculosis', 'vaccine'],
    requiredFields: [],
    expiryPattern: /(?:next\s*dose|booster)[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4})/i
  },
  
  // Photo ID
  {
    type: 'photo_id',
    patterns: [
      /driving\s*licen[cs]e/i,
      /photo\s*id/i,
      /identity\s*card/i
    ],
    keywords: ['driving licence', 'photo id', 'identity card', 'dvla'],
    requiredFields: ['fullName', 'documentNumber'],
    expiryPattern: /(?:valid\s*(?:until|to)|expir[yies])[:\s]*(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i
  },
  
  // Proof of Address
  {
    type: 'proof_of_address',
    patterns: [
      /utility\s*bill/i,
      /bank\s*statement/i,
      /council\s*tax/i,
      /proof.*address/i
    ],
    keywords: ['utility bill', 'bank statement', 'council tax', 'gas', 'electric', 'water', 'address'],
    requiredFields: ['issueDate']
  },
  
  // CV/Resume
  {
    type: 'cv_resume',
    patterns: [
      /curriculum\s*vitae/i,
      /\bcv\b/i,
      /resume/i,
      /personal\s*statement/i
    ],
    keywords: ['cv', 'curriculum vitae', 'resume', 'experience', 'education', 'employment history'],
    requiredFields: []
  },
  
  // References
  {
    type: 'employment_references',
    patterns: [
      /reference/i,
      /recommendation/i,
      /employer.*reference/i
    ],
    keywords: ['reference', 'recommendation', 'employer', 'employment reference', 'character reference'],
    requiredFields: []
  },
  
  // Signed Contract
  {
    type: 'signed_contract',
    patterns: [
      /employment\s*contract/i,
      /contract\s*of\s*employment/i,
      /terms.*conditions.*employment/i
    ],
    keywords: ['employment contract', 'contract of employment', 'terms and conditions', 'salary', 'hours'],
    requiredFields: []
  }
];

// ===========================================
// TRAINING TYPE PATTERNS
// ===========================================

const TRAINING_TYPE_PATTERNS: Record<string, RegExp[]> = {
  safeguarding_adults: [/safeguarding.*adult/i, /adult.*safeguarding/i, /protection.*vulnerable.*adult/i],
  safeguarding_children: [/safeguarding.*child/i, /child.*protection/i, /children.*safeguarding/i],
  health_safety: [/health.*safety/i, /h\s*&\s*s/i, /workplace\s*safety/i],
  fire_safety: [/fire\s*safety/i, /fire\s*awareness/i, /fire\s*marshal/i, /fire\s*warden/i],
  first_aid: [/first\s*aid/i, /emergency\s*first\s*aid/i, /paediatric\s*first\s*aid/i],
  manual_handling: [/manual\s*handling/i, /moving.*handling/i, /people\s*handling/i],
  medication_admin: [/medication/i, /medicine.*management/i, /administering.*medication/i],
  infection_control: [/infection\s*control/i, /infection\s*prevention/i, /hand\s*hygiene/i],
  mental_capacity: [/mental\s*capacity/i, /mca/i, /capacity\s*act/i],
  deprivation_liberty: [/dols/i, /deprivation.*liberty/i, /liberty.*safeguards/i],
  food_hygiene: [/food\s*hygiene/i, /food\s*safety/i, /level\s*2\s*food/i],
  gdpr_data: [/gdpr/i, /data\s*protection/i, /information\s*governance/i],
  equality_diversity: [/equality/i, /diversity/i, /inclusion/i, /e\s*&\s*d/i],
  dementia_awareness: [/dementia/i, /alzheimer/i, /memory.*care/i],
  end_of_life: [/end\s*of\s*life/i, /palliative/i, /eolc/i]
};

// ===========================================
// CLASSIFICATION SERVICE
// ===========================================

class DocumentClassificationService {
  
  /**
   * Classify a document based on its content
   */
  async classifyDocument(
    fileContent: string,
    fileName: string,
    mimeType: string
  ): Promise<ClassificationResult> {
    // Normalize content for analysis
    const normalizedContent = this.normalizeText(fileContent);
    const normalizedFileName = fileName.toLowerCase();
    
    // Find best matching document type
    const matchResults = DOCUMENT_PATTERNS.map(pattern => ({
      pattern,
      score: this.calculateMatchScore(normalizedContent, normalizedFileName, pattern)
    }));
    
    // Sort by score
    matchResults.sort((a, b) => b.score - a.score);
    
    const bestMatch = matchResults[0];
    const secondBestMatch = matchResults[1];
    
    // Determine confidence
    const confidence = this.calculateConfidence(bestMatch.score, secondBestMatch?.score || 0);
    
    // Extract data from document
    const extractedData = this.extractDocumentData(normalizedContent, bestMatch.pattern);
    
    // Get document type info
    const docType = ALL_COMPLIANCE_DOCUMENTS[bestMatch.pattern.type as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
    
    // Determine if manual review is needed
    const { needsReview, reasons } = this.determineReviewNeed(
      confidence,
      extractedData,
      bestMatch.pattern.requiredFields,
      docType
    );
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(
      extractedData,
      bestMatch.pattern.requiredFields,
      docType
    );
    
    return {
      documentTypeId: bestMatch.pattern.type,
      documentTypeName: docType?.name || bestMatch.pattern.type,
      authority: docType?.authority || 'INTERNAL',
      confidence,
      extractedData,
      suggestions,
      needsManualReview: needsReview,
      reviewReasons: reasons
    };
  }

  /**
   * Classify document from file
   */
  async classifyFromFile(file: File): Promise<ClassificationResult> {
    const text = await this.extractTextFromFile(file);
    return this.classifyDocument(text, file.name, file.type);
  }

  /**
   * Extract text from various file types
   */
  private async extractTextFromFile(file: File): Promise<string> {
    // For PDFs and images, you would typically use OCR or PDF parsing
    // This is a simplified version that handles text-based files
    
    if (file.type === 'text/plain' || file.type === 'application/json') {
      return await file.text();
    }
    
    // For other types, return filename-based classification
    // In production, integrate with OCR service (e.g., Google Vision, AWS Textract)
    return file.name;
  }

  /**
   * Normalize text for consistent matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate match score for a document pattern
   */
  private calculateMatchScore(content: string, fileName: string, pattern: DocumentPattern): number {
    let score = 0;
    
    // Check patterns in content
    for (const regex of pattern.patterns) {
      if (regex.test(content)) {
        score += 20;
      }
      if (regex.test(fileName)) {
        score += 15;
      }
    }
    
    // Check keywords
    for (const keyword of pattern.keywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 10;
      }
      if (fileName.includes(keyword.toLowerCase().replace(/\s+/g, '_'))) {
        score += 5;
      }
    }
    
    // Bonus for extracted required fields
    const extractedData = this.extractDocumentData(content, pattern);
    const extractedFields = pattern.requiredFields.filter(
      field => extractedData[field as keyof ExtractedDocumentData]
    );
    score += extractedFields.length * 15;
    
    return score;
  }

  /**
   * Calculate confidence percentage
   */
  private calculateConfidence(bestScore: number, secondBestScore: number): number {
    if (bestScore === 0) return 0;
    
    // Base confidence from absolute score
    const baseConfidence = Math.min(100, bestScore);
    
    // Adjust based on gap between best and second best
    const gap = bestScore - secondBestScore;
    const gapBonus = Math.min(20, gap / 2);
    
    return Math.min(100, Math.round(baseConfidence * 0.7 + gapBonus * 1.5));
  }

  /**
   * Extract relevant data from document content
   */
  private extractDocumentData(content: string, pattern: DocumentPattern): ExtractedDocumentData {
    const data: ExtractedDocumentData = {
      rawText: content.substring(0, 500) // Keep first 500 chars for reference
    };
    
    // Extract expiry date
    if (pattern.expiryPattern) {
      const expiryMatch = content.match(pattern.expiryPattern);
      if (expiryMatch) {
        data.expiryDate = this.parseDate(expiryMatch[1]);
      }
    }
    
    // Extract document number
    if (pattern.numberPattern) {
      const numberMatch = content.match(pattern.numberPattern);
      if (numberMatch) {
        data.documentNumber = numberMatch[1];
        
        // Set specific field based on document type
        switch (pattern.type) {
          case 'rtw_passport':
            data.passportNumber = numberMatch[1];
            break;
          case 'rtw_brp':
            data.brpNumber = numberMatch[1];
            break;
          case 'rtw_share_code':
            data.shareCode = numberMatch[1];
            break;
          case 'national_insurance':
            data.niNumber = numberMatch[1];
            break;
          case 'dbs_certificate':
          case 'dbs_update_service':
            data.dbsNumber = numberMatch[1];
            break;
          case 'nmc_pin':
            data.nmcPin = numberMatch[1];
            break;
        }
      }
    }
    
    // Extract name (common pattern)
    const nameMatch = content.match(/(?:name|holder)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract date of birth
    const dobMatch = content.match(/(?:date\s*of\s*birth|dob|born)[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i);
    if (dobMatch) {
      data.dateOfBirth = this.parseDate(dobMatch[1]);
    }
    
    // Extract nationality
    const nationalityMatch = content.match(/nationality[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (nationalityMatch) {
      data.nationality = nationalityMatch[1].trim();
    }
    
    // Extract issue date
    const issueDateMatch = content.match(/(?:date\s*of\s*issue|issued|issue\s*date)[:\s]*(\d{1,2}[\s\/\-]\w{3}[\s\/\-]\d{4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i);
    if (issueDateMatch) {
      data.issueDate = this.parseDate(issueDateMatch[1]);
    }
    
    // Extract DBS level
    if (pattern.type === 'dbs_certificate') {
      if (/enhanced/i.test(content)) {
        data.dbsLevel = 'Enhanced';
        if (/adult.*first/i.test(content) || /child.*first/i.test(content)) {
          data.dbsLevel += ' with Barred List';
        }
      } else if (/standard/i.test(content)) {
        data.dbsLevel = 'Standard';
      } else if (/basic/i.test(content)) {
        data.dbsLevel = 'Basic';
      }
    }
    
    // Extract training type for training certificates
    if (pattern.type === 'mandatory_training') {
      data.trainingType = this.detectTrainingType(content);
      
      // Extract provider
      const providerMatch = content.match(/(?:provider|delivered\s*by|issued\s*by)[:\s]*([A-Za-z\s]+?)(?:\.|,|\n|$)/i);
      if (providerMatch) {
        data.trainingProvider = providerMatch[1].trim();
      }
    }
    
    // Extract qualification level
    if (pattern.type === 'nvq_qualification') {
      const levelMatch = content.match(/level\s*(\d)/i);
      if (levelMatch) {
        data.qualificationLevel = `Level ${levelMatch[1]}`;
      }
      
      const titleMatch = content.match(/(?:diploma|certificate|nvq|qcf)\s*(?:in\s*)?(.*?)(?:level|$)/i);
      if (titleMatch) {
        data.qualificationTitle = titleMatch[1].trim();
      }
    }
    
    // Extract visa type
    if (pattern.type === 'rtw_visa') {
      const visaTypes = ['skilled worker', 'tier 2', 'student', 'family', 'settlement', 'indefinite leave'];
      for (const type of visaTypes) {
        if (content.toLowerCase().includes(type)) {
          data.visaType = type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
        }
      }
    }
    
    return data;
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string {
    try {
      // Try various formats
      const cleanDate = dateStr.trim().replace(/\s+/g, ' ');
      
      // DD/MM/YYYY or DD-MM-YYYY
      let match = cleanDate.match(/(\d{1,2})[\s\/\-](\d{1,2})[\s\/\-](\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // DD MMM YYYY
      match = cleanDate.match(/(\d{1,2})\s*([A-Za-z]{3})\s*(\d{4})/);
      if (match) {
        const [, day, monthStr, year] = match;
        const months: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const month = months[monthStr.toLowerCase()];
        if (month) {
          return `${year}-${month}-${day.padStart(2, '0')}`;
        }
      }
      
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  /**
   * Detect training type from content
   */
  private detectTrainingType(content: string): string {
    for (const [type, patterns] of Object.entries(TRAINING_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return type;
        }
      }
    }
    return 'other';
  }

  /**
   * Determine if manual review is needed
   */
  private determineReviewNeed(
    confidence: number,
    extractedData: ExtractedDocumentData,
    requiredFields: string[],
    docType: any
  ): { needsReview: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Low confidence
    if (confidence < 70) {
      reasons.push('Low classification confidence');
    }
    
    // Missing required fields
    const missingFields = requiredFields.filter(
      field => !extractedData[field as keyof ExtractedDocumentData]
    );
    if (missingFields.length > 0) {
      reasons.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Expiry date in the past (might be invalid or renewed)
    if (extractedData.expiryDate) {
      const expiry = new Date(extractedData.expiryDate);
      if (expiry < new Date()) {
        reasons.push('Document appears to be expired');
      }
    }
    
    // Document requires verification
    if (docType?.verificationRequired) {
      reasons.push('Document type requires verification');
    }
    
    return {
      needsReview: reasons.length > 0,
      reasons
    };
  }

  /**
   * Generate helpful suggestions
   */
  private generateSuggestions(
    extractedData: ExtractedDocumentData,
    requiredFields: string[],
    docType: any
  ): string[] {
    const suggestions: string[] = [];
    
    // Missing fields suggestions
    const missingFields = requiredFields.filter(
      field => !extractedData[field as keyof ExtractedDocumentData]
    );
    
    for (const field of missingFields) {
      switch (field) {
        case 'expiryDate':
          suggestions.push('Please ensure the expiry date is clearly visible');
          break;
        case 'documentNumber':
          suggestions.push('Ensure the document number is visible and not obscured');
          break;
        case 'fullName':
          suggestions.push('The full name should be clearly visible');
          break;
        case 'dbsNumber':
          suggestions.push('The 12-digit DBS certificate number should be visible');
          break;
        case 'nmcPin':
          suggestions.push('Please ensure the NMC PIN is visible');
          break;
      }
    }
    
    // Document quality suggestions
    if (!extractedData.rawText || extractedData.rawText.length < 100) {
      suggestions.push('Consider uploading a higher quality scan for better text extraction');
    }
    
    // Expiry suggestions
    if (extractedData.expiryDate) {
      const expiry = new Date(extractedData.expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        suggestions.push('This document appears to be expired. Please upload a current version.');
      } else if (daysUntilExpiry < 30) {
        suggestions.push(`This document expires in ${daysUntilExpiry} days. Consider renewing soon.`);
      }
    }
    
    return suggestions;
  }

  /**
   * Bulk classify multiple documents
   */
  async classifyMultiple(files: File[]): Promise<ClassificationResult[]> {
    return Promise.all(files.map(file => this.classifyFromFile(file)));
  }

  /**
   * Suggest document type from filename
   */
  suggestDocumentType(fileName: string): { typeId: string; typeName: string; confidence: number } | null {
    const normalizedName = fileName.toLowerCase();
    
    for (const pattern of DOCUMENT_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedName)) {
          const docType = ALL_COMPLIANCE_DOCUMENTS[pattern.type as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
          return {
            typeId: pattern.type,
            typeName: docType?.name || pattern.type,
            confidence: 60
          };
        }
      }
      
      for (const keyword of pattern.keywords) {
        if (normalizedName.includes(keyword.toLowerCase().replace(/\s+/g, '_'))) {
          const docType = ALL_COMPLIANCE_DOCUMENTS[pattern.type as keyof typeof ALL_COMPLIANCE_DOCUMENTS];
          return {
            typeId: pattern.type,
            typeName: docType?.name || pattern.type,
            confidence: 40
          };
        }
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const documentClassificationService = new DocumentClassificationService();
export default documentClassificationService;
