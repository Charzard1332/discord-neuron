/**
 * Very small metrics collector that outputs Prometheus-style metrics on demand.
 */

type CounterMap = Record<string, number>;
type GaugeMap = Record<string, number>;

export class Metrics {
  private counters: CounterMap = {};
  private gauges: GaugeMap = {};

  inc(name: string, by = 1) {
    this.counters[name] = (this.counters[name] || 0) + by;
  }

  gauge(name: string, value: number) {
    this.gauges[name] = value;
  }

  reset() {
    this.counters = {};
    this.gauges = {};
  }

  scrape() {
    const lines: string[] = [];
    for (const k of Object.keys(this.counters)) lines.push(`${k} ${this.counters[k]}`);
    for (const k of Object.keys(this.gauges)) lines.push(`${k} ${this.gauges[k]}`);
    return lines.join('\n');
  }
}

export default Metrics;
