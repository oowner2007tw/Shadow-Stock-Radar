import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GBMChartProps {
  data: { date: string; price: number }[];
}

const GBMChart: React.FC<GBMChartProps> = ({ data }) => {
  return (
    // Removed mt-6 to align with Radar Chart in the top row
    <div className="w-full h-[350px] md:h-[400px] bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg print:bg-white print:border-slate-200 print:shadow-none print:h-[300px]">
      <div className="flex flex-col items-center mb-4">
        <h3 className="text-blue-400 font-bold tracking-wider text-lg print:text-blue-700">Random Forest AI 趨勢預測</h3>
        <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
           (Machine Learning Regression · Driven by Radar Score & History)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#94a3b8" 
            tick={{ fontSize: 12 }}
            width={40}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            formatter={(value: number) => [`${value}`, 'Pred. Price']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GBMChart;