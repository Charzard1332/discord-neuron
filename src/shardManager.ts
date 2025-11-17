import { ShardingManager } from 'discord.js';

export type ShardStrategy = 'auto' | 'manual';

export class ShardManagerWrapper {
  private manager: any;

  create(token: string, path = 'dist/example/bot.js', totalShards?: number) {
    // Keep manager typed as any to avoid tight coupling on versions
    this.manager = new ShardingManager(path, { token, totalShards } as any);
    return this.manager;
  }

  async spawn(strategy: ShardStrategy = 'auto', opts?: { totalShards?: number; respawn?: boolean }) {
    if (!this.manager) throw new Error('Shard manager not created');
    // discord.js will use recommended shard count when spawn() is called without amount
    if (strategy === 'auto') {
      // spawn with auto (let discord.js pick recommended shards)
      return this.manager.spawn({ respawn: opts?.respawn ?? false });
    }
    return this.manager.spawn({ amount: opts?.totalShards, respawn: opts?.respawn ?? false });
  }

  get() {
    return this.manager;
  }
}
