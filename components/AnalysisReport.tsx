import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';

interface AnalysisReportProps {
  report: string;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ report }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 h-full overflow-y-auto max-h-[800px] shadow-inner custom-scrollbar print:max-h-none print:h-auto print:bg-white print:border-none print:shadow-none print:p-0">
      <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-600 pb-4 flex items-center gap-2 print:text-black print:border-slate-300">
        <FileText className="w-5 h-5 text-emerald-400 print:text-black" />
        AI 影子分析報告 (AI Analysis)
      </h3>
      <div className="prose prose-invert prose-sm max-w-none 
        prose-headings:text-emerald-400 prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4
        prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
        prose-li:text-slate-300 prose-ul:my-2 prose-li:marker:text-emerald-500
        prose-strong:text-white prose-strong:font-bold
        prose-hr:border-slate-700
        
        print:prose-headings:text-black 
        print:prose-p:text-black 
        print:prose-li:text-black 
        print:prose-strong:text-black
        print:prose-hr:border-slate-300
      ">
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>
    </div>
  );
};

export default AnalysisReport;