import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "motion/react";
import { Activity, AlertCircle, CheckCircle2, ChevronRight, FileText, Lightbulb, Stethoscope, Upload } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { LanguageOption } from "@/src/types/report";

interface UploadPageProps {
  file: File | null;
  loading: boolean;
  error: string | null;
  language: string;
  languages: LanguageOption[];
  onFileSelected: (file: File) => void;
  onLanguageChange: (language: string) => void;
  onProcessReport: () => void;
}

export function UploadPage({
  file,
  loading,
  error,
  language,
  languages,
  onFileSelected,
  onLanguageChange,
  onProcessReport,
}: UploadPageProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    multiple: false,
  });

  return (
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
                    onClick={() => onLanguageChange(lang.name)}
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
                      Ready to analyze - {(file.size / 1024 / 1024).toFixed(2)} MB
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
                      {["PDF", "JPG", "PNG"].map((type) => (
                        <span key={type} className="px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                          {type}
                        </span>
                      ))}
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
              onClick={onProcessReport}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-sm",
                !file || loading ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-teal-700 text-white hover:bg-teal-800"
              )}
            >
              {loading ? "Processing..." : (
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
            <p className="text-sm text-slate-600 leading-7">Use a clear report image or PDF. Blurry scans can reduce extraction quality.</p>
          </div>
        </aside>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Stethoscope size={24} />, title: "Simplified Jargon", desc: "We break down complex medical terms into plain language you can actually understand." },
          { icon: <Lightbulb size={24} />, title: "Actionable Insights", desc: "Get personalized recommendations and specific questions to ask your healthcare provider." },
          { icon: <FileText size={24} />, title: "Secure & Private", desc: "Your sensitive medical data is processed securely." }
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">{item.icon}</div>
            <h3 className="font-bold text-slate-800 text-lg mb-2 tracking-tight">{item.title}</h3>
            <p className="text-sm text-slate-600 leading-7 font-medium">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
