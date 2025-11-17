import type { Client, Message, Interaction, PermissionResolvable } from 'discord.js';

export interface Context {
  client: Client;
  message?: Message;
  interaction?: Interaction;
  args: string[];
  // convenience: storage per-request
  state?: Record<string, any>;
}

export interface Command {
  name: string;
  description?: string;
  aliases?: string[];
  /** optional list of required permissions (discord.js PermissionResolvable) */
  permissions?: PermissionResolvable[];
  /** subcommands map (name -> Command) */
  subcommands?: Record<string, Command>;
  /**
   * argument schema; freeform for now, used by help/validation
   */
  args?: string[];
  /**
   * Execute the command with the given context.
   */
  execute?: (ctx: Context) => Promise<void> | void;
}

export interface Plugin {
  name: string;
  init?: (neuron: any) => Promise<void> | void;
  teardown?: () => Promise<void> | void;
}

export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

export interface IntentResult {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface IntentAdapter {
  analyze(text: string): Promise<IntentResult>;
}
