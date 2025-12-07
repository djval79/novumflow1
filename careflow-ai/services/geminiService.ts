
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCarePlan, Shift, StaffMember, ProgressLog, CareGoal, Medication, FormTemplate, GeneratedQuiz, IncidentAnalysis, CandidateAnalysis, EnquiryAnalysis, DocumentAnalysis, OfficeTask, AssetAnalysis, ReceiptAnalysis, MarketPrediction, ActivitySuggestion, SecurityAnalysis, SentimentSummary, AppNotification, MealPlan, StockPrediction } from "../types";

// Initialize the client with the API key from the environment
// Only initialize if API key is available to prevent crashes
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to check if AI is available
const checkAI = () => {
  if (!ai) {
    console.warn('Gemini API key not set. AI features are disabled.');
    return false;
  }
  return true;
};

export const generateCarePlanAI = async (
  clientDetails: string,
  medicalHistory: string
): Promise<GeneratedCarePlan | null> => {
  if (!checkAI()) return null;

  try {
    const modelId = 'gemini-2.5-flash'; // Using 2.5 Flash for speed and structure

    const response = await ai!.models.generateContent({
      model: modelId,
      contents: `Create a detailed care plan and risk assessment for a care home or home help client.
      
      Client Details: ${clientDetails}
      Medical History/Condition: ${medicalHistory}
      
      Return a structured JSON response suitable for a care management system.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A 2-3 sentence executive summary of the care required." },
            needs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "e.g., Mobility, Hygiene, Nutrition" },
                  description: { type: Type.STRING },
                  frequency: { type: Type.STRING, description: "e.g., Daily, Twice Daily, Per Visit" }
                }
              }
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING, description: "The specific risk identified" },
                  mitigation: { type: Type.STRING, description: "Steps to reduce the risk" },
                  score: { type: Type.NUMBER, description: "Risk score 1 (low) to 5 (high)" }
                }
              }
            },
            goals: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "Short or long term goals for the client" }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedCarePlan;
    }
    return null;
  } catch (error) {
    console.error("Error generating care plan:", error);
    throw error;
  }
};

export const analyzeRiskScenario = async (incidentDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following incident report for a care provider and suggest 3 immediate actions and a long-term prevention strategy. Keep it professional and concise.
      
      Incident: ${incidentDescription}`
    });
    return response.text || "Unable to analyze risk.";
  } catch (error) {
    console.error("Error analyzing risk:", error);
    return "Error connecting to AI service.";
  }
};

export const generateRosterSuggestions = async (
  shifts: Shift[],
  staff: StaffMember[]
): Promise<{ shiftId: string; staffName: string; reason: string }[]> => {
  try {
    const unassignedShifts = shifts.filter(s => s.status === 'Unassigned');

    if (unassignedShifts.length === 0) return [];

    // Simplified data to reduce token usage
    const simpleStaff = staff.map(s => ({ id: s.id, name: s.name, role: s.role, skills: s.skills, availability: s.availability }));
    const simpleShifts = unassignedShifts.map(s => ({ id: s.id, client: s.clientName, time: s.startTime, type: s.type }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an automated rostering agent. Assign the following Unassigned Shifts to the available Staff.
      
      Rules:
      1. Match "Medical" shifts to staff with "Medical" or "Nursing" skills.
      2. Match "Personal Care" to staff with "Personal Care" or "Basic Care".
      3. Ensure staff availability matches (e.g., don't assign weekend shifts to Mon-Fri staff).
      4. Return a JSON array of assignments.
      
      Staff: ${JSON.stringify(simpleStaff)}
      
      Shifts to Assign: ${JSON.stringify(simpleShifts)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shiftId: { type: Type.STRING },
                  staffName: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Brief reason for assignment (e.g. 'Matches Medical skill')" }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return result.assignments || [];
    }
    return [];
  } catch (error) {
    console.error("Error generating roster:", error);
    return [];
  }
};

export const generateExecutiveReport = async (
  stats: {
    revenue: number;
    costs: number;
    incidents: number;
    compliance: number;
    missedVisits: number;
  }
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a concise (max 100 words) executive management summary for a care agency based on this data:
      
      - Monthly Revenue: £${stats.revenue}
      - Staff Costs: £${stats.costs}
      - Safety Incidents: ${stats.incidents}
      - Staff Compliance: ${stats.compliance}%
      - Missed Visits: ${stats.missedVisits}
      
      Highlight any immediate risks (like low compliance or missed visits) and comment on financial health. Use a professional, directive tone.`
    });
    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "AI Service unavailable for reporting.";
  }
};

export const generatePolicyDocument = async (
  trainingModules: string[],
  companyName: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a professional "Staff Training & Compliance Policy" for a care agency named "${companyName}".
      
      The policy must explicitly cover the following mandatory training modules:
      ${trainingModules.join(', ')}
      
      Structure:
      1. Policy Statement
      2. Mandatory Training Requirements
      3. Renewal & Compliance Monitoring
      4. Consequences of Non-Compliance
      
      Format the output as clean Markdown.`
    });
    return response.text || "Unable to generate policy.";
  } catch (error) {
    console.error("Error generating policy:", error);
    return "AI Service unavailable.";
  }
};

export const generateProgressReview = async (
  logs: ProgressLog[],
  goals: CareGoal[]
): Promise<string> => {
  try {
    // Simplify data for prompt
    const logsSummary = logs.map(l => `${l.date} [${l.category}]: ${l.note} (Score: ${l.progressScore})`).join('\n');
    const goalsSummary = goals.map(g => `${g.category}: ${g.description} (Status: ${g.status})`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `As a Clinical Care Specialist, review the following client progress logs against their goals.
      
      Current Goals:
      ${goalsSummary}
      
      Recent Visit Logs:
      ${logsSummary}
      
      Provide a brief clinical review (max 150 words). 
      1. Identify if the client is improving, plateauing, or declining.
      2. Highlight any specific concerns based on the notes (e.g. mood or specific symptoms).
      3. Suggest one adjustment to the care plan.`
    });
    return response.text || "Unable to analyze progress.";
  } catch (error) {
    console.error("Error analyzing progress:", error);
    return "AI Analysis unavailable.";
  }
};

export const generateSmartReplies = async (
  messageHistory: string
): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful care agency administrator assistant. 
      Based on the following recent message history, generate 3 brief, professional smart replies that I can send back.
      
      Conversation:
      ${messageHistory}
      
      Return ONLY a JSON array of strings, e.g. ["Response 1", "Response 2", "Response 3"].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text).replies || ["Received, thank you.", "I will look into this.", "Please call me to discuss."];
    }
    return [];
  } catch (error) {
    console.error("Error generating replies:", error);
    return ["Thanks for your message.", "I'll get back to you shortly.", "Could you provide more details?"];
  }
};

export const optimizeRouteSequence = async (
  locations: { name: string; x: number; y: number }[]
): Promise<{ optimizedOrder: string[]; savedDistance: number }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Solve the Traveling Salesperson Problem for these coordinates on a 100x100 grid. Start at {x:50, y:50} (Office).
      
      Locations: ${JSON.stringify(locations)}
      
      Return a JSON object with:
      1. 'optimizedOrder': Array of location names in the best visit order.
      2. 'savedDistance': Estimated percentage of distance saved vs random order (0-50).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedOrder: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            savedDistance: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { optimizedOrder: locations.map(l => l.name), savedDistance: 0 };
  } catch (error) {
    console.error("Error optimizing route:", error);
    return { optimizedOrder: locations.map(l => l.name), savedDistance: 0 };
  }
};

export const analyzeMedicationSafety = async (
  medications: Medication[],
  conditionDescription: string
): Promise<string> => {
  try {
    const medList = medications.map(m => `${m.name} (${m.dosage})`).join(', ');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `As a Clinical Pharmacist AI, review this patient's medication list against their conditions for safety.
      
      Medications: ${medList}
      Patient Conditions: ${conditionDescription}
      
      Provide a safety report:
      1. Flag any potential drug-drug interactions (e.g. "Interaction detected between X and Y").
      2. Flag any contraindications with the condition.
      3. If safe, state "No significant interactions detected."
      
      Keep it concise and bulleted.`
    });
    return response.text || "Unable to verify safety.";
  } catch (error) {
    console.error("Error checking interactions:", error);
    return "AI Interaction Service unavailable.";
  }
};

export const generateFormTemplate = async (
  topic: string
): Promise<FormTemplate> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a professional audit or assessment form template for a Care Agency based on this topic: "${topic}".
      
      Include 5-8 relevant questions.
      Use a mix of 'YesNo', 'Text', 'Rating', and 'Date' question types.
      
      Return a structured JSON object matching the FormTemplate interface (excluding createdBy/createdAt).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING, description: "e.g. Safety, HR, Clinical" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Text", "YesNo", "Rating", "Date"] },
                  required: { type: Type.BOOLEAN }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        id: `ft_${Date.now()}`,
        createdBy: 'AI Assistant',
        createdAt: new Date().toISOString().split('T')[0]
      } as FormTemplate;
    }
    throw new Error("Failed to generate form");
  } catch (error) {
    console.error("Error generating form:", error);
    throw error;
  }
};

export const generateTrainingQuiz = async (
  topic: string
): Promise<GeneratedQuiz> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a 5-question multiple choice quiz for care staff training on the topic: "${topic}".
      
      Return a structured JSON object with a title and an array of questions.
      Each question should have 4 options and an index for the correct answer (0-3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctOptionIndex: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedQuiz;
    }
    throw new Error("Failed to generate quiz");
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateIncidentInvestigation = async (
  incidentDescription: string,
  incidentType: string
): Promise<IncidentAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Care Quality Investigator. Analyze this incident to determine root cause and required actions.
      
      Incident Type: ${incidentType}
      Description: ${incidentDescription}
      
      Return a structured JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.STRING, description: "Probable root cause analysis." },
            recommendedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Immediate and long-term actions."
            },
            riskScore: { type: Type.NUMBER, description: "Risk score 1-10." },
            preventionStrategy: { type: Type.STRING, description: "How to prevent recurrence." }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as IncidentAnalysis;
    }
    throw new Error("Failed to analyze incident");
  } catch (error) {
    console.error("Error analyzing incident:", error);
    throw error;
  }
};

export const analyzeCandidateProfile = async (
  bio: string,
  role: string
): Promise<CandidateAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as an HR Recruitment Specialist. Screen this candidate's bio for the role of "${role}".
      
      Candidate Bio/CV Summary:
      "${bio}"
      
      Return a structured JSON analysis. Match score should be based on relevance to care work, experience, and tone.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER, description: "0-100 suitability score" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
            interviewQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 specific interview questions to ask this candidate"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CandidateAnalysis;
    }
    throw new Error("Failed to analyze candidate");
  } catch (error) {
    console.error("Error analyzing candidate:", error);
    throw error;
  }
};

export const analyzeEnquiry = async (
  notes: string
): Promise<EnquiryAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Care Sales Consultant. Analyze this care enquiry text to extract key details and estimate value.
      
      Enquiry Text:
      "${notes}"
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Brief 1 sentence summary of need." },
            careLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            fundingSource: { type: Type.STRING, description: "e.g. Private, NHS, Council, Unknown" },
            estimatedHours: { type: Type.NUMBER, description: "Estimated weekly hours needed." },
            urgency: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            suggestedAction: { type: Type.STRING, description: "Next step for sales team." }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as EnquiryAnalysis;
    }
    throw new Error("Failed to analyze enquiry");
  } catch (error) {
    console.error("Error analyzing enquiry:", error);
    throw error;
  }
};

export const analyzeDocument = async (
  documentText: string,
  fileName: string
): Promise<DocumentAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as an Intelligent Document Processing agent for a care agency. Analyze the text content of this document ("${fileName}") to categorize it and extract metadata.
      
      Document Text/Preview:
      "${documentText}"
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: { type: Type.STRING, enum: ["Client Record", "Staff HR", "Corporate", "Compliance"] },
            summary: { type: Type.STRING, description: "Brief description of the document content." },
            detectedExpiryDate: { type: Type.STRING, description: "Any expiry date found (YYYY-MM-DD), or null if none." },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as DocumentAnalysis;
    }
    throw new Error("Failed to analyze document");
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error;
  }
};

export const parseNaturalLanguageTasks = async (
  input: string
): Promise<OfficeTask[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a smart task manager assistant for a care agency office. 
      Convert the following natural language brain dump into a list of structured office tasks.
      Infer priority based on urgency words (ASAP, urgent = High).
      
      Input: "${input}"
      
      Return a structured JSON array of tasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dueDate: { type: Type.STRING, description: "YYYY-MM-DD if inferable, else null" }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.tasks.map((t: any, i: number) => ({
        ...t,
        id: `new_task_${Date.now()}_${i}`,
        status: 'To Do'
      })) as OfficeTask[];
    }
    return [];
  } catch (error) {
    console.error("Error parsing tasks:", error);
    return [];
  }
};

export const askSystemHelp = async (
  query: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the "CareFlow AI" Support Assistant. 
      The user is asking a question about how to use this care management application.
      
      System Features Context:
      - Dashboard: Overview of shifts, visits, and stats.
      - Rostering: Assign shifts, view calendar, auto-schedule with AI.
      - People: Manage Staff and Clients, view compliance, add new profiles.
      - Finance: Payroll, Invoicing, billing.
      - Care Plans: AI generation of care plans, reablement tracking.
      - Medication: eMAR charts, stock tracking, drug safety checks.
      - Telehealth: Video calls and AI Nurse bot.
      - Staff Hub: Payslips, leave requests, policies.
      - CRM: New client enquiries.
      
      User Question: "${query}"
      
      Provide a helpful, friendly, and concise answer guiding them to the right feature.`
    });
    return response.text || "I'm sorry, I couldn't find an answer to that.";
  } catch (error) {
    console.error("Error getting help:", error);
    return "Support service unavailable.";
  }
};

export const predictAssetMaintenance = async (
  assetName: string,
  assetType: string,
  purchaseDate: string
): Promise<AssetAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as an Equipment Maintenance Expert for a Care Provider. 
      Analyze this asset to suggest maintenance schedules and identify risks.
      
      Asset: ${assetName} (${assetType})
      Purchased: ${purchaseDate}
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedMaintenanceInterval: { type: Type.STRING, description: "e.g., Every 6 months (LOLER)" },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common failure points" },
            predictedEndOfLife: { type: Type.STRING, description: "Estimated year of replacement" },
            maintenanceTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daily checks for staff" }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AssetAnalysis;
    }
    throw new Error("Failed to analyze asset");
  } catch (error) {
    console.error("Error analyzing asset:", error);
    throw error;
  }
};

export const analyzeReceipt = async (
  mockBase64: string
): Promise<ReceiptAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Receipt OCR and Data Extraction agent. 
      Analyze this receipt image to extract the merchant, date, total amount, and category.
      
      (Simulated Image Input for "${mockBase64.substring(0, 20)}...")
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            total: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: ["Mileage", "Purchase", "Training", "Other"] }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ReceiptAnalysis;
    }
    throw new Error("Failed to analyze receipt");
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    // Fallback for demo if API fails or mock input is weird
    return {
      merchant: "Tesco Express",
      date: new Date().toISOString().split('T')[0],
      total: 12.50,
      category: "Purchase"
    };
  }
};

export const predictShiftFillChance = async (
  shiftDetails: string
): Promise<MarketPrediction> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Staffing Coordinator AI. 
      Predict the likelihood of an internal staff member picking up this open shift vs needing an external agency.
      
      Shift Details: "${shiftDetails}"
      
      Consider: Unsocial hours (nights/weekends) are harder to fill. High surge bonuses increase likelihood.
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fillProbability: { type: Type.NUMBER, description: "0-100 percent chance of internal fill" },
            recommendedSurge: { type: Type.NUMBER, description: "Recommended surge bonus £ to ensure fill" },
            reasoning: { type: Type.STRING, description: "Brief explanation of the prediction" }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MarketPrediction;
    }
    throw new Error("Failed to predict shift fill");
  } catch (error) {
    console.error("Error predicting shift:", error);
    // Fallback
    return {
      fillProbability: 50,
      recommendedSurge: 2.00,
      reasoning: "Unable to access AI prediction service."
    };
  }
};

export const generateActivityIdeas = async (
  clientInterests: string[]
): Promise<ActivitySuggestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Care Home Activities Coordinator. 
      Suggest 3 engaging group activities suitable for elderly clients with these interests: ${clientInterests.join(', ')}.
      
      Consider mobility restrictions and cognitive impairment (dementia friendly).
      
      Return a structured JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Social", "Exercise", "Outing", "Creative"] },
                  description: { type: Type.STRING },
                  suitabilityReason: { type: Type.STRING, description: "Why this fits the group profile" },
                  requiredResources: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text).suggestions || [];
    }
    return [];
  } catch (error) {
    console.error("Error generating activities:", error);
    return [];
  }
};

export const analyzeSecurityLogs = async (
  logsSummary: string
): Promise<SecurityAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Cybersecurity Analyst for a healthcare SaaS. 
      Review the following access log summary for suspicious activity.
      
      Logs:
      ${logsSummary}
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            threatLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            suspiciousActivities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of concerns" },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable steps" }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SecurityAnalysis;
    }
    throw new Error("Failed to analyze security logs");
  } catch (error) {
    console.error("Error analyzing security:", error);
    return {
      threatLevel: "Low",
      suspiciousActivities: ["Unable to analyze logs."],
      recommendations: ["Check API connection."]
    };
  }
};

export const validateImportData = async (
  rows: string[],
  entityType: 'Staff' | 'Clients' = 'Staff'
): Promise<{ isValid: boolean; errors: string[]; mappedData?: any[] }> => {
  try {
    const prompt = entityType === 'Staff'
      ? `Goal: Map them to standard Staff fields: 'name', 'email', 'role', 'phone'.`
      : `Goal: Map them to standard Client fields: 'name', 'address', 'care_level' (Low/Medium/High), 'date_of_birth' (YYYY-MM-DD).`;

    const schemaProperties = entityType === 'Staff'
      ? {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        role: { type: Type.STRING },
        phone: { type: Type.STRING },
        status: { type: Type.STRING } // 'Valid' or 'Invalid'
      }
      : {
        name: { type: Type.STRING },
        address: { type: Type.STRING },
        care_level: { type: Type.STRING },
        date_of_birth: { type: Type.STRING },
        status: { type: Type.STRING } // 'Valid' or 'Invalid'
      };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Data Import Validator for a Care Management System.
      Review the following raw CSV rows (header + data).
      
      ${prompt}
      
      Rows:
      ${rows.join('\n')}
      
      1. Identify the correct column mapping.
      2. Validate data formats.
      3. Return a structured JSON with validation status.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            errors: { type: Type.ARRAY, items: { type: Type.STRING } },
            mappedData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: schemaProperties
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Failed to validate data");
  } catch (error) {
    console.error("Error validating data:", error);
    return { isValid: false, errors: ["AI Validation Failed"] };
  }
};

export const analyzeFeedbackTrends = async (
  feedbacks: string[]
): Promise<SentimentSummary> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Customer Experience Manager for a Care Agency.
      Analyze the following feedback reviews to identify trends and overall sentiment.
      
      Reviews:
      ${feedbacks.join('\n')}
      
      Return a structured JSON analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "-100 (Negative) to 100 (Positive)" },
            keyThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common topics mentioned" },
            positiveHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SentimentSummary;
    }
    throw new Error("Failed to analyze feedback");
  } catch (error) {
    console.error("Error analyzing feedback:", error);
    return {
      overallScore: 0,
      keyThemes: [],
      positiveHighlights: [],
      areasForImprovement: ["AI Analysis Unavailable"]
    };
  }
};

export const generateDailyBriefing = async (
  notifications: AppNotification[]
): Promise<{ summary: string, focusAreas: string[] }> => {
  try {
    const unread = notifications.filter(n => !n.isRead);
    const alerts = unread.map(n => `- [${n.type}] ${n.title}: ${n.message}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an Intelligent Care Manager Assistant.
      Review these active alerts and notifications for the agency manager.
      
      Alerts:
      ${alerts}
      
      1. Write a friendly 1-sentence morning greeting summarizing the status.
      2. List the top 3 most critical focus areas based on the alerts (e.g. prioritize Critical over Info).
      
      Return structured JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { summary: "Good morning. You have new alerts to review.", focusAreas: ["Check notifications"] };
  } catch (error) {
    console.error("Error generating briefing:", error);
    return { summary: "Welcome back.", focusAreas: [] };
  }
};

export const generateWeeklyMenu = async (
  dietaryConstraints: string[]
): Promise<MealPlan[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a Care Home Chef. Create a balanced 3-day meal plan sample for a client with these needs: ${dietaryConstraints.join(', ')}.
      
      Include Breakfast, Lunch, Dinner, Snacks, and estimated calories.
      
      Return a structured JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  breakfast: { type: Type.STRING },
                  lunch: { type: Type.STRING },
                  dinner: { type: Type.STRING },
                  snacks: { type: Type.STRING },
                  calories: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.meals.map((m: any, i: number) => ({ ...m, id: `gen_meal_${i}` })) as MealPlan[];
    }
    return [];
  } catch (error) {
    console.error("Error generating menu:", error);
    return [];
  }
};

export const predictStockDepletion = async (
  currentStock: number,
  itemType: string,
  shiftsCount: number
): Promise<StockPrediction> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as an Inventory Manager AI.
      Calculate when we will run out of stock for "${itemType}".
      
      Data:
      - Current Stock: ${currentStock} units
      - Scheduled Shifts (Next 7 days): ${shiftsCount}
      
      Assumptions:
      - Gloves: 2 pairs per shift avg.
      - Aprons: 2 per shift avg.
      - Sanitizer: 1 bottle lasts 50 shifts.
      
      Return a structured JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemId: { type: Type.STRING },
            itemName: { type: Type.STRING },
            daysRemaining: { type: Type.NUMBER },
            depletionDate: { type: Type.STRING, description: "Estimated date stock hits zero" },
            suggestedOrder: { type: Type.NUMBER, description: "Recommended order quantity" },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as StockPrediction;
    }
    throw new Error("Failed to predict stock");
  } catch (error) {
    console.error("Error predicting stock:", error);
    // Fallback
    return {
      itemId: 'unknown',
      itemName: itemType,
      daysRemaining: 7,
      depletionDate: 'Unknown',
      suggestedOrder: 100,
      reasoning: "AI Service unavailable."
    };
  }
};
