/**
 * Simple in-memory storage for try-on results
 * In production, this would be replaced with a proper database
 */

export interface StoredResult {
  jobId: string;
  status: 'completed' | 'failed';
  originalImageUrl?: string;
  resultImageUrl?: string;
  garmentType?: string;
  qualityMetrics?: any;
  processingTime?: number;
  provider?: string;
  createdAt: string;
  expiresAt: string;
}

// Use a global variable to ensure singleton behavior across module reloads
declare global {
  var __resultStorage: ResultStorage | undefined;
}

class ResultStorage {
  private results = new Map<string, StoredResult>();

  constructor() {
    console.log('🏗️ ResultStorage instance created');
  }
  
  store(result: StoredResult): void {
    console.log(`📦 Storing result for job ${result.jobId}:`, {
      hasResultImageUrl: !!result.resultImageUrl,
      resultImageUrl: result.resultImageUrl?.substring(0, 100) + '...',
      status: result.status,
      totalStored: this.results.size + 1
    });
    this.results.set(result.jobId, result);
    
    // Auto-cleanup after expiration (24 hours)
    setTimeout(() => {
      this.results.delete(result.jobId);
      console.log(`🗑️ Auto-cleaned expired result: ${result.jobId}`);
    }, 24 * 60 * 60 * 1000);
  }
  
  get(jobId: string): StoredResult | undefined {
    const result = this.results.get(jobId);
    console.log(`📤 Retrieving result for job ${jobId}:`, {
      found: !!result,
      hasResultImageUrl: !!result?.resultImageUrl,
      status: result?.status,
      totalStored: this.results.size
    });
    return result;
  }
  
  remove(jobId: string): boolean {
    const deleted = this.results.delete(jobId);
    console.log(`🗑️ Deleted result for job ${jobId}: ${deleted}`);
    return deleted;
  }
  
  // For debugging
  listAll(): string[] {
    return Array.from(this.results.keys());
  }
  
  // Get current storage state
  debugStatus(): void {
    console.log(`🔍 ResultStorage Status: ${this.results.size} stored results`);
    for (const [jobId, result] of this.results.entries()) {
      console.log(`  - ${jobId}: ${result.status} | ${result.resultImageUrl ? 'Has image URL' : 'No image URL'}`);
    }
  }
}

// Create or reuse the global singleton
if (!global.__resultStorage) {
  global.__resultStorage = new ResultStorage();
}

const resultStorage = global.__resultStorage;
export default resultStorage;
