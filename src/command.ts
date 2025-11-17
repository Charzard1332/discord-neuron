import type { Command, Context } from './types';
import { EventEmitter } from 'events';
import { PermissionsBitField } from 'discord.js';

function normalizeName(n: string) {
  return n.trim().toLowerCase();
}

export class CommandRegistry extends EventEmitter {
  private commands = new Map<string, Command>();
  private prefix: string;

  constructor(prefix = '!') {
    super();
    this.prefix = prefix;
  }

  register(cmd: Command) {
    const name = normalizeName(cmd.name);
    if (this.commands.has(name)) throw new Error(`Command ${name} already registered`);
    this.commands.set(name, cmd);
    if (cmd.aliases) for (const a of cmd.aliases) this.commands.set(normalizeName(a), cmd);
  }

  private checkPermissions(cmd: Command, ctx: Context) {
    if (!cmd.permissions || cmd.permissions.length === 0) return true;
    const m = ctx.message?.member as any;
    if (!m || !m.permissions) return false;
    const flags = new PermissionsBitField(m.permissions.bitfield ?? m.permissions);
    for (const p of cmd.permissions) {
      try {
        if (!flags.has(p as any)) return false;
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  private findCommandTree(parts: string[]): { cmd: Command | undefined; remaining: string[] } {
    if (parts.length === 0) return { cmd: undefined, remaining: [] };
    let cursor: Command | undefined = this.commands.get(normalizeName(parts[0]));
    let i = 1;
    while (cursor && cursor.subcommands && i < parts.length) {
      const next = cursor.subcommands[normalizeName(parts[i])];
      if (!next) break;
      cursor = next;
      i++;
    }
    return { cmd: cursor, remaining: parts.slice(i) };
  }

  async handleMessage(content: string, ctx: Context) {
    if (!content.startsWith(this.prefix)) return false;
    const without = content.slice(this.prefix.length).trim();
    const parts = without.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return false;
    const { cmd, remaining } = this.findCommandTree(parts);
    if (!cmd) return false;
    ctx.args = remaining;
    if (!this.checkPermissions(cmd, ctx)) {
      this.emit('commandDenied', cmd.name, ctx);
      return true; // considered handled
    }
    try {
      if (!cmd.execute) throw new Error(`Command ${cmd.name} has no execute handler`);
      await Promise.resolve(cmd.execute(ctx));
      this.emit('commandExecuted', cmd.name, ctx);
    } catch (err) {
      this.emit('commandError', cmd.name, err, ctx);
    }
    return true;
  }

  getCommands() {
    // return top-level commands
    const seen = new Set<Command>();
    const out: Command[] = [];
    for (const [k, v] of this.commands) {
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }

  helpText() {
    const cmds = this.getCommands();
    return cmds
      .map((c) => `
${this.prefix}${c.name} ${c.args ? c.args.join(' ') : ''} — ${c.description ?? ''}`)
      .join('\n');
  }
}
