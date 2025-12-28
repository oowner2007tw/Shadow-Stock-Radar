// --- Custom Lightweight Random Forest Implementation ---
// Replaces external ml-random-forest library to ensure stability and avoid dependency loading errors in browser.

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
    for (let f = 0; f < numFeatures; f++) {
      // Get unique values to test as thresholds
      // Optimization: sample at most 10 thresholds to speed up
      let values = X.map(row => row[f]).filter((v, i, a) => a.indexOf(v) === i);
      if (values.length > 10) {
          values = values.sort((a,b)=>a-b).filter((_, i) => i % Math.ceil(values.length/10) === 0);
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
    
    constructor(options: { nEstimators: number, seed?: number, maxFeatures?: number }) {
        this.nEstimators = options.nEstimators;
    }

    train(X: number[][], y: number[]) {
        this.trees = [];
        for(let i=0; i<this.nEstimators; i++) {
            // Bootstrap sample (sampling with replacement)
            const XSample: number[][] = [];
            const ySample: number[] = [];
            const n = X.length;
            for(let j=0; j<n; j++) {
                const idx = Math.floor(Math.random() * n);
                XSample.push(X[idx]);
                ySample.push(y[idx]);
            }
            // Create and train tree
            const tree = new DecisionTreeRegressor(5, 2);
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

// --- End Custom Implementation ---

interface ForestInput {
  historyPrices: number[];
  radarScore: number; // 0-100
  futureDays?: number;
}

export const predictPriceTrend = (input: ForestInput): { date: string; price: number }[] => {
  const { historyPrices, radarScore, futureDays = 60 } = input;
  
  // 1. Data Validation & Sanitization
  // Strict sanitization: ensure all are numbers and filter out NaNs
  let prices: number[] = [];
  if (historyPrices && Array.isArray(historyPrices) && historyPrices.length > 0) {
      prices = historyPrices.map(p => Number(p)).filter(n => !isNaN(n) && isFinite(n));
  }

  // Fallback if sanitization left us with empty or too few data
  if (prices.length === 0) {
      prices = [100]; // Absolute fallback to avoid crash
  }
  
  // Fill missing history if provided array is too short (backfill based on trend)
  if (prices.length < 10) {
     const lastPrice = prices[prices.length - 1];
     const needed = 10 - prices.length;
     for(let i=0; i<needed; i++) {
        // Backfill with slight noise to mimic history
        prices.unshift(lastPrice * (1 - (i+1)*0.005)); 
     }
  }

  // 2. Feature Engineering
  const X: number[][] = [];
  const y: number[] = [];

  const getMA = (data: number[], idx: number, period: number) => {
    if (idx < period - 1) return data[idx];
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[idx - i];
    return sum / period;
  };

  let returns: number[] = [];
  for(let i=1; i<prices.length; i++) {
      returns.push((prices[i]-prices[i-1])/prices[i-1]);
  }
  const volatility = returns.length > 0 
    ? Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length) 
    : 0.015;

  // Build Training Set
  for (let i = 5; i < prices.length; i++) {
    const prevPrice = prices[i - 1];
    const ma5 = getMA(prices, i - 1, 5);
    const target = prices[i];

    // Sample 1: Real Data (Assumed Neutral Score 50)
    X.push([prevPrice, ma5, 50]);
    y.push(target);

    // Sample 2: Synthetic Bullish (Score 100)
    X.push([prevPrice, ma5, 100]);
    y.push(target * (1 + volatility * 1.5));

    // Sample 3: Synthetic Bearish (Score 0)
    X.push([prevPrice, ma5, 0]);
    y.push(target * (1 - volatility * 1.5));
  }

  // 3. Train Random Forest (Internal Implementation)
  const rf = new InternalRandomForestRegression({
    nEstimators: 20,
    seed: 42,
    maxFeatures: 3,
  });
  
  if (X.length > 0) {
      rf.train(X, y);
  }

  // 4. Predict Future
  const predictions: { date: string; price: number }[] = [];
  let currentHistory = [...prices];
  let dateCursor = new Date();

  const useFallback = X.length === 0;

  for (let day = 0; day < futureDays; day++) {
    do {
        dateCursor.setDate(dateCursor.getDate() + 1);
    } while (dateCursor.getDay() === 0 || dateCursor.getDay() === 6);
    const dateStr = `${dateCursor.getMonth() + 1}/${dateCursor.getDate()}`;

    let predictedPrice: number;

    if (useFallback) {
         const lastP = currentHistory[currentHistory.length - 1];
         const drift = ((radarScore - 50) / 50) * 0.002;
         predictedPrice = lastP * (1 + drift);
    } else {
        const lastIdx = currentHistory.length - 1;
        const prevPrice = currentHistory[lastIdx];
        const ma5 = getMA(currentHistory, lastIdx, 5);
        
        // Predict using the ACTUAL Radar Score
        const features = [[prevPrice, ma5, radarScore]];
        predictedPrice = rf.predict(features)[0];
        
        if (predictedPrice <= 0) predictedPrice = 0.01;
        
        // Add tiny noise for visualization (make sure result is still a number)
        const noise = (Math.random() - 0.5) * volatility * 0.3 * prevPrice;
        predictedPrice += noise;
    }

    // Explicitly round to 2 decimal places and ensure it's a number
    const finalPrice = Number(predictedPrice.toFixed(2));

    predictions.push({
      date: dateStr,
      price: finalPrice
    });

    // IMPORTANT: Use the precise float for the next iteration to avoid accumulating rounding errors
    // but the UI gets the rounded value.
    currentHistory.push(predictedPrice);
  }

  return predictions;
};