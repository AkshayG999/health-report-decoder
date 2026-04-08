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
  simplifiedReport?: string;
  recommendations?: string[];
  insights?: string;
  resources?: { title: string; url: string }[];
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "processing" | "result">("upload");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");
  const [processingStatus, setProcessingStatus] = useState<string>("");

  const languages = [
    { name: "English", native: "English", flag: "🇬🇧" },
    { name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    { name: "Marathi", native: "मराठी", flag: "🇮🇳" }
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
      
      const stream = await reportProcessor.stream({
        fileData: base64Data,
        mimeType: file.type,
        language: language,
      }, { streamMode: "updates" });

      let currentResult: ReportResult = {};

      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const data = chunk[nodeName];

        if (nodeName === "extract") {
          setProcessingStatus("Simplifying medical terms...");
        } else if (nodeName === "simplify") {
          currentResult = { ...currentResult, simplifiedReport: data.simplifiedReport };
          setResult(currentResult);
          setStep("result"); // Transition to result screen as soon as summary is ready
          setProcessingStatus("Generating recommendations...");
        } else if (nodeName === "recommend") {
          currentResult = { 
            ...currentResult, 
            recommendations: data.recommendations,
            insights: data.insights,
            resources: data.resources
          };
          setResult(currentResult);
          setProcessingStatus("");
        }
      }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sky-100/50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[30%] bg-indigo-100/50 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <Activity size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              MedInsight AI
            </h1>
          </motion.div>
          
          <AnimatePresence>
            {step === "result" && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={reset}
                className="px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50 rounded-full flex items-center gap-2 transition-all border border-sky-100"
              >
                <RefreshCcw size={14} />
                New Analysis
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold uppercase tracking-wider mb-6 border border-sky-100"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  AI-Powered Analysis
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Understand your health <br /> 
                  <span className="text-sky-600">with clarity.</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                  Upload your medical reports and let our AI translate complex jargon into actionable insights.
                </p>
              </div>

              {/* Language Selector */}
              <div className="mb-10 flex flex-col items-center">
                <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl border border-slate-200/60">
                  {languages.map((lang) => (
                    <button
                      key={lang.name}
                      onClick={() => setLanguage(lang.name)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                        language === lang.name 
                          ? "bg-white text-sky-600 shadow-md ring-1 ring-slate-200/50" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      )}
                    >
                      <span>{lang.flag}</span>
                      {lang.native}
                    </button>
                  ))}
                </div>
              </div>

              <div 
                {...getRootProps()} 
                className={cn(
                  "relative group border-2 border-dashed rounded-[2.5rem] p-16 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-6 overflow-hidden hover:scale-[1.01] active:scale-[0.99]",
                  isDragActive ? "border-sky-500 bg-sky-50/50" : "border-slate-200 bg-white hover:border-sky-400 hover:shadow-2xl hover:shadow-sky-100",
                  file ? "border-emerald-500 bg-emerald-50/30" : ""
                )}
              >
                <input {...getInputProps()} />
                
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl relative z-10",
                  file ? "bg-emerald-500 text-white rotate-12" : "bg-sky-600 text-white group-hover:scale-110 group-hover:rotate-3"
                )}>
                  {file ? <CheckCircle2 size={40} /> : <Upload size={40} />}
                </div>
                
                {file ? (
                  <div className="text-center relative z-10">
                    <p className="font-bold text-slate-800 text-xl mb-1">{file.name}</p>
                    <p className="text-sm font-medium text-slate-400">Ready to analyze • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center relative z-10">
                    <p className="font-bold text-slate-800 text-2xl mb-2">
                      {isDragActive ? "Drop it here" : "Upload your report"}
                    </p>
                    <p className="text-slate-400 font-medium">Drag & drop or click to browse files</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">PDF</span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">JPG</span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">PNG</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 text-rose-700 shadow-sm"
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              <motion.button
                disabled={!file || loading}
                onClick={processReport}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full mt-10 py-5 rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-2xl",
                  !file || loading 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                )}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    Start Analysis
                    <ChevronRight size={20} />
                  </>
                )}
              </motion.button>
              
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: <Stethoscope size={24} />, title: "Simplified Jargon", desc: "We break down complex medical terms into plain language you can actually understand." },
                  { icon: <Lightbulb size={24} />, title: "Actionable Insights", desc: "Get personalized recommendations and specific questions to ask your healthcare provider." },
                  { icon: <FileText size={24} />, title: "Secure & Private", desc: "Your sensitive medical data is processed with high security and never stored permanently." }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-sky-600 flex items-center justify-center mb-5">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                  </motion.div>
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
              className="max-w-md mx-auto text-center py-24"
            >
              <div className="relative w-32 h-32 mx-auto mb-10">
                <div className="absolute inset-0 border-4 border-sky-100 rounded-[2.5rem] rotate-45"></div>
                <div className="absolute inset-0 border-4 border-sky-600 rounded-[2.5rem] border-t-transparent animate-spin rotate-45"></div>
                <div className="absolute inset-0 flex items-center justify-center text-sky-600 animate-float">
                  <Activity size={48} />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                {processingStatus || "AI is Thinking..."}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                We're extracting measurements and translating medical terminology for you.
              </p>
              
              <div className="mt-12 space-y-4 max-w-xs mx-auto">
                {[
                  "Scanning report structure...",
                  "Identifying key findings...",
                  "Simplifying medical terms...",
                  "Preparing recommendations..."
                ].map((text, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="flex items-center gap-4 text-left text-sm font-bold text-slate-400"
                  >
                    <div className="w-2 h-2 rounded-full bg-sky-500 shadow-lg shadow-sky-200"></div>
                    {text}
                  </motion.div>
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
              {/* Result Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Main Summary - Large Span */}
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl shadow-inner">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Report Summary</h2>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Simplified View</p>
                        </div>
                      </div>
                      <div className={cn(
                        "hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all",
                        result.recommendations ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-sky-50 text-sky-600 border-sky-100 animate-pulse"
                      )}>
                        {result.recommendations ? (
                          <><CheckCircle2 size={14} /> Analysis Complete</>
                        ) : (
                          <><Loader2 size={14} className="animate-spin" /> Processing...</>
                        )}
                      </div>
                    </div>
                    
                    <div className="markdown-content">
                      {result.simplifiedReport ? (
                        <Markdown>{result.simplifiedReport}</Markdown>
                      ) : (
                        <div className="space-y-4">
                          <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                          <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </motion.section>

                {/* Sidebar - Prep & Disclaimer */}
                <div className="lg:col-span-4 space-y-8">
                  <motion.section 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-300"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                      <Stethoscope size={24} className="text-sky-400" />
                    </div>
                    <h3 className="text-xl font-extrabold mb-4 tracking-tight">Doctor's Visit Prep</h3>
                    <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                      Key questions to discuss with your healthcare provider based on this report:
                    </p>
                    <ul className="space-y-4">
                      {[
                        "What do these specific values mean for my long-term health?",
                        "Are there lifestyle changes that can improve these results?",
                        "When should I schedule a follow-up test?"
                      ].map((q, i) => (
                        <motion.li 
                          key={i} 
                          whileHover={{ x: 5 }}
                          className="flex gap-4 text-sm bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-default"
                        >
                          <ChevronRight size={18} className="shrink-0 text-sky-400" />
                          <span className="font-medium leading-snug">{q}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.section>

                  <motion.section 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                      <AlertCircle size={20} />
                      <h4 className="font-bold text-sm uppercase tracking-widest">Medical Disclaimer</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      This analysis is generated by AI for informational purposes only. It is not a medical diagnosis or professional medical advice. Always consult with a qualified healthcare provider.
                    </p>
                  </motion.section>
                </div>

                {/* Insights - Full Width */}
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-12 bg-gradient-to-br from-white to-sky-50/30 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-inner">
                          <Lightbulb size={28} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personalized Insights</h2>
                      </div>
                      
                      {result.insights ? (
                        <blockquote className="text-xl font-bold text-slate-800 leading-relaxed mb-8 italic border-l-4 border-sky-500 pl-6">
                          "{result.insights}"
                        </blockquote>
                      ) : (
                        <div className="h-12 bg-slate-100 rounded w-full animate-pulse mb-8"></div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.recommendations ? (
                          result.recommendations.map((rec, i) => (
                            <motion.div 
                              key={i} 
                              whileHover={{ y: -2 }}
                              className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="shrink-0 w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-xs font-black text-sky-600">
                                {i + 1}
                              </div>
                              <p className="text-slate-700 font-medium leading-relaxed">{rec}</p>
                            </motion.div>
                          ))
                        ) : (
                          [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Resources - Full Width */}
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="lg:col-span-12 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                      <ExternalLink size={28} />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trusted Resources</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.resources ? (
                      result.resources.map((resource, i) => (
                        <motion.a 
                          key={i} 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          whileHover={{ y: -5, scale: 1.02 }}
                          className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-100 transition-all group"
                        >
                          <span className="font-bold text-slate-700 group-hover:text-sky-600 transition-colors">{resource.title}</span>
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all shadow-sm">
                            <ExternalLink size={18} />
                          </div>
                        </motion.a>
                      ))
                    ) : (
                      [1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse"></div>
                      ))
                    )}
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200/60 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
          <Activity size={18} className="text-sky-600" />
          <span className="font-bold tracking-widest text-[10px] uppercase">MedInsight AI Engine</span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          © 2026 MedInsight AI • Powered by Gemini & LangGraph
        </p>
      </footer>
    </div>
  );
}
