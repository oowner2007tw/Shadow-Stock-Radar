import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Terminal, Server, Database, BrainCircuit, FileText, Network, Globe, TrendingUp } from 'lucide-react';
import { AnalysisTab } from '../types';

interface ProcessingStatusProps {
  target: string;
  mode: AnalysisTab;
}

const STOCK_STEPS = [
  { text: "連接 FinMind API 與 Google Search", icon: Server },
  { text: "執行 6 大權重因子特徵工程", icon: Database },
  { text: "構建產業知識圖譜 (美股/台股連動)", icon: Network }, // Changed from Training to KG
  { text: "Stage A/B 綜合推論 (多空/勝率)", icon: BrainCircuit },
  { text: "生成量化雷達與分析報告", icon: FileText }
];

const THEME_STEPS = [
  { text: "掃描市場新聞與社群熱度", icon: Server },
  { text: "NLP 關鍵字提取與題材聚類", icon: Database },
  { text: "供應鏈知識圖譜構建 (KG)", icon: Network }, // Icon changed to Network
  { text: "情緒溫度計與噪音過濾", icon: BrainCircuit },
  { text: "生成供應鏈解析報告", icon: FileText }
];

const ARBITRAGE_STEPS = [
  { text: "連接 SEC 財報資料庫 & 台股營收 API", icon: Globe },
  { text: "解析美股財測 (Guidance) 與電話會議", icon: FileText },
  { text: "分析台股供應鏈月營收趨勢 (MoM/YoY)", icon: TrendingUp },
  { text: "計算 Lead Time 與 營收時間差", icon: Network },
  { text: "偵測異常與生成尋寶地圖", icon: BrainCircuit }
];

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ target, mode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  let steps = STOCK_STEPS;
  if (mode === AnalysisTab.THEME) steps = THEME_STEPS;
  else if (mode === AnalysisTab.REVENUE_ARBITRAGE) steps = ARBITRAGE_STEPS;

  useEffect(() => {
    setCurrentStep(0);
  }, [mode, target]);

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500); // 1.5 seconds per step roughly
      return () => clearTimeout(timeout);
    }
  }, [currentStep, steps.length]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/50 rounded-xl p-8 border border-slate-800 shadow-2xl backdrop-blur-sm mt-12">
      <div className="flex flex-col items-center justify-center mb-10">
        <div className="flex items-center gap-3 text-emerald-400 mb-2">
           <Terminal className="w-6 h-6" />
           <span className="text-lg font-mono tracking-wider">系統處理中 : {target}</span>
        </div>
        <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
           <div className="h-full bg-emerald-500 animate-pulse w-2/3"></div>
        </div>
      </div>

      <div className="space-y-6 pl-4 md:pl-12">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <div key={index} className="flex items-center gap-4 transition-all duration-500">
              {index < currentStep ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              ) : index === currentStep ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-slate-700 shrink-0" />
              )}
              
              <span className={`text-lg font-medium tracking-wide transition-colors duration-300 ${
                index <= currentStep ? 'text-slate-200' : 'text-slate-600'
              }`}>
                {step.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingStatus;