/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Activity, 
  Stethoscope, 
  Lightbulb,
  Loader2,
  RefreshCcw,
  ExternalLink
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { reportProcessor } from "@/src/lib/reportGraph";

interface ReportResult {
  simplifiedReport: string;
  recommendations: string[];
  insights: string;
  resources: { title: string; url: string }[];
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "processing" | "result">("upload");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");

  const languages = [
    { name: "English", native: "English" },
    { name: "Hindi", native: "हिन्दी" },
    { name: "Marathi", native: "मराठी" }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    multiple: false
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processReport = async () => {
    if (!file) return;

    setLoading(true);
    setStep("processing");
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      
      const response = await reportProcessor.invoke({
        fileData: base64Data,
        mimeType: file.type,
        language: language,
      });

      setResult({
        simplifiedReport: response.simplifiedReport,
        recommendations: response.recommendations,
        insights: response.insights,
        resources: response.resources || [],
      });
      setStep("result");
    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process the report. Please ensure the file is clear and try again.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStep("upload");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Activity size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">MedInsight AI</h1>
          </div>
          {step === "result" && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCcw size={14} />
              Analyze New Report
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Understand Your Health Reports</h2>
                <p className="text-slate-600 text-lg">
                  Upload your lab results or imaging reports. Our AI will simplify the medical jargon and provide personalized insights.
                </p>
              </div>

              {/* Language Selector */}
              <div className="mb-8 flex flex-col items-center">
                <label className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Select Preferred Language</label>
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {languages.map((lang) => (
                    <button
                      key={lang.name}
                      onClick={() => setLanguage(lang.name)}
                      className={cn(
                        "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                        language === lang.name 
                          ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>
              </div>

              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50",
                  file ? "border-green-500 bg-green-50" : ""
                )}
              >
                <input {...getInputProps()} />
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                  file ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                )}>
                  {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                </div>
                
                {file ? (
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-semibold text-slate-800 text-lg">
                      {isDragActive ? "Drop the file here" : "Click or drag report here"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Supports PDF, PNG, JPG (Max 10MB)</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                disabled={!file || loading}
                onClick={processReport}
                className={cn(
                  "w-full mt-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200",
                  !file || loading 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                )}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Analyze Report"}
              </button>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <Stethoscope size={20} />, title: "Simplified Jargon", desc: "Complex terms explained in plain English." },
                  { icon: <Lightbulb size={20} />, title: "Actionable Insights", desc: "Personalized recommendations for your health." },
                  { icon: <FileText size={20} />, title: "Secure & Private", desc: "Your data is processed securely by AI." }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="text-blue-600 mb-2">{item.icon}</div>
                    <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md mx-auto text-center py-20"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Activity size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Analyzing Your Report</h2>
              <p className="text-slate-600">
                Our AI is extracting data and simplifying medical terms. This usually takes 10-20 seconds...
              </p>
              
              <div className="mt-10 space-y-4 max-w-xs mx-auto">
                {[
                  "Extracting measurements...",
                  "Translating medical terminology...",
                  "Generating recommendations..."
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-left text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Summary */}
                <div className="lg:col-span-2 space-y-8">
                  <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">Report Summary</h2>
                    </div>
                    <div className="markdown-content text-slate-700 leading-relaxed">
                      <Markdown>{result.simplifiedReport}</Markdown>
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Lightbulb size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">Personalized Insights</h2>
                    </div>
                    <p className="text-slate-600 mb-6 italic">
                      "{result.insights}"
                    </p>
                    <div className="space-y-4">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200">
                            {i + 1}
                          </div>
                          <p className="text-slate-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {result.resources && result.resources.length > 0 && (
                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                          <ExternalLink size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Trusted Resources</h2>
                      </div>
                      <p className="text-slate-600 mb-6">
                        Learn more about your findings from these reputable health organizations:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.resources.map((resource, i) => (
                          <a 
                            key={i} 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group"
                          >
                            <span className="font-semibold text-slate-700 group-hover:text-blue-600">{resource.title}</span>
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600" />
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar / Quick Actions */}
                <div className="space-y-6">
                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Stethoscope size={20} />
                      Doctor's Visit Prep
                    </h3>
                    <p className="text-blue-100 text-sm mb-4">
                      Based on your report, here are some questions you might want to ask your doctor:
                    </p>
                    <ul className="space-y-3">
                      {[
                        "What do these specific values mean for my long-term health?",
                        "Are there lifestyle changes that can improve these results?",
                        "When should I schedule a follow-up test?"
                      ].map((q, i) => (
                        <li key={i} className="flex gap-2 text-sm bg-white/10 p-3 rounded-lg border border-white/10">
                          <ChevronRight size={16} className="shrink-0 mt-0.5" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <AlertCircle size={18} className="text-slate-500" />
                      Disclaimer
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This analysis is generated by AI for informational purposes only. It is not a medical diagnosis or professional medical advice. Always consult with a qualified healthcare provider regarding any medical condition or test results.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-400">
          © 2026 MedInsight AI. Powered by Gemini & LangGraph.
        </p>
      </footer>
    </div>
  );
}
