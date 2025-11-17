import { createServer, IncomingMessage, ServerResponse } from 'http';
import type { Metrics as MetricsClass } from './metrics';

export class MetricsServer {
  private metrics: MetricsClass;
  private server: ReturnType<typeof createServer> | null = null;

  constructor(metrics: MetricsClass) {
    this.metrics = metrics;
  }

  start(port = 9464): void {
    if (this.server) throw new Error('Metrics server already started');
    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.end(this.metrics.scrape());
        return;
      }
      if (req.url === '/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    this.server.listen(port);
  }

  stop() {
    if (!this.server) return;
    this.server.close();
    this.server = null;
  }
}

export default MetricsServer;
