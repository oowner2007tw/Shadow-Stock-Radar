import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RadarMetrics, RadarFacetDetail } from '../types';

interface EightRadarChartProps {
  data: RadarMetrics;
}

const EightRadarChart: React.FC<EightRadarChartProps> = ({ data }) => {
  // Transform data object to array for Recharts with the new 6 facets
  const chartData = [
    { subject: '題材熱度 (30%)', A: data.topic.score, fullMark: 100 },
    { subject: '籌碼面 (20%)', A: data.chips.score, fullMark: 100 },
    { subject: 'S&P 500 VIX (20%)', A: data.vix.score, fullMark: 100 },
    { subject: '技術面 (10%)', A: data.technical.score, fullMark: 100 },
    { subject: '大盤位階 (10%)', A: data.macro.score, fullMark: 100 },
    { subject: '加權融資餘額 (10%)', A: data.margin.score, fullMark: 100 },
  ];

  const facets: { key: keyof RadarMetrics; label: string; sub: string }[] = [
    { key: 'topic', label: '題材熱度', sub: '30% (AI/Search)' },
    { key: 'chips', label: '籌碼面', sub: '20% (法人)' },
    { key: 'vix', label: '貪婪恐慌', sub: '20% (S&P 500 VIX)' },
    { key: 'technical', label: '技術面', sub: '10% (MA/Trend)' },
    { key: 'macro', label: '大盤位階', sub: '10% (TWSE)' },
    { key: 'margin', label: '加權融資餘額', sub: '10% (大盤 Market)' },
  ];

  return (
    <div className="space-y-4">
      <div className="w-full h-[350px] md:h-[400px] bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg print:bg-white print:border-slate-200 print:shadow-none print:h-[300px]">
        <h3 className="text-emerald-400 text-center font-bold mb-4 tracking-wider text-lg flex items-center justify-center gap-2 print:text-emerald-700">
           <span>六維量化雷達 (6-Factor Model)</span>
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="評分"
              dataKey="A"
              stroke="#10b981"
              strokeWidth={3}
              fill="#10b981"
              fillOpacity={0.25}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#34d399' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg print:bg-white print:border-slate-200 print:shadow-none">
        <h4 className="text-white font-bold mb-4 flex items-center gap-2 print:text-black">
           <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
           因子深度量化解析 (Quantified Analysis)
        </h4>
        <div className="grid grid-cols-1 gap-4 print:grid-cols-1 print:gap-4">
           {facets.map(({ key, label, sub }) => {
             const detail = data[key] as RadarFacetDetail;
             return (
               <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-colors print:bg-white print:border-slate-300">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-bold print:text-black">{label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${detail.isRealData ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'} print:border-none print:bg-transparent`}>
                        {detail.isRealData ? 'Real Data' : 'Estimated'}
                        </span>
                     </div>
                     <span className="text-xs text-slate-500 block mt-0.5 print:text-slate-500">{sub}</span>
                   </div>
                   <div className="text-right">
                      <div className={`text-xl font-bold ${detail.score >= 80 ? 'text-emerald-400 print:text-emerald-600' : detail.score >= 50 ? 'text-blue-400 print:text-blue-600' : 'text-red-400 print:text-red-600'}`}>
                        {detail.score}
                      </div>
                      <div className="text-xs text-slate-400 print:text-slate-500">Score</div>
                   </div>
                 </div>
                 
                 <div className="bg-slate-900/50 rounded p-2 mb-2 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Key Metric</div>
                    <div className="text-sm font-mono text-emerald-300 font-semibold print:text-emerald-700">{detail.metricValue || 'N/A'}</div>
                 </div>

                 <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-2 print:text-slate-700 print:border-slate-200">{detail.reason}</p>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default EightRadarChart;