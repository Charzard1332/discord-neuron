type Bucket = { tokens: number; last: number };

export class RateLimiter {
  private buckets: Map<string, Bucket> = new Map();
  private capacity: number;
  private refillRatePerSec: number;

  constructor(capacity = 5, refillRatePerSec = 1) {
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
  }

  private now() {
    return Date.now();
  }

  private refill(bucket: Bucket) {
    const elapsed = (this.now() - bucket.last) / 1000;
    const refill = elapsed * this.refillRatePerSec;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
    bucket.last = this.now();
  }

  tryRemove(id: string, cost = 1): boolean {
    let bucket = this.buckets.get(id);
    if (!bucket) {
      bucket = { tokens: this.capacity, last: this.now() };
      this.buckets.set(id, bucket);
    }
    this.refill(bucket);
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }
    return false;
  }

  reset(id: string) {
    this.buckets.delete(id);
  }
}
