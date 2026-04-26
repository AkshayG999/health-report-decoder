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
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-400 text-xs font-black text-primary-50">
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
      className="space-y-5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <section className="bg-white border border-primary-100 rounded-lg shadow-sm overflow-hidden">
          <div className="relative min-h-36 p-5 sm:p-6 border-b border-primary-100 overflow-hidden bg-gradient-to-br from-white to-primary-50/60">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl sm:text-[30px] font-extrabold text-ink mb-2 tracking-tight leading-tight">
                Upload a medical report
              </h2>
              <p className="text-clay text-sm leading-6 max-w-xl">
                Get a simplified summary, practical recommendations, and trusted resources in the language you choose.
              </p>
            </div>

            <div className="absolute right-6 top-4 hidden lg:block h-32 w-44">
              <div className="absolute right-0 top-2 h-32 w-32 rounded-full bg-accent-50"></div>
              <div className="absolute right-7 top-6 h-24 w-24 rotate-[-2deg] rounded-lg border border-primary-100 bg-white shadow-md"></div>
              <div className="absolute right-12 top-0 h-28 w-24 rotate-[-1deg] rounded-lg border border-primary-100 bg-white shadow-lg">
                <div className="mx-auto mt-4 h-1 w-7 rounded-full bg-primary-100"></div>
                <div className="mx-auto mt-4 h-1.5 w-14 rounded-full bg-primary-50"></div>
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-primary-50"></div>
                <div className="mx-auto mt-6 flex h-11 w-16 items-center justify-center rounded-lg bg-primary-400 text-primary-50">
                  <Upload size={22} />
                </div>
              </div>
              <span className="absolute left-0 top-14 text-accent-200">+</span>
              <span className="absolute right-2 bottom-8 text-primary-400">+</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-primary-100 bg-primary-50/70 p-2.5">
              <div className="flex items-center gap-3 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-ink">Output language</h3>
                  <p className="text-xs font-medium text-clay">Choose how results are written</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-white p-1 border border-primary-100 shadow-sm w-full sm:w-auto">
                {languages.map((lang) => {
                  const selected = language === lang.name;

                  return (
                    <button
                      key={lang.name}
                      type="button"
                      onClick={() => onLanguageChange(lang.name)}
                      className={cn(
                        "h-8 min-w-0 sm:min-w-24 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 px-2.5",
                        selected
                          ? "bg-primary-400 text-primary-50 shadow-sm"
                          : "text-cocoa hover:bg-primary-50 hover:text-primary-600"
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{languageLabels[lang.name] || lang.native}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-extrabold text-ink">Upload your report</h3>
              </div>
              <div
                {...getRootProps()}
                className={cn(
                  "min-h-44 rounded-lg border-2 border-dashed p-5 flex flex-col items-center justify-center text-center transition-all",
                  isDragActive ? "border-primary-400 bg-primary-50" : "border-primary-200 bg-white",
                  file && "border-emerald-500 bg-emerald-50/40"
                )}
              >
                <input {...getInputProps()} />
                <div className={cn(
                  "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                  file ? "bg-emerald-600 text-white" : "bg-primary-50 text-primary-600"
                )}>
                  {file ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                </div>
                {file ? (
                  <>
                    <p className="max-w-lg text-base font-extrabold text-ink break-words">{file.name}</p>
                    <p className="mt-2 text-sm font-bold text-emerald-700">{(file.size / 1024 / 1024).toFixed(2)} MB ready to analyze</p>
                    <button type="button" onClick={open} className="mt-3 h-9 px-4 rounded-md bg-white border border-primary-100 text-xs font-bold text-primary-600 hover:bg-primary-50 transition-colors">
                      Choose Different File
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-extrabold text-ink">Drag and drop your report here</p>
                    <p className="mt-1 text-xs text-clay">or click to browse files from your device</p>
                    <p className="mt-2 text-xs text-clay">Supported formats: PDF, JPG, PNG &nbsp;-&nbsp; Max size: 25MB</p>
                    <button type="button" onClick={open} className="mt-3 h-9 px-5 rounded-md bg-primary-400 text-primary-50 text-xs font-bold hover:bg-primary-600 transition-colors flex items-center gap-2">
                      <FolderOpen size={14} />
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
                "h-11 w-full rounded-md text-sm font-extrabold transition-all flex items-center justify-center gap-3 border",
                !file || loading
                  ? "border-primary-100 bg-primary-50 text-primary-100 cursor-not-allowed"
                  : "border-primary-400 bg-primary-400 text-primary-50 hover:bg-primary-600"
              )}
            >
              {loading ? "Starting analysis..." : "Start Analysis"}
              <ArrowRight size={18} />
            </button>

            <p className="flex items-center justify-center gap-2 text-[11px] text-clay">
              <Lock size={15} />
              Your files are secure and private. We never share your data.
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg bg-primary-800 text-primary-50 p-5 shadow-sm">
            <h3 className="text-lg font-extrabold mb-4">What you get</h3>
            <div className="space-y-4">
              {[
                { icon: <Stethoscope size={18} />, title: "Patient-friendly explanation", desc: "We simplify complex medical terms." },
                { icon: <Sparkles size={18} />, title: "Personalized insights", desc: "Relevant insights tailored to your report." },
                { icon: <FileText size={18} />, title: "Saved report history", desc: "Access and download your past reports anytime." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-200/25 text-accent-50">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold leading-5">{item.title}</h4>
                    <p className="text-xs leading-5 text-primary-50/75">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white border border-primary-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3 text-primary-600">
              <Lightbulb size={20} />
              <h3 className="text-base font-extrabold text-primary-800">Before you start</h3>
            </div>
            <p className="text-xs text-clay leading-5">Use a clear report image or PDF. Blurry scans can reduce extraction quality and accuracy.</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-14 w-14 rounded-lg border border-primary-50 bg-primary-50 blur-[1px]"></div>
              <ArrowRight size={18} className="text-primary-600" />
              <div className="relative h-14 w-14 rounded-lg border border-primary-100 bg-white">
                <div className="mx-auto mt-5 h-1.5 w-12 rounded-full bg-primary-100"></div>
                <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-primary-100"></div>
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-primary-100"></div>
                <div className="absolute -right-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-400 text-primary-50">
                  <Check size={16} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white border border-primary-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3 text-primary-600">
              <Headphones size={20} />
              <h3 className="text-base font-extrabold text-primary-800">Need help?</h3>
            </div>
            <p className="text-xs text-clay leading-5 mb-3">Check out our guides or contact support.</p>
            <button type="button" className="h-9 w-full rounded-md border border-primary-100 text-xs font-extrabold text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
              View Resources
              <ArrowRight size={16} />
            </button>
          </section>
        </aside>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg bg-white border border-primary-100 p-4 shadow-sm">
        {[
          { icon: <Stethoscope size={36} />, title: "Simplified Jargon", desc: "We break down complex medical terms into plain language you can actually understand." },
          { icon: <Lightbulb size={36} />, title: "Actionable Insights", desc: "Get personalized recommendations and specific questions to ask your healthcare provider." },
          { icon: <ShieldCheck size={36} />, title: "Secure & Private", desc: "Your sensitive medical data is processed securely and never shared." },
        ].map((item) => (
          <div key={item.title} className="grid grid-cols-[64px_1fr] gap-3 items-start p-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-ink mb-1.5">{item.title}</h3>
              <p className="text-xs leading-5 text-clay mb-2.5">{item.desc}</p>
              <button type="button" className="text-xs font-extrabold text-primary-600 inline-flex items-center gap-1.5">
                Learn more <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
