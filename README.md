# discord-neuron

Neuron is a TypeScript-first, modular framework for building Discord bots.

Features (initial scaffold):
- Modular plugin system
- Middleware pipeline for message/event processing
- Simple but effective token-bucket rate limiter
- Command registry for prefix commands
- Shard manager wrapper (thin)
- TypeScript types and build config

Quick start:

1. Install peer dependency and dev tools:

```bash
npm install discord.js
npm install -D typescript @types/node
```

2. Build and run the example (set `DISCORD_TOKEN`):

```bash
npm run build
DISCORD_TOKEN=your_token node dist/example/bot.js
```

**What's New**

This scaffold has grown into a full-featured, TypeScript-first framework that helps you build production-ready Discord bots. Key additions in this repository:

- **Slash Command Builder:** `src/slash.ts` provides a `SlashBuilder` and registry to define typed slash commands and sync them to Discord via a pluggable REST helper.
- **Persistent Storage Adapters:** `src/persistence.ts` includes `MemoryAdapter` and `FileAdapter` implementations and an adapter interface for custom stores.
- **Interactive Dialog Flows:** `src/conversation.ts` and `src/dialog.ts` provide `ConversationManager` and `DialogFlow` to author multi-step, stateful user dialogs with persistence and timeouts.
- **AI-Assisted Intent Mapping:** `src/intent.ts` contains a pluggable `IntentAdapter` interface and a `MockIntentAdapter`; `src/intentOpenAI.ts` is an optional OpenAI-backed adapter scaffold.
- **Robust Sharding Strategies:** `src/shardManager.ts` wraps `discord.js` sharding with simple strategy support for auto/manual spawn modes.
- **Observability & Metrics:** `src/metrics.ts` and `src/metricsServer.ts` give you counters/gauges and an HTTP `/metrics` endpoint ready for Prometheus scraping.
- **Plugin Marketplace:** `src/marketplace.ts` allows local and remote plugin manifests and a simple `require`-based loader for opt-in plugin ecosystems.

**Quick Start**

- Install peer and dev dependencies:

```bash
npm install discord.js
npm install -D typescript @types/node
```

- Build the package (produces `dist/`):

```bash
npm run build
```

- Example bot (requires `DISCORD_TOKEN`):

```bash
DISCORD_TOKEN=your_token node dist/example/bot.js
```

**Examples & Usage**

- Register a slash command using the builder API:

```ts
// in your setup code
const builder = neuron.slash.builder('echo', 'Echo a message')
	.addOption({ name: 'text', description: 'Text to echo', required: true })
	.setExecute(async (interaction) => { /* reply to interaction */ })
neuron.slash.register(builder.build());
```

- Start a dialog flow (multi-step conversation):

```ts
const flow = new DialogFlow(neuron.conversation, neuron.persistence);
flow.addStep({ id: 'name', prompt: 'What is your name?' });
flow.addStep({ id: 'age', prompt: 'How old are you?', validate: m => !isNaN(Number(m.content)), transform: m => Number(m.content) });
// start in response to a message
flow.start(message, 'onboard');
```

- Use intent mapping to route ambiguous messages:

```ts
const intent = await neuron.intent.analyze('how do I use the bot?');
if (intent.intent === 'help') showHelp();
```

- Expose metrics (Prometheus):

```ts
const server = new MetricsServer(neuron.metrics);
server.start(9464);
```

**Advanced options**

- OpenAI adapter: set `OPENAI_API_KEY` and plug `OpenAIIntentAdapter` into `neuron.intent` to enable cloud-assisted intent extraction. The adapter is provided as an optional integration (see `src/intentOpenAI.ts`).
- Slash sync: the `SlashManager.syncWithApi(rest, applicationId, guildId?)` method expects a REST client with a `put` method (for example `@discordjs/rest`). This keeps the core package dependency-free and lets you opt into a concrete REST implementation.
- Plugin marketplace: provide a `neuron-plugins.json` in a folder or point to a remote manifest to discover plugins. Loading plugins uses `require(manifest.entry)` and should only be done with trusted sources.

**Development**

- Run the TypeScript build and watch mode (useful in development):

```bash
npm run build
# (or use your editor's TS watch)
```

- Run tests (if added):

```bash
# npm test  # future: we will add Jest tests for core modules
```
