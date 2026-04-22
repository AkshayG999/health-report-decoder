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
  ExternalLink,
  Download
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { reportProcessor } from "@/src/lib/reportGraph";
import { downloadReportSummaryPdf, getAllReports, getReportById, saveReport as saveReportToAPI, SavedReport, updateReportAnalysis } from "@/src/lib/api";

interface ReportResult {
  simplifiedReport?: string;
  recommendations?: string[];
  insights?: string;
  resources?: { title: string; url: string }[];
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "processing" | "result" | "history">("upload");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

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

    let reportId: string | null = null;

    try {
      // STEP 1: Save report to database FIRST (before AI processing)
      try {
        const saveResponse = await saveReportToAPI({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          language: language,
        });
        reportId = saveResponse.reportId;
        console.log('✅ Report saved to database with ID:', reportId);
      } catch (saveError) {
        console.error('❌ Failed to save report to database:', saveError);
        throw new Error('Could not connect to the report database API. Please start the backend server and try again.');
      }

      // STEP 2: Process report with AI
      const base64Data = await fileToBase64(file);
      
      // Update status to processing
      if (reportId) {
        await updateReportAnalysis(reportId, { status: 'processing' });
      }

      const stream = await reportProcessor.stream({
        fileData: base64Data,
        mimeType: file.type,
        language: language,
      }, { streamMode: "updates" });

      let currentResult: ReportResult = {};
      let rawExtraction = "";

      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const data = chunk[nodeName];

        if (nodeName === "extract") {
          rawExtraction = data.rawExtraction;
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

      // STEP 3: Update database with AI analysis results
      if (reportId) {
        try {
          await updateReportAnalysis(reportId, {
            status: 'completed',
            rawExtraction: rawExtraction,
            simplifiedReport: currentResult.simplifiedReport,
            recommendations: currentResult.recommendations,
            insights: currentResult.insights,
            resources: currentResult.resources,
          });
          console.log('✅ Report analysis saved to database');
        } catch (updateError) {
          console.error('❌ Failed to update report analysis:', updateError);
        }
      }
    } catch (err) {
      console.error("Processing error:", err);
      
      // Update status to failed if we have a report ID
      if (reportId) {
        try {
          await updateReportAnalysis(reportId, {
            status: 'failed',
            errorMessage: err instanceof Error ? err.message : 'Unknown error occurred'
          });
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }
      }
      
      setError(err instanceof Error ? err.message : "Failed to process the report. Please ensure the file is clear and try again.");
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

  const loadReports = async () => {
    setHistoryLoading(true);
    setError(null);

    try {
      const response = await getAllReports();
      setReports(response.reports);
      setStep("history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved reports. Please start the backend server and try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openSavedReport = async (reportId: string) => {
    setHistoryLoading(true);
    setError(null);

    try {
      const response = await getReportById(reportId);
      const report = response.report;
      setResult({
        simplifiedReport: report.simplifiedReport,
        recommendations: report.recommendations,
        insights: report.insights,
        resources: report.resources,
      });
      setLanguage(report.language);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open this report.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const exportReportSummary = async () => {
    if (!result?.simplifiedReport) return;

    setPdfExporting(true);
    setError(null);

    try {
      const pdfBlob = await downloadReportSummaryPdf({
        language,
        summary: result.simplifiedReport,
        insights: result.insights,
        recommendations: result.recommendations,
      });

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      link.href = downloadUrl;
      link.download = `medinsight-report-summary-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export report summary as PDF.");
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-900 font-sans selection:bg-teal-100">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Activity size={24} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">
              MedInsight AI
            </h1>
          </motion.div>
          
          <AnimatePresence>
            {step === "upload" && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={loadReports}
                disabled={historyLoading}
                className="px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-lg flex items-center gap-2 transition-all border border-teal-100 disabled:opacity-50"
              >
                {historyLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                Saved Reports
              </motion.button>
            )}
            {(step === "result" || step === "history") && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={reset}
                className="px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 rounded-lg flex items-center gap-2 transition-all border border-teal-100"
              >
                <RefreshCcw size={14} />
                New Analysis
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-10 relative z-10">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <section className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6 sm:p-8 border-b border-slate-200">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider mb-5 border border-teal-100">
                      <Activity size={14} />
                      AI report analysis
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                      Upload a medical report
                    </h2>
                    <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-8">
                      Get a simplified summary, practical recommendations, and trusted resources in the language you choose.
                    </p>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">Output language</label>
                      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                        {languages.map((lang) => (
                          <button
                            key={lang.name}
                            onClick={() => setLanguage(lang.name)}
                            className={cn(
                              "min-h-11 px-3 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2",
                              language === lang.name 
                                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200" 
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                            )}
                          >
                            <span>{lang.flag}</span>
                            <span className="truncate">{lang.native}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "group border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 min-h-44",
                        isDragActive ? "border-teal-600 bg-teal-50" : "border-slate-300 bg-[#f8fbfa] hover:border-teal-500 hover:bg-white",
                        file ? "border-emerald-500 bg-emerald-50/40" : ""
                      )}
                    >
                      <input {...getInputProps()} />

                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 min-w-0">
                        <div className={cn(
                          "w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                          file ? "bg-emerald-600 text-white" : "bg-teal-600 text-white group-hover:bg-teal-700"
                        )}>
                          {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                        </div>
                        
                        {file ? (
                          <div className="text-center sm:text-left min-w-0">
                            <p className="font-bold text-slate-900 text-xl mb-2 break-words">{file.name}</p>
                            <p className="text-sm font-semibold text-emerald-700 mb-4">
                              Ready to analyze • {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <p className="text-sm text-slate-600 leading-6">
                              Click here to choose a different file before starting analysis.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center sm:text-left">
                            <p className="font-bold text-slate-900 text-xl mb-2">
                              {isDragActive ? "Drop the report here" : "Drag and drop your report"}
                            </p>
                            <p className="text-slate-600 font-medium leading-7">
                              Or click this area to browse files from your device.
                            </p>
                            <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">PDF</span>
                              <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">JPG</span>
                              <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">PNG</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="hidden sm:flex w-11 h-11 rounded-lg border border-slate-200 bg-white items-center justify-center text-slate-400 group-hover:text-teal-700 transition-colors shrink-0">
                        <ChevronRight size={20} />
                      </div>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-700 shadow-sm"
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
                        "w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-sm",
                        !file || loading 
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                          : "bg-teal-700 text-white hover:bg-teal-800"
                      )}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                          Start Analysis
                          <ChevronRight size={20} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </section>

                <aside className="lg:col-span-4 space-y-4">
                  <div className="bg-[#163f3a] text-white border border-[#163f3a] rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-extrabold mb-3">What you get</h3>
                    <ul className="space-y-3 text-sm text-teal-50/90 leading-6">
                      <li className="flex gap-3"><CheckCircle2 size={18} className="text-teal-100 shrink-0 mt-0.5" /> Patient-friendly explanation</li>
                      <li className="flex gap-3"><CheckCircle2 size={18} className="text-teal-100 shrink-0 mt-0.5" /> Personalized insights</li>
                      <li className="flex gap-3"><CheckCircle2 size={18} className="text-teal-100 shrink-0 mt-0.5" /> Saved report history</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-3">Before you start</h3>
                    <p className="text-sm text-slate-600 leading-7">
                      Use a clear report image or PDF. Blurry scans can reduce extraction quality.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 text-amber-700">
                      <AlertCircle size={20} />
                      <h3 className="text-sm font-extrabold uppercase tracking-wider">Medical note</h3>
                    </div>
                    <p className="text-sm text-amber-900 leading-7">
                      This tool helps you understand reports. It does not replace advice from a qualified healthcare provider.
                    </p>
                  </div>
                </aside>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-7 font-medium">{item.desc}</p>
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

          {step === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Saved Reports</h2>
                <p className="text-slate-500 font-medium">
                  Open a completed report to view the saved summary, recommendations, and resources.
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 text-rose-700 shadow-sm"
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              {historyLoading ? (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-10 flex items-center justify-center gap-3 text-slate-500 font-bold">
                  <Loader2 className="animate-spin text-sky-600" />
                  Loading saved reports...
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => openSavedReport(report.id)}
                      className="w-full text-left bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 truncate">{report.fileName}</h3>
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {report.language} • {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          {report.errorMessage && (
                            <p className="text-sm text-rose-600 font-medium">{report.errorMessage}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border capitalize",
                            report.status === "completed" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                            report.status === "failed" && "bg-rose-50 text-rose-600 border-rose-100",
                            report.status === "processing" && "bg-sky-50 text-sky-600 border-sky-100",
                            report.status === "pending" && "bg-slate-50 text-slate-500 border-slate-100"
                          )}>
                            {report.status}
                          </span>
                          <ChevronRight size={18} className="text-slate-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-10 text-center">
                  <FileText size={36} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">No saved reports yet</h3>
                  <p className="text-sm text-slate-500 font-medium">Run an analysis first, then it will appear here.</p>
                </div>
              )}
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-700 shadow-sm"
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              {/* Result Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main Summary - Large Span */}
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-8 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Report Summary</h2>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Simplified View</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={exportReportSummary}
                          disabled={!result.simplifiedReport || pdfExporting}
                          className="min-h-10 px-4 rounded-lg text-sm font-bold bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          {pdfExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          {pdfExporting ? "Exporting..." : "Export PDF"}
                        </button>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all w-fit",
                          result.recommendations ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-teal-50 text-teal-700 border-teal-100 animate-pulse"
                        )}>
                          {result.recommendations ? (
                            <><CheckCircle2 size={14} /> Analysis Complete</>
                          ) : (
                            <><Loader2 size={14} className="animate-spin" /> Processing...</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="markdown-content text-base sm:text-[17px] leading-8">
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
                <div className="lg:col-span-4 space-y-6">
                  <motion.section 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#163f3a] rounded-lg p-6 text-white shadow-sm"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6">
                      <Stethoscope size={24} className="text-teal-100" />
                    </div>
                    <h3 className="text-xl font-extrabold mb-4 tracking-tight">Doctor's Visit Prep</h3>
                    <p className="text-teal-50/80 text-sm font-medium mb-6 leading-relaxed">
                      Key questions to discuss with your healthcare provider based on this report:
                    </p>
                    <ul className="space-y-3">
                      {[
                        "What do these specific values mean for my long-term health?",
                        "Are there lifestyle changes that can improve these results?",
                        "When should I schedule a follow-up test?"
                      ].map((q, i) => (
                        <motion.li 
                          key={i} 
                          whileHover={{ x: 5 }}
                          className="flex gap-3 text-sm bg-white/8 p-4 rounded-lg border border-white/10 hover:bg-white/12 transition-colors cursor-default"
                        >
                          <ChevronRight size={18} className="shrink-0 text-teal-100 mt-0.5" />
                          <span className="font-medium leading-6">{q}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.section>

                  <motion.section 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4 text-slate-500">
                      <AlertCircle size={20} />
                      <h4 className="font-bold text-sm uppercase tracking-widest">Medical Disclaimer</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-6 font-medium">
                      This analysis is generated by AI for informational purposes only. It is not a medical diagnosis or professional medical advice. Always consult with a qualified healthcare provider.
                    </p>
                  </motion.section>
                </div>

                {/* Insights - Full Width */}
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-12 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                            <Lightbulb size={28} />
                          </div>
                          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personalized Insights</h2>
                        </div>
                      </div>
                      
                      {result.insights ? (
                        <blockquote className="insight-markdown text-lg sm:text-xl font-bold text-slate-800 leading-8 mb-8 border-l-4 border-teal-600 pl-5">
                          <Markdown>{result.insights}</Markdown>
                        </blockquote>
                      ) : (
                        <div className="h-12 bg-slate-100 rounded w-full animate-pulse mb-8"></div>
                      )}

                      <div className="grid grid-cols-1 gap-4">
                        {result.recommendations ? (
                          result.recommendations.map((rec, i) => (
                            <motion.div 
                              key={i} 
                              whileHover={{ y: -2 }}
                              className="flex gap-4 p-5 sm:p-6 rounded-lg bg-[#f8fbfa] border border-slate-200 shadow-sm hover:shadow-md transition-all min-w-0"
                            >
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-xs font-black text-teal-700">
                                {i + 1}
                              </div>
                              <div className="recommendation-markdown min-w-0 flex-1 text-slate-700 font-medium leading-7 break-words">
                                <Markdown>{rec}</Markdown>
                              </div>
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
                  className="lg:col-span-12 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
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
                          className="flex items-center justify-between gap-4 p-5 rounded-lg border border-slate-200 bg-[#f8fbfa] hover:bg-white hover:border-teal-200 hover:shadow-md transition-all group"
                        >
                          <span className="font-bold text-slate-700 group-hover:text-teal-700 transition-colors leading-6">{resource.title}</span>
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-teal-700 group-hover:bg-teal-50 transition-all shadow-sm shrink-0">
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
