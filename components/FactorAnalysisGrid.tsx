import React from 'react';
import { RadarMetrics, RadarFacetDetail } from '../types';

interface FactorAnalysisGridProps {
  data: RadarMetrics;
}

const FactorAnalysisGrid: React.FC<FactorAnalysisGridProps> = ({ data }) => {
  const facets: { key: keyof RadarMetrics; label: string; sub: string }[] = [
    { key: 'topic', label: '題材熱度', sub: '25% (AI/Search/Sentiment)' },
    { key: 'chips', label: '籌碼面', sub: '15% (法人/估值)' },
    { key: 'vix', label: '貪婪恐慌', sub: '25% (S&P 500 VIX Contrarian)' },
    { key: 'technical', label: '技術面', sub: '10% (Trend/RSI/MACD)' },
    { key: 'macro', label: '大盤位階', sub: '10% (Market Bias)' },
    { key: 'margin', label: '加權融資餘額', sub: '15% (大盤散戶水位 Market Margin)' },
  ];

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg print:bg-white print:border-slate-200 print:shadow-none">
        <h4 className="text-white font-bold mb-6 flex items-center gap-2 print:text-black text-lg">
           <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
           因子深度量化解析 (Quantified Analysis)
        </h4>
        
        {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop. This prevents squeezing. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2">
           {facets.map(({ key, label, sub }) => {
             const detail = data[key] as RadarFacetDetail;
             return (
               <div key={key} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all hover:bg-slate-800/60 print:bg-white print:border-slate-300 flex flex-col h-full">
                 
                 {/* Header: Label + Score */}
                 <div className="flex justify-between items-start mb-3">
                   <div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-100 font-bold text-base print:text-black">{label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${detail.isRealData ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'} print:border-none print:bg-transparent`}>
                        {detail.isRealData ? 'Real Data' : 'Est.'}
                        </span>
                     </div>
                     <span className="text-xs text-slate-500 block mt-1 print:text-slate-500">{sub}</span>
                   </div>
                   <div className="text-right shrink-0 ml-2">
                      <div className={`text-2xl font-bold font-mono ${detail.score >= 80 ? 'text-emerald-400 print:text-emerald-600' : detail.score >= 50 ? 'text-blue-400 print:text-blue-600' : 'text-red-400 print:text-red-600'}`}>
                        {detail.score}
                      </div>
                   </div>
                 </div>
                 
                 {/* Key Metric Box */}
                 <div className="bg-slate-900/60 rounded px-3 py-2 mb-3 border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Key Metric</div>
                    <div className="text-sm font-mono text-emerald-300 font-semibold break-words print:text-emerald-700">
                        {detail.metricValue || 'N/A'}
                    </div>
                 </div>

                 {/* Reason Text - Flex grow pushes it to fill space if needed */}
                 <div className="flex-grow">
                    <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-700/50 pt-3 print:text-slate-700 print:border-slate-200">
                        {detail.reason}
                    </p>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
  );
};

export default FactorAnalysisGrid;