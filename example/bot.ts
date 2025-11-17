import Neuron from '../src/index';

const neuron = new Neuron({ prefix: '!' });

neuron.registerCommand({
  name: 'ping',
  description: 'Replies with pong',
  execute: async (ctx: any) => {
    await ctx.message.reply('Pong!');
  }
});

neuron.use(async (ctx, next) => {
  // Example middleware: logging + basic guard
  console.log(`Message from ${ctx.message.author.tag}: ${ctx.message.content}`);
  await next();
});

if (require.main === module) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('Set DISCORD_TOKEN to run the example.');
    process.exit(1);
  }
  neuron.login(token).then(() => console.log('Neuron bot running.'));
}
