import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RadarMetrics } from '../types';

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

  return (
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
  );
};

export default EightRadarChart;