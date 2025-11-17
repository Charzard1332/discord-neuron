import type { Message, TextBasedChannel } from 'discord.js';
import type { PersistenceAdapter } from './persistence';
import { ConversationManager } from './conversation';

export type DialogStep = {
  id: string;
  prompt: string;
  validate?: (msg: Message) => boolean | Promise<boolean>;
  transform?: (msg: Message) => any | Promise<any>;
};

export class DialogFlow {
  private steps: DialogStep[] = [];
  private persistence: PersistenceAdapter;
  private conversation: ConversationManager;

  constructor(conversation: ConversationManager, persistence: PersistenceAdapter) {
    this.persistence = persistence;
    this.conversation = conversation;
  }

  addStep(step: DialogStep) {
    this.steps.push(step);
    return this;
  }

  async start(channelMessage: Message, key: string) {
    const stateKey = `dialog:${key}:${channelMessage.author.id}`;
    const state = { step: 0, data: {} } as any;
    await this.persistence.set(stateKey, state);
    return this.run(channelMessage, stateKey);
  }

  private async run(message: Message, stateKey: string) {
    const state = (await this.persistence.get(stateKey)) as any;
    if (!state) throw new Error('Dialog state missing');
    while (state.step < this.steps.length) {
      const s = this.steps[state.step];
      const ch = message.channel as any;
      await ch.send(s.prompt);
      try {
        const reply = await this.conversation.waitForReply(message, { timeoutMs: 60_000 });
        const ok = s.validate ? await s.validate(reply) : true;
        if (!ok) {
          await ch.send('Invalid response, please try again.');
          continue;
        }
        const value = s.transform ? await s.transform(reply) : reply.content;
        state.data[s.id] = value;
        state.step += 1;
        await this.persistence.set(stateKey, state);
      } catch (err) {
        const ch = message.channel as any;
        await ch.send('Timed out waiting for reply.');
        await this.persistence.delete(stateKey);
        return { cancelled: true };
      }
    }
    await this.persistence.delete(stateKey);
    return { cancelled: false, data: state.data };
  }
}

export default DialogFlow;
