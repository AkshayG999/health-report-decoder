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
    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-700 shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-8 bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-primary-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-50 text-primary-600 rounded-lg"><FileText size={22} /></div>
              <div>
                <h2 className="text-xl font-extrabold text-ink tracking-tight">Report Summary</h2>
                <p className="text-xs font-bold text-clay uppercase tracking-widest mt-0.5">Simplified View</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {source === "history" && (
                <button type="button" onClick={onBackToReports} className="h-9 px-2 rounded-md text-xs font-bold text-cocoa hover:text-primary-400 hover:bg-primary-50 transition-colors flex items-center gap-1.5">
                  <ArrowLeft size={16} />
                  Saved Reports
                </button>
              )}
              <button type="button" onClick={onExportPdf} disabled={!result.simplifiedReport || exporting} className="min-h-9 px-3 rounded-lg text-xs font-bold bg-primary-400 text-primary-50 hover:bg-primary-600 disabled:bg-primary-50 disabled:text-primary-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold border transition-all w-fit",
                result.recommendations ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-primary-50 text-primary-600 border-primary-100 animate-pulse"
              )}>
                {result.recommendations ? <><CheckCircle2 size={14} /> Analysis Complete</> : <><Loader2 size={14} className="animate-spin" /> Processing...</>}
              </div>
            </div>
          </div>

          <div className="markdown-content text-sm sm:text-[15px] leading-7 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:pr-2">
            {result.simplifiedReport ? <Markdown>{result.simplifiedReport}</Markdown> : (
              <div className="space-y-3">
                <div className="h-4 bg-primary-50 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-primary-50 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-primary-50 rounded w-5/6 animate-pulse"></div>
              </div>
            )}
          </div>
        </motion.section>

        <div className="lg:col-span-4 space-y-4">
          <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-primary-900 rounded-lg p-4 text-primary-50 shadow-sm">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <Stethoscope size={20} className="text-accent-100" />
            </div>
            <h3 className="text-lg font-extrabold mb-2 tracking-tight">Doctor's Visit Prep</h3>
            <p className="text-primary-50/80 text-xs font-medium mb-4 leading-5">Key questions to discuss with your healthcare provider based on this report:</p>
            <ul className="space-y-2">
              {["What do these specific values mean for my long-term health?", "Are there lifestyle changes that can improve these results?", "When should I schedule a follow-up test?"].map((q, i) => (
                <motion.li key={i} whileHover={{ x: 4 }} className="flex gap-2.5 text-xs bg-white/8 p-3 rounded-lg border border-white/10 hover:bg-white/12 transition-colors cursor-default">
                  <ChevronRight size={16} className="shrink-0 text-accent-100 mt-0.5" />
                  <span className="font-medium leading-5">{q}</span>
                </motion.li>
              ))}
            </ul>
          </motion.section>

          <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg p-4 border border-primary-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5 text-clay">
              <AlertCircle size={18} />
              <h4 className="font-bold text-xs uppercase tracking-widest">Medical Disclaimer</h4>
            </div>
            <p className="text-xs text-cocoa leading-5 font-medium">
              This analysis is generated by AI for informational purposes only. It is not a medical diagnosis or professional medical advice. Always consult with a qualified healthcare provider.
            </p>
          </motion.section>
        </div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-8 bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-primary-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-accent-50 text-accent-600 rounded-lg"><Lightbulb size={22} /></div>
            <h2 className="text-xl font-extrabold text-ink tracking-tight">Personalized Insights</h2>
          </div>
          {result.insights ? (
            <blockquote className="insight-markdown text-sm sm:text-base font-bold text-cocoa leading-7 mb-4 border-l-4 border-primary-400 pl-4">
              <Markdown>{result.insights}</Markdown>
            </blockquote>
          ) : <div className="h-10 bg-primary-50 rounded w-full animate-pulse mb-4"></div>}
          <div className="grid grid-cols-1 gap-3">
            {result.recommendations ? result.recommendations.map((rec, i) => (
              <motion.div key={i} whileHover={{ y: -1 }} className="flex gap-3 p-3.5 rounded-lg bg-bg border border-primary-100 shadow-sm hover:shadow-md transition-all min-w-0">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-[11px] font-black text-primary-600">{i + 1}</div>
                <div className="recommendation-markdown min-w-0 flex-1 text-sm text-cocoa font-medium leading-6 break-words"><Markdown>{rec}</Markdown></div>
              </motion.div>
            )) : [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-primary-50 rounded-2xl animate-pulse"></div>)}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-4 bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-primary-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg"><ExternalLink size={22} /></div>
            <h2 className="text-xl font-extrabold text-ink tracking-tight">Trusted Resources</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {result.resources ? result.resources.map((resource, i) => (
              <motion.a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -2 }} className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-primary-100 bg-bg hover:bg-white hover:border-primary-200 hover:shadow-md transition-all group">
                <span className="font-bold text-sm text-cocoa group-hover:text-primary-600 transition-colors leading-5">{resource.title}</span>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-clay/60 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all shadow-sm shrink-0">
                  <ExternalLink size={16} />
                </div>
              </motion.a>
            )) : [1, 2, 3].map(i => <div key={i} className="h-16 bg-primary-50 rounded-2xl animate-pulse"></div>)}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
