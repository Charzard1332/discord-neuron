import type { Message } from 'discord.js';

type Collector = {
  filter?: (m: Message) => boolean;
  resolve: (m: Message) => void;
  timeout: NodeJS.Timeout;
};

export class ConversationManager {
  private collectors = new Map<string, Collector[]>();

  waitForReply(message: Message, opts: { filter?: (m: Message) => boolean; timeoutMs?: number } = {}) {
    const channelId = message.channel.id;
    return new Promise<Message>((resolve, reject) => {
      const t = setTimeout(() => {
        // remove collector
        const arr = this.collectors.get(channelId) || [];
        this.collectors.set(channelId, arr.filter((c) => c.resolve !== resolve));
        reject(new Error('timeout'));
      }, opts.timeoutMs ?? 30_000);

      const collector: Collector = { filter: opts.filter, resolve, timeout: t };
      const arr = this.collectors.get(channelId) || [];
      arr.push(collector);
      this.collectors.set(channelId, arr);
    });
  }

  // to be called by Neuron on messageCreate
  async onMessage(message: Message) {
    const arr = this.collectors.get(message.channel.id);
    if (!arr || arr.length === 0) return false;
    // deliver to first matching collector
    for (const c of Array.from(arr)) {
      try {
        if (c.filter && !c.filter(message)) continue;
        clearTimeout(c.timeout);
        c.resolve(message);
        // remove collector
        this.collectors.set(message.channel.id, this.collectors.get(message.channel.id)!.filter((x) => x !== c));
        return true;
      } catch (_) {
        // ignore
      }
    }
    return false;
  }
}

export default ConversationManager;
