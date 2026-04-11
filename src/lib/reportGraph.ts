import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";

// Define the state for our graph
const ReportState = Annotation.Root({
  fileData: Annotation<string>(), // Base64 encoded file
  mimeType: Annotation<string>(),
  language: Annotation<string>(), // Preferred language (English, Hindi, Marathi)
  rawExtraction: Annotation<string>(),
  simplifiedReport: Annotation<string>(),
  recommendations: Annotation<string[]>(),
  resources: Annotation<{ title: string; url: string }[]>(),
  insights: Annotation<string>(),
  error: Annotation<string | null>(),
});

type ReportStateType = typeof ReportState.State;

// Initialize the model
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-3-flash-preview",
    maxOutputTokens: 2048,
  });
};

// Node 1: Extract information
const extractNode = async (state: ReportStateType) => {
  const model = getModel();
  
  const prompt = `You are a medical data extraction expert. 
  Extract all relevant information from this medical report. 
  Include: 
  - Patient demographics (if available)
  - Date of report
  - Type of report (Lab, MRI, X-Ray, etc.)
  - Key findings and measurements
  - Reference ranges and abnormal values
  - Doctor's impressions/conclusions.
  
  Be precise and thorough. The extraction should be in English for internal processing.`;

  const response = await model.invoke([
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "media",
          mimeType: state.mimeType,
          data: state.fileData,
        },
      ],
    },
  ]);

  return { rawExtraction: response.content as string };
};

// Node 2: Simplify and provide insights
const simplifyNode = async (state: ReportStateType) => {
  const model = getModel();
  
  const prompt = `You are a compassionate medical communicator. 
  Based on the following raw extraction from a medical report, create a "Patient-Friendly Summary" in ${state.language || 'English'}.
  
  Requirements:
  1. Use simple, non-medical language.
  2. Explain what the findings mean in plain ${state.language || 'English'}.
  3. Highlight what is normal and what might need attention.
  4. Provide a "Key Takeaway" section.
  5. Ensure the tone is empathetic and clear.
  
  Raw Data:
  ${state.rawExtraction}`;

  const response = await model.invoke(prompt);
  
  return { simplifiedReport: response.content as string };
};

// Node 3: Generate recommendations
const recommendNode = async (state: ReportStateType) => {
  const model = getModel();
  
  const prompt = `Based on the medical report findings below, generate 3-5 personalized health recommendations and insights in ${state.language || 'English'}.
  
  Guidelines:
  - Focus on lifestyle, diet, or follow-up questions for their doctor.
  - Be cautious and always include a disclaimer that this is AI-generated and not medical advice.
  - Suggest specific questions the patient should ask their healthcare provider.
  - Output should be in ${state.language || 'English'}.
  
  Findings:
  ${state.rawExtraction}
  
  Format the output as a list of strings, one per line, starting with a bullet point or number.`;

  const response = await model.invoke(prompt);
  
  const parseRecommendations = (content: string) => {
    const normalized = content
      .replace(/\r\n/g, "\n")
      .replace(/(?<!^)\s+(\d+\.\s+)/g, "\n$1")
      .replace(/(?<!^)\s+([•-]\s+)/g, "\n$1");

    return normalized
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("-") || line.match(/^\d+\./) || line.startsWith("•"))
      .map(line => line.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  };

  const lines = parseRecommendations(response.content as string);

  const insightsPrompt = `Based on the findings, provide a one-sentence encouraging insight in ${state.language || 'English'}.
  
  Findings: ${state.rawExtraction}`;
  
  const insightsResponse = await model.invoke(insightsPrompt);

  const resourcesPrompt = `Based on the medical report findings below, provide 2-3 links to reputable health resources (like Mayo Clinic, NIH, or Cleveland Clinic) that provide more information about the conditions or tests mentioned.
  
  Findings: ${state.rawExtraction}
  
  Format the output as a JSON array of objects with "title" and "url" keys. Only return the JSON.`;

  const resourcesResponse = await model.invoke(resourcesPrompt);
  let resources = [];
  try {
    const content = resourcesResponse.content as string;
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      resources = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse resources JSON:", e);
  }

  return { 
    recommendations: lines.length > 0 ? lines : [response.content as string],
    insights: insightsResponse.content as string,
    resources: resources
  };
};

// Build the graph
const workflow = new StateGraph(ReportState)
  .addNode("extract", extractNode)
  .addNode("simplify", simplifyNode)
  .addNode("recommend", recommendNode)
  .addEdge("__start__", "extract")
  .addEdge("extract", "simplify")
  .addEdge("simplify", "recommend")
  .addEdge("recommend", END);

export const reportProcessor = workflow.compile();
