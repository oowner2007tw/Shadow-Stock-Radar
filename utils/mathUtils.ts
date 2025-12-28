import { RadarMetrics } from "../types";

/**
 * Simulates future price path using Geometric Brownian Motion (GBM)
 * Updated: Now accepts `RadarMetrics` to dynamically calculate Drift and Volatility.
 * This ensures the simulation reflects the fundamental/technical analysis, not just random noise.
 */
export const calculateGBM = (
  startPrice: number,
  radarData: RadarMetrics, // Injecting the 6-Factor Data
  tradingDays: number = 60, // Quarterly view
  simulations: number = 1000 // High sampling for convergence
): { date: string; price: number }[] => {
  
  // --- 1. Calculate Dynamic Drift (Expected Return) ---
  // Formula: Weighted Sum of all 6 factors.
  // Weighting aligns with the Radar Chart logic: Topic(30%), Chips(20%), VIX(20%), Tech(10%), Macro(10%), Margin(10%)
  const weightedScore = 
    (radarData.topic.score * 0.3) +
    (radarData.chips.score * 0.2) +
    (radarData.vix.score * 0.2) +
    (radarData.technical.score * 0.1) +
    (radarData.macro.score * 0.1) +
    (radarData.margin.score * 0.1);

  // Map Score (0-100) to Daily Drift (-0.3% to +0.3%)
  // Score 50 = Neutral (0% drift)
  // Score 80 = Bullish (+0.18% daily)
  // Score 20 = Bearish (-0.18% daily)
  const drift = ((weightedScore - 50) / 50) * 0.003; 

  // --- 2. Calculate Dynamic Volatility (Risk/Fluctuation) ---
  // Base Volatility for Taiwan Stocks approx 1.5% daily
  let volatility = 0.015;

  // Factor A: Hype Factor (Topic)
  // If Topic is overheated (>80), volatility increases due to speculation.
  if (radarData.topic.score > 80) volatility += 0.005;

  // Factor B: Stability Factor (Chips & Margin)
  // If Chips are solid (>70) AND Margin is stable (>70), volatility decreases.
  if (radarData.chips.score > 70 && radarData.margin.score > 70) {
    volatility -= 0.004;
  }
  // If Chips are messy (<40), volatility increases (dumping risk).
  else if (radarData.chips.score < 40) {
    volatility += 0.006;
  }

  // Factor C: Panic Factor (VIX)
  // High VIX score (Buy point/Fear) usually implies high market volatility.
  // Note: High Score in Radar means "Good for Long" (Fear is high), but market is volatile.
  if (radarData.vix.score > 80) volatility += 0.005;

  // Cap volatility to realistic bounds (0.5% to 4% daily)
  volatility = Math.max(0.005, Math.min(0.04, volatility));

  // --- 3. Monte Carlo Engine (Box-Muller) ---
  const randn_bm = (): number => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  };

  const dailyPriceSums = new Array(tradingDays).fill(0);

  for (let i = 0; i < simulations; i++) {
    let currentPrice = startPrice;
    
    for (let day = 0; day < tradingDays; day++) {
       const Z = randn_bm();
       // GBM Formula: S_t = S_{t-1} * exp((mu - 0.5 * sigma^2) + sigma * Z)
       const growthRate = (drift - 0.5 * Math.pow(volatility, 2)) + volatility * Z;
       
       currentPrice = currentPrice * Math.exp(growthRate);
       dailyPriceSums[day] += currentPrice;
    }
  }

  // --- 4. Process Results ---
  const result: { date: string; price: number }[] = [];
  let dateCursor = new Date();

  for (let day = 0; day < tradingDays; day++) {
    do {
      dateCursor.setDate(dateCursor.getDate() + 1);
    } while (dateCursor.getDay() === 0 || dateCursor.getDay() === 6);

    const dateStr = `${dateCursor.getMonth() + 1}/${dateCursor.getDate()}`;
    const avgPrice = dailyPriceSums[day] / simulations;
    
    result.push({
      date: dateStr,
      price: Number(avgPrice.toFixed(2))
    });
  }

  return result;
};

/**
 * Normalizes a score to 0-100 range
 */
export const normalizeScore = (value: number, min: number, max: number): number => {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
};