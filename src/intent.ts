import type { IntentAdapter, IntentResult } from './types';

/**
 * A minimal, local intent mapper that uses rule-based and keyword heuristics.
 * This serves as a pluggable adapter point for AI-backed adapters later.
 */
export class MockIntentAdapter implements IntentAdapter {
  private rules: Array<{ intent: string; keywords: string[] }> = [];

  constructor() {
    // seed with some useful defaults
    this.rules.push({ intent: 'ping', keywords: ['ping', 'pong', 'latency'] });
    this.rules.push({ intent: 'help', keywords: ['help', 'commands', 'usage'] });
  }

  addRule(intent: string, keywords: string[]) {
    this.rules.push({ intent, keywords });
  }

  async analyze(text: string) {
    const lowered = text.toLowerCase();
    let best: IntentResult = { intent: 'unknown', confidence: 0 };
    for (const r of this.rules) {
      let score = 0;
      for (const k of r.keywords) if (lowered.includes(k)) score += 1;
      if (score > 0) {
        const confidence = Math.min(1, score / Math.max(1, r.keywords.length));
        if (confidence > best.confidence) best = { intent: r.intent, confidence };
      }
    }
    return best;
  }
}

export default MockIntentAdapter;
