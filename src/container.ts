export class Container {
  private map = new Map<string | symbol, any>();

  register<T = any>(key: string | symbol, value: T) {
    if (this.map.has(key)) throw new Error(`Service ${String(key)} already registered`);
    this.map.set(key, value);
  }

  resolve<T = any>(key: string | symbol): T {
    const v = this.map.get(key);
    if (v === undefined) throw new Error(`Service ${String(key)} not found`);
    return v as T;
  }

  has(key: string | symbol) {
    return this.map.has(key);
  }
}

export default Container;
