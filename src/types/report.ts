export interface ReportResult {
  simplifiedReport?: string;
  recommendations?: string[];
  insights?: string;
  resources?: { title: string; url: string }[];
}

export interface LanguageOption {
  name: string;
  native: string;
  flag: string;
}
