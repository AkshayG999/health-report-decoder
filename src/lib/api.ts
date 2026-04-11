const API_BASE_URL = 'http://localhost:3001/api';

async function parseAPIResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload && typeof payload.error === 'string' ? payload.error : fallbackMessage;
    throw new Error(message);
  }

  return payload as T;
}

export interface ReportData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  language: string;
  fileData?: string;
}

export interface ReportAnalysisData {
  status: 'processing' | 'completed' | 'failed';
  rawExtraction?: string;
  simplifiedReport?: string;
  recommendations?: string[];
  insights?: string;
  resources?: { title: string; url: string }[];
  errorMessage?: string;
}

export interface SavedReport {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  language: string;
  rawExtraction?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  simplifiedReport?: string;
  recommendations?: string[];
  insights?: string;
  resources?: { title: string; url: string }[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedReportAPIResponse extends Omit<SavedReport, 'recommendations' | 'resources'> {
  recommendations?: string | string[];
  resources?: string | { title: string; url: string }[];
}

// Save initial report to the database (before AI processing)
export async function saveReport(data: ReportData): Promise<{ success: boolean; reportId: string }> {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseAPIResponse(response, 'Failed to save report');
}

// Update report with AI analysis results
export async function updateReportAnalysis(reportId: string, data: ReportAnalysisData): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/analysis`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseAPIResponse(response, 'Failed to update report analysis');
}

function parseJsonField<T>(value: string | T | undefined, fallback: T): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value || JSON.stringify(fallback)) as T;
  } catch {
    return fallback;
  }
}

function parseSavedReport(report: SavedReportAPIResponse): SavedReport {
  return {
    ...report,
    recommendations: parseJsonField(report.recommendations, [] as string[]),
    resources: parseJsonField(report.resources, [] as { title: string; url: string }[]),
  };
}

// Get all reports from the database
export async function getAllReports(): Promise<{ success: boolean; reports: SavedReport[] }> {
  const response = await fetch(`${API_BASE_URL}/reports`);
  const payload = await parseAPIResponse<{ success: boolean; reports: SavedReportAPIResponse[] }>(
    response,
    'Failed to fetch reports'
  );

  return {
    ...payload,
    reports: payload.reports.map(parseSavedReport),
  };
}

// Get a specific report by ID
export async function getReportById(id: string): Promise<{ success: boolean; report: SavedReport }> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}`);
  const payload = await parseAPIResponse<{ success: boolean; report: SavedReportAPIResponse }>(
    response,
    'Failed to fetch report'
  );

  return {
    ...payload,
    report: parseSavedReport(payload.report),
  };
}

// Check if the backend server is running
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
