import type { IntentAdapter, IntentResult } from './types';

export class OpenAIIntentAdapter implements IntentAdapter {
  private apiKey: string | undefined;
  private model: string;

  constructor(apiKey?: string, model = 'gpt-3.5-turbo') {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
    this.model = model;
  }

  async analyze(text: string): Promise<IntentResult> {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY not set');
    const prompt = `Extract the user's intent from the following text and return JSON with keys intent and confidence (0-1):\n\n${text}`;
    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const json = await res.json();
    const txt = json.choices?.[0]?.message?.content ?? '';
    // Attempt to parse JSON from the model output
    try {
      const parsed = JSON.parse(txt);
      return { intent: parsed.intent ?? 'unknown', confidence: parsed.confidence ?? 0, entities: parsed.entities };
    } catch (e) {
      // fallback: basic detection
      return { intent: 'unknown', confidence: 0 };
    }
  }
}

export default OpenAIIntentAdapter;
