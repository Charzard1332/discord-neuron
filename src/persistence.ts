import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export interface PersistenceAdapter {
  get<T = any>(key: string): Promise<T | undefined>;
  set<T = any>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export class MemoryAdapter implements PersistenceAdapter {
  private map = new Map<string, any>();

  async get<T = any>(key: string) {
    return this.map.get(key) as T | undefined;
  }

  async set<T = any>(key: string, value: T) {
    this.map.set(key, value);
  }

  async delete(key: string) {
    this.map.delete(key);
  }
}

export class FileAdapter implements PersistenceAdapter {
  private file: string;
  private cache: Record<string, any> = {};

  constructor(dir = '.', fileName = 'neuron-store.json') {
    this.file = join(dir, fileName);
  }

  private async load() {
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.cache = JSON.parse(raw);
    } catch (err) {
      this.cache = this.cache || {};
    }
    return this.cache;
  }

  private async persist() {
    if (!this.cache) return;
    await fs.mkdir(dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(this.cache, null, 2), 'utf8');
  }

  async get<T = any>(key: string) {
    const c = await this.load();
    return c[key] as T | undefined;
  }

  async set<T = any>(key: string, value: T) {
    const c = await this.load();
    c[key] = value;
    await this.persist();
  }

  async delete(key: string) {
    const c = await this.load();
    delete c[key];
    await this.persist();
  }
}

export default PersistenceAdapter;
