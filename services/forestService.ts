import { RadarMetrics } from '../types';

// --- Custom Lightweight Random Forest Implementation ---
// Preserved to ensure browser compatibility without external heavy libraries.

class DecisionNode {
  featureIndex: number;
  threshold: number;
  value: number; // For leaf nodes
  left: DecisionNode | null = null;
  right: DecisionNode | null = null;
  isLeaf: boolean = false;

  constructor(value: number = 0) {
    this.value = value;
    this.featureIndex = -1;
    this.threshold = 0;
  }
}

class DecisionTreeRegressor {
  root: DecisionNode | null = null;
  maxDepth: number;
  minSamplesSplit: number;

  constructor(maxDepth: number = 5, minSamplesSplit: number = 2) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[]) {
    this.root = this.buildTree(X, y, 0);
  }

  private buildTree(X: number[][], y: number[], depth: number): DecisionNode {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    
    // Simple stopping criteria
    if (numSamples < this.minSamplesSplit || depth >= this.maxDepth) {
      const avg = y.reduce((a, b) => a + b, 0) / (numSamples || 1);
      const leaf = new DecisionNode(avg);
      leaf.isLeaf = true;
      return leaf;
    }

    let bestVarRed = -Infinity;
    let bestSplit = { featureIndex: -1, threshold: 0, leftIndices: [] as number[], rightIndices: [] as number[] };
    const currentVar = this.variance(y);

    // Try splits on all features
    // Optimization: sample thresholds to speed up training on larger datasets
    for (let f = 0; f < numFeatures; f++) {
      let values = X.map(row => row[f]).filter((v, i, a) => a.indexOf(v) === i);
      // Downsample if too many unique values
      if (values.length > 20) {
          values = values.sort((a,b)=>a-b).filter((_, i) => i % Math.ceil(values.length/20) === 0);
      }
      
      for (const thr of values) {
         const leftIndices = [];
         const rightIndices = [];
         for(let i=0; i<numSamples; i++) {
             if (X[i][f] <= thr) leftIndices.push(i);
             else rightIndices.push(i);
         }
         
         if (leftIndices.length > 0 && rightIndices.length > 0) {
             const yLeft = leftIndices.map(i => y[i]);
             const yRight = rightIndices.map(i => y[i]);
             const leftVar = this.variance(yLeft);
             const rightVar = this.variance(yRight);
             const reduction = currentVar - ((yLeft.length/numSamples)*leftVar + (yRight.length/numSamples)*rightVar);
             
             if (reduction > bestVarRed) {
                 bestVarRed = reduction;
                 bestSplit = { featureIndex: f, threshold: thr, leftIndices, rightIndices };
             }
         }
      }
    }

    if (bestSplit.featureIndex === -1) {
       const avg = y.reduce((a, b) => a + b, 0) / numSamples;
       const leaf = new DecisionNode(avg);
       leaf.isLeaf = true;
       return leaf;
    }

    const node = new DecisionNode();
    node.featureIndex = bestSplit.featureIndex;
    node.threshold = bestSplit.threshold;
    
    const XLeft = bestSplit.leftIndices.map(i => X[i]);
    const yLeft = bestSplit.leftIndices.map(i => y[i]);
    const XRight = bestSplit.rightIndices.map(i => X[i]);
    const yRight = bestSplit.rightIndices.map(i => y[i]);

    node.left = this.buildTree(XLeft, yLeft, depth + 1);
    node.right = this.buildTree(XRight, yRight, depth + 1);
    return node;
  }

  private variance(y: number[]): number {
      if (y.length === 0) return 0;
      const mean = y.reduce((a,b)=>a+b,0)/y.length;
      return y.reduce((a,b) => a + (b-mean)**2, 0) / y.length;
  }

  predict(features: number[]): number {
     let node = this.root;
     while(node && !node.isLeaf) {
         if (features[node.featureIndex] <= node.threshold) {
             node = node.left;
         } else {
             node = node.right;
         }
     }
     return node ? node.value : 0;
  }
}

class InternalRandomForestRegression {
    trees: DecisionTreeRegressor[] = [];
    nEstimators: number;
    
    constructor(options: { nEstimators: number, seed?: number }) {
        this.nEstimators = options.nEstimators;
    }

    train(X: number[][], y: number[]) {
        this.trees = [];
        for(let i=0; i<this.nEstimators; i++) {
            const XSample: number[][] = [];
            const ySample: number[] = [];
            const n = X.length;
            // Bootstrap
            for(let j=0; j<n; j++) {
                const idx = Math.floor(Math.random() * n);
                XSample.push(X[idx]);
                ySample.push(y[idx]);
            }
            const tree = new DecisionTreeRegressor(6, 2); 
            tree.fit(XSample, ySample);
            this.trees.push(tree);
        }
    }

    predict(features: number[][]): number[] {
        return features.map(sample => {
            if (this.trees.length === 0) return 0;
            const sum = this.trees.reduce((acc, tree) => acc + tree.predict(sample), 0);
            return sum / this.trees.length;
        });
    }
}

// --- QUANTITATIVE FEATURE ENGINEERING HELPERS ---

/**
 * Calculates RSI (Relative Strength Index) for a given window.
 * Default period 6 for short-term sensitivity.
 */
const calculateRSI = (prices: number[], period: number = 6): number => {
    if (prices.length < period + 1) return 50; // Neutral fallback

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    if (losses === 0) return 100;
    
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
};

/**
 * Calculates the slope of the Linear Regression line (MA Slope).
 * Used to determine trend direction.
 */
const calculateSlope = (prices: number[], period: number = 5): number => {
    if (prices.length < period) return 0;
    
    const y = prices.slice(-period);
    const n = y.length;
    const x = Array.from({length: n}, (_, i) => i); // [0, 1, 2, 3, 4]
    
    const sumX = x.reduce((a,b) => a+b, 0);
    const sumY = y.reduce((a,b) => a+b, 0);
    const sumXY = x.reduce((acc, curr, i) => acc + curr * y[i], 0);
    const sumXX = x.reduce((acc, curr) => acc + curr * curr, 0);
    
    // Slope formula: (n*sumXY - sumX*sumY) / (n*sumXX - sumX^2)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Normalize slope relative to price to make it scale-invariant approximately
    return slope / y[0]; 
};

/**
 * Main function to predict trend using Random Forest.
 * 
 * Features (8 Dimensions Logic):
 * 1. Log Returns
 * 2. MA Trend
 * 3. RSI (Technical)
 * 4. Slope (Technical)
 * 5. RadarScore (Composite of VIX, Macro, Chips, etc.)
 */
export const predictWithForest = (
  prices: number[], 
  radarScore: number, 
  futureDays: number = 10 // UPDATED: Default to 10 Days as requested
): number[] => {
  
  // 1. Sanitize Data
  const cleanPrices = prices.filter(n => !isNaN(n) && isFinite(n) && n > 0);
  if (cleanPrices.length < 10) {
      const last = cleanPrices[cleanPrices.length - 1] || 100;
      return Array(futureDays).fill(last); 
  }

  // 2. Feature Engineering Setup
  const X_train: number[][] = [];
  const y_train: number[] = []; // Target: Next Log Return

  // Construct Training Set
  // Need ample history for RSI(6) and MA(5)
  const trainStartIndex = 7; 
  
  for (let i = trainStartIndex; i < cleanPrices.length; i++) {
      const currentPrice = cleanPrices[i];
      const prevPrice = cleanPrices[i-1];
      const prevPrevPrice = cleanPrices[i-2];

      // Target: Log Return at T
      const logReturnT = Math.log(currentPrice / prevPrice);

      // Feature 1: Previous Log Return
      const prevLogReturn = Math.log(prevPrice / prevPrevPrice);

      // Feature 2: MA Trend (Distance from MA5)
      // Simple MA calculation inline
      let maSum = 0;
      for(let k=1; k<=5; k++) maSum += cleanPrices[i-k];
      const ma5 = maSum / 5;
      const maTrend = (prevPrice / ma5) - 1;

      // Feature 3: RSI (Technical Indicator)
      const rsi = calculateRSI(cleanPrices.slice(0, i), 6);

      // Feature 4: Slope (Trend Direction)
      const slope = calculateSlope(cleanPrices.slice(0, i), 5);

      // Feature 5: Radar Score (Static AI Context)
      // This allows the forest to learn "When Score is High AND RSI is Low -> Buy"
      
      X_train.push([prevLogReturn, maTrend, rsi, slope, radarScore]);
      y_train.push(logReturnT);
  }

  // 3. Train Model
  const rf = new InternalRandomForestRegression({ nEstimators: 30, seed: 42 });
  if (X_train.length > 0) {
      rf.train(X_train, y_train);
  }

  // 4. Prediction Loop (Future Simulation)
  const predictions: number[] = [];
  const simHistory = [...cleanPrices];

  for (let day = 0; day < futureDays; day++) {
      const idx = simHistory.length;
      const lastPrice = simHistory[idx - 1];
      const secondLastPrice = simHistory[idx - 2];

      // Construct Features for 'Tomorrow'
      const feat_prevLogReturn = Math.log(lastPrice / secondLastPrice);
      
      let maSum = 0;
      for(let k=1; k<=5; k++) maSum += simHistory[idx-k];
      const feat_ma5 = maSum / 5;
      const feat_maTrend = (lastPrice / feat_ma5) - 1;
      
      const feat_rsi = calculateRSI(simHistory, 6);
      const feat_slope = calculateSlope(simHistory, 5);

      const features = [[feat_prevLogReturn, feat_maTrend, feat_rsi, feat_slope, radarScore]];
      
      let predictedLogReturn = 0;
      if (X_train.length > 0) {
          predictedLogReturn = rf.predict(features)[0];
      }

      // --- DECISION THRESHOLD LOGIC (Post-Processing) ---
      // Requirement: Score >= 0.65 -> Buy/Bullish | Score < 0.45 -> Sell/Bearish
      // We map Score (0-100) to (0.0-1.0) for threshold comparison
      
      let drift = 0;
      const normalizedScore = radarScore / 100;

      if (normalizedScore >= 0.65) {
          // Strong Buy Signal
          // Drift = Positive, proportional to how high above 65
          drift = (normalizedScore - 0.5) * 0.0025; 
      } else if (normalizedScore < 0.45) {
          // Sell/Hedge Signal
          // Drift = Negative, proportional to how far below 45
          drift = (normalizedScore - 0.5) * 0.0035; // Bearish drops are often faster
      } else {
           // Between 0.45 and 0.65 (Neutral/Observation)
           // Minimal drift, strictly random forest driven
           drift = 0;
      }
      
      const noise = (Math.random() - 0.5) * 0.008; 

      const finalLogReturn = predictedLogReturn + drift + noise;

      // P_t = P_{t-1} * exp(R_t)
      const nextPrice = lastPrice * Math.exp(finalLogReturn);
      
      predictions.push(Number(nextPrice.toFixed(2)));
      simHistory.push(nextPrice);
  }

  return predictions;
};