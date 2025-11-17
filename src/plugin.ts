import type { Plugin } from './types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    if (this.plugins.has(plugin.name)) throw new Error(`Plugin ${plugin.name} already registered`);
    this.plugins.set(plugin.name, plugin);
  }

  async initAll(neuron: any) {
    for (const p of this.plugins.values()) {
      if (p.init) await p.init(neuron);
    }
  }

  async teardownAll() {
    for (const p of this.plugins.values()) {
      if (p.teardown) await p.teardown();
    }
  }

  get(name: string) {
    return this.plugins.get(name);
  }
}
