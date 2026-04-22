import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  FolderOpen,
  Headphones,
  Lightbulb,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
} from "lucide-react";
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

const languageLabels: Record<string, string> = {
  English: "English",
  Hindi: "हिंदी",
  Marathi: "मराठी",
};

function StepBadge({ value }: { value: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white">
      {value}
    </span>
  );
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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    multiple: false,
    noClick: true,
  });

  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-6 items-start">
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="relative min-h-40 p-6 sm:p-7 border-b border-slate-200 overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl sm:text-[32px] font-extrabold text-slate-950 mb-3 tracking-tight leading-tight">
                Upload a medical report
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-7 max-w-xl">
                Get a simplified summary, practical recommendations, and trusted resources in the language you choose.
              </p>
            </div>

            <div className="absolute right-6 top-5 hidden md:block h-36 w-48">
              <div className="absolute right-0 top-2 h-32 w-32 rounded-full bg-teal-50"></div>
              <div className="absolute right-7 top-6 h-24 w-24 rotate-[-2deg] rounded-lg border border-slate-200 bg-white shadow-md"></div>
              <div className="absolute right-12 top-0 h-28 w-24 rotate-[-1deg] rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="mx-auto mt-4 h-1 w-7 rounded-full bg-slate-300"></div>
                <div className="mx-auto mt-4 h-1.5 w-14 rounded-full bg-slate-200"></div>
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-200"></div>
                <div className="mx-auto mt-6 flex h-11 w-16 items-center justify-center rounded-lg bg-teal-700 text-white">
                  <Upload size={22} />
                </div>
              </div>
              <span className="absolute left-0 top-14 text-teal-600">+</span>
              <span className="absolute right-2 bottom-8 text-teal-600">+</span>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center gap-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Output language</h3>
                  <p className="text-xs font-medium text-slate-500">Choose how results are written</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-white p-1 border border-slate-200 shadow-sm w-full sm:w-auto">
                {languages.map((lang) => {
                  const selected = language === lang.name;

                  return (
                    <button
                      key={lang.name}
                      type="button"
                      onClick={() => onLanguageChange(lang.name)}
                      className={cn(
                        "h-9 min-w-0 sm:min-w-28 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 px-3",
                        selected
                          ? "bg-teal-700 text-white shadow-sm"
                          : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{languageLabels[lang.name] || lang.native}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-slate-900">Upload your report</h3>
              </div>
              <div
                {...getRootProps()}
                className={cn(
                  "min-h-56 rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all",
                  isDragActive ? "border-teal-700 bg-teal-50" : "border-teal-300 bg-white",
                  file && "border-emerald-500 bg-emerald-50/40"
                )}
              >
                <input {...getInputProps()} />
                <div className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
                  file ? "bg-emerald-600 text-white" : "bg-teal-50 text-teal-700"
                )}>
                  {file ? <CheckCircle2 size={28} /> : <Upload size={28} />}
                </div>
                {file ? (
                  <>
                    <p className="max-w-lg text-lg font-extrabold text-slate-950 break-words">{file.name}</p>
                    <p className="mt-2 text-sm font-bold text-emerald-700">{(file.size / 1024 / 1024).toFixed(2)} MB ready to analyze</p>
                    <button type="button" onClick={open} className="mt-4 h-10 px-5 rounded-md bg-white border border-slate-200 text-sm font-bold text-teal-700 hover:bg-teal-50 transition-colors">
                      Choose Different File
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-base font-extrabold text-slate-950">Drag and drop your report here</p>
                    <p className="mt-1 text-sm text-slate-500">or click to browse files from your device</p>
                    <p className="mt-3 text-xs text-slate-500">Supported formats: PDF, JPG, PNG &nbsp;-&nbsp; Max size: 25MB</p>
                    <button type="button" onClick={open} className="mt-4 h-10 px-6 rounded-md bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition-colors flex items-center gap-2">
                      <FolderOpen size={16} />
                      Browse Files
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!file || loading}
              onClick={onProcessReport}
              className={cn(
                "h-12 w-full rounded-md text-sm font-extrabold transition-all flex items-center justify-center gap-3 border",
                !file || loading
                  ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                  : "border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
              )}
            >
              {loading ? "Starting analysis..." : "Start Analysis"}
              <ArrowRight size={18} />
            </button>

            <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock size={15} />
              Your files are secure and private. We never share your data.
            </p>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg bg-[#064f46] text-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold mb-5">What you get</h3>
            <div className="space-y-5">
              {[
                { icon: <Stethoscope size={18} />, title: "Patient-friendly explanation", desc: "We simplify complex medical terms." },
                { icon: <Sparkles size={18} />, title: "Personalized insights", desc: "Relevant insights tailored to your report." },
                { icon: <FileText size={18} />, title: "Saved report history", desc: "Access and download your past reports anytime." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/40 text-teal-50">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold leading-5">{item.title}</h4>
                    <p className="text-xs leading-5 text-teal-50/75">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-teal-700">
              <Lightbulb size={22} />
              <h3 className="text-lg font-extrabold text-teal-800">Before you start</h3>
            </div>
            <p className="text-sm text-slate-500 leading-6">Use a clear report image or PDF. Blurry scans can reduce extraction quality and accuracy.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-lg border border-slate-100 bg-slate-50 blur-[1px]"></div>
              <ArrowRight size={20} className="text-teal-700" />
              <div className="relative h-16 w-16 rounded-lg border border-slate-200 bg-white">
                <div className="mx-auto mt-5 h-1.5 w-12 rounded-full bg-slate-300"></div>
                <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-slate-300"></div>
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-300"></div>
                <div className="absolute -right-3 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white">
                  <Check size={18} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-teal-700">
              <Headphones size={22} />
              <h3 className="text-lg font-extrabold text-teal-800">Need help?</h3>
            </div>
            <p className="text-sm text-slate-500 leading-6 mb-4">Check out our guides or contact support.</p>
            <button type="button" className="h-10 w-full rounded-md border border-teal-100 text-sm font-extrabold text-teal-700 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
              View Resources
              <ArrowRight size={16} />
            </button>
          </section>
        </aside>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg bg-white border border-slate-200 p-5 shadow-sm">
        {[
          { icon: <Stethoscope size={36} />, title: "Simplified Jargon", desc: "We break down complex medical terms into plain language you can actually understand." },
          { icon: <Lightbulb size={36} />, title: "Actionable Insights", desc: "Get personalized recommendations and specific questions to ask your healthcare provider." },
          { icon: <ShieldCheck size={36} />, title: "Secure & Private", desc: "Your sensitive medical data is processed securely and never shared." },
        ].map((item) => (
          <div key={item.title} className="grid grid-cols-[72px_1fr] gap-4 items-start p-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              {item.icon}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-950 mb-2">{item.title}</h3>
              <p className="text-sm leading-6 text-slate-500 mb-3">{item.desc}</p>
              <button type="button" className="text-sm font-extrabold text-teal-700 inline-flex items-center gap-2">
                Learn more <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
