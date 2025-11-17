import { Client, GatewayIntentBits, Partials } from 'discord.js';
import type { Middleware } from './types';
import { CommandRegistry } from './command';
import { PluginManager } from './plugin';
import { RateLimiter } from './rateLimiter';
import { EventBus } from './events';
import { MemoryAdapter, FileAdapter, PersistenceAdapter } from './persistence';
import { SlashManager } from './slash';
import { Container } from './container';
import { ConversationManager } from './conversation';
import { MockIntentAdapter } from './intent';
import { Metrics } from './metrics';

export interface NeuronOptions {
  prefix?: string;
  intents?: bigint[] | number[];
}

export class Neuron {
  public client: Client;
  public commands: CommandRegistry;
  public plugins: PluginManager;
  public rateLimiter: RateLimiter;
  public events: EventBus;
  public persistence: PersistenceAdapter;
  public slash: SlashManager;
  public container: Container;
  public conversation: ConversationManager;
  public intent: import('./types').IntentAdapter;
  public metrics: Metrics;
  private middlewares: Middleware[] = [];

  constructor(options: NeuronOptions = {}) {
    this.client = new Client({
      intents: options.intents ?? [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
      partials: [Partials.Channel]
    } as any);
    this.commands = new CommandRegistry(options.prefix ?? '!');
    this.plugins = new PluginManager();
    this.rateLimiter = new RateLimiter(5, 1);
    this.events = new EventBus();
    this.persistence = new MemoryAdapter();
    this.slash = new SlashManager();
    this.container = new Container();
    this.conversation = new ConversationManager();
    this.intent = new MockIntentAdapter();
    this.metrics = new Metrics();

    this.client.on('messageCreate', (message) => this._onMessage(message.content, message));
  }

  use(mw: Middleware) {
    this.middlewares.push(mw);
  }

  registerCommand(cmd: any) {
    this.commands.register(cmd);
  }

  registerPlugin(p: any) {
    this.plugins.register(p);
  }

  private async _runMiddleware(ctx: any, i = 0): Promise<void> {
    if (i >= this.middlewares.length) return;
    const mw = this.middlewares[i];
    await Promise.resolve(mw(ctx, () => this._runMiddleware(ctx, i + 1)));
  }

  private async _onMessage(content: string, message: any) {
    if (!message.author || message.author.bot) return;
    const id = message.author.id;
    const allowed = this.rateLimiter.tryRemove(id);
    if (!allowed) return; // silently drop; plugins/middleware can expose nicer behaviour

    const ctx = { client: this.client, message, args: [] } as any;
    await this._runMiddleware(ctx);
    const handled = await this.commands.handleMessage(content, ctx);
    if (!handled) {
      // fallback plugin hook
      // plugins can listen to messages via init and client events
    }
  }

  async login(token: string) {
    await this.plugins.initAll(this);
    return this.client.login(token);
  }

  async destroy() {
    await this.plugins.teardownAll();
    return this.client.destroy();
  }
}

export default Neuron;
