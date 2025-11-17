import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';

export interface SlashOption {
  name: string;
  description: string;
  type?: number | string;
  required?: boolean;
}

export interface SlashCommandDef {
  name: string;
  description: string;
  options?: SlashOption[];
  execute?: (...args: any[]) => Promise<void> | void;
}

export class SlashBuilder {
  private def: SlashCommandDef;

  constructor(name: string, description = '') {
    this.def = { name, description, options: [] };
  }

  addOption(opt: SlashOption) {
    this.def.options = this.def.options || [];
    this.def.options.push(opt);
    return this;
  }

  setExecute(fn: (...args: any[]) => Promise<void> | void) {
    this.def.execute = fn;
    return this;
  }

  build() {
    return this.def;
  }
}

/**
 * Local registry for slash commands. Provides helpers to build payloads
 * and a pluggable sync method so the consumer can provide their REST client.
 */
export class SlashManager {
  private cmds = new Map<string, SlashCommandDef>();

  register(def: SlashCommandDef) {
    if (this.cmds.has(def.name)) throw new Error(`Slash command ${def.name} already registered`);
    this.cmds.set(def.name, def);
  }

  builder(name: string, description = '') {
    return new SlashBuilder(name, description);
  }

  getCommands(): SlashCommandDef[] {
    return Array.from(this.cmds.values());
  }

  toDiscordPayloads(): RESTPostAPIApplicationCommandsJSONBody[] {
    return this.getCommands().map((c) => ({
      name: c.name,
      description: c.description,
      options: (c.options ?? []) as any
    }));
  }

  /**
   * Syncs commands using a provided REST client that must implement `put(path, body)`.
   * This keeps the package free of a direct dependency on the REST implementation.
   */
  async syncWithApi(rest: any, applicationId: string, guildId?: string) {
    if (!rest || typeof rest.put !== 'function') throw new Error('A compatible REST client with `put` method is required');
    const payload = this.toDiscordPayloads();
    const path = guildId
      ? `/applications/${applicationId}/guilds/${guildId}/commands`
      : `/applications/${applicationId}/commands`;
    // rest.put should follow REST client's semantics (path, body)
    return rest.put(path, { body: payload });
  }
}

export default SlashManager;
