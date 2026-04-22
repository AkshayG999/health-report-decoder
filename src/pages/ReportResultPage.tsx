import { motion } from "motion/react";
import Markdown from "react-markdown";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Download, ExternalLink, FileText, Lightbulb, Loader2, Stethoscope } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { ReportResult } from "@/src/types/report";

interface ReportResultPageProps {
  result: ReportResult;
  error: string | null;
  source: "analysis" | "history";
  exporting: boolean;
  onBackToReports: () => void;
  onExportPdf: () => void;
}

export function ReportResultPage({ result, error, source, exporting, onBackToReports, onExportPdf }: ReportResultPageProps) {
  return (
    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-700 shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-8 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-lg"><FileText size={28} /></div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Report Summary</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Simplified View</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {source === "history" && (
                <button type="button" onClick={onBackToReports} className="h-10 px-2 rounded-md text-sm font-bold text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors flex items-center gap-1.5">
                  <ArrowLeft size={16} />
                  Saved Reports
                </button>
              )}
              <button type="button" onClick={onExportPdf} disabled={!result.simplifiedReport || exporting} className="min-h-10 px-4 rounded-lg text-sm font-bold bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all w-fit",
                result.recommendations ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-teal-50 text-teal-700 border-teal-100 animate-pulse"
              )}>
                {result.recommendations ? <><CheckCircle2 size={14} /> Analysis Complete</> : <><Loader2 size={14} className="animate-spin" /> Processing...</>}
              </div>
            </div>
          </div>

          <div className="markdown-content text-base sm:text-[17px] leading-8">
            {result.simplifiedReport ? <Markdown>{result.simplifiedReport}</Markdown> : (
              <div className="space-y-4">
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
              </div>
            )}
          </div>
        </motion.section>

        <div className="lg:col-span-4 space-y-6">
          <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#163f3a] rounded-lg p-6 text-white shadow-sm">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6">
              <Stethoscope size={24} className="text-teal-100" />
            </div>
            <h3 className="text-xl font-extrabold mb-4 tracking-tight">Doctor's Visit Prep</h3>
            <p className="text-teal-50/80 text-sm font-medium mb-6 leading-relaxed">Key questions to discuss with your healthcare provider based on this report:</p>
            <ul className="space-y-3">
              {["What do these specific values mean for my long-term health?", "Are there lifestyle changes that can improve these results?", "When should I schedule a follow-up test?"].map((q, i) => (
                <motion.li key={i} whileHover={{ x: 5 }} className="flex gap-3 text-sm bg-white/8 p-4 rounded-lg border border-white/10 hover:bg-white/12 transition-colors cursor-default">
                  <ChevronRight size={18} className="shrink-0 text-teal-100 mt-0.5" />
                  <span className="font-medium leading-6">{q}</span>
                </motion.li>
              ))}
            </ul>
          </motion.section>

          <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-slate-500">
              <AlertCircle size={20} />
              <h4 className="font-bold text-sm uppercase tracking-widest">Medical Disclaimer</h4>
            </div>
            <p className="text-sm text-slate-600 leading-6 font-medium">
              This analysis is generated by AI for informational purposes only. It is not a medical diagnosis or professional medical advice. Always consult with a qualified healthcare provider.
            </p>
          </motion.section>
        </div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-12 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-lg"><Lightbulb size={28} /></div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personalized Insights</h2>
          </div>
          {result.insights ? (
            <blockquote className="insight-markdown text-lg sm:text-xl font-bold text-slate-800 leading-8 mb-8 border-l-4 border-teal-600 pl-5">
              <Markdown>{result.insights}</Markdown>
            </blockquote>
          ) : <div className="h-12 bg-slate-100 rounded w-full animate-pulse mb-8"></div>}
          <div className="grid grid-cols-1 gap-4">
            {result.recommendations ? result.recommendations.map((rec, i) => (
              <motion.div key={i} whileHover={{ y: -2 }} className="flex gap-4 p-5 sm:p-6 rounded-lg bg-[#f8fbfa] border border-slate-200 shadow-sm hover:shadow-md transition-all min-w-0">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-xs font-black text-teal-700">{i + 1}</div>
                <div className="recommendation-markdown min-w-0 flex-1 text-slate-700 font-medium leading-7 break-words"><Markdown>{rec}</Markdown></div>
              </motion.div>
            )) : [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>)}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-12 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg"><ExternalLink size={28} /></div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trusted Resources</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.resources ? result.resources.map((resource, i) => (
              <motion.a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -5, scale: 1.02 }} className="flex items-center justify-between gap-4 p-5 rounded-lg border border-slate-200 bg-[#f8fbfa] hover:bg-white hover:border-teal-200 hover:shadow-md transition-all group">
                <span className="font-bold text-slate-700 group-hover:text-teal-700 transition-colors leading-6">{resource.title}</span>
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-teal-700 group-hover:bg-teal-50 transition-all shadow-sm shrink-0">
                  <ExternalLink size={18} />
                </div>
              </motion.a>
            )) : [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse"></div>)}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
