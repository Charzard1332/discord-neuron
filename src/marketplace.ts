import { promises as fs } from 'fs';
import { join } from 'path';

export type PluginManifest = {
  name: string;
  version: string;
  description?: string;
  entry: string; // path to require
};

export class PluginMarketplace {
  private registry: PluginManifest[] = [];

  async loadLocal(dir: string) {
    const p = join(dir, 'neuron-plugins.json');
    try {
      const raw = await fs.readFile(p, 'utf8');
      const parsed = JSON.parse(raw) as PluginManifest[];
      this.registry.push(...parsed);
      return parsed;
    } catch (err) {
      return [];
    }
  }

  async fetchRemote(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch remote manifest');
    const parsed = (await res.json()) as PluginManifest[];
    this.registry.push(...parsed);
    return parsed;
  }

  getAll() {
    return Array.from(this.registry);
  }

  async load(manifest: PluginManifest) {
    // load using require; consumer is responsible for trusting sources
    // manifest.entry is a path or package name
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const loaded = require(manifest.entry);
    return loaded;
  }
}

export default PluginMarketplace;
