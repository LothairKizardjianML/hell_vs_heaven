// Fixed-timestep loop utility. Phaser drives rendering via its own RAF loop;
// this is intended for headless gameplay simulation (tests, replays, server
// authority later). Decouples logic rate from frame rate.

export interface FixedLoopOptions {
  fixedStepMs: number;
  maxSubSteps: number;
  onStep: (dtSec: number) => void;
  onRender?: (alpha: number) => void;
}

export class FixedLoop {
  private acc = 0;
  private last = 0;
  private running = false;
  private rafId = 0;

  constructor(private readonly opts: FixedLoopOptions) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  // Manual stepping for tests.
  step(dtSec: number): void {
    this.opts.onStep(dtSec);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const frame = Math.min(now - this.last, 250);
    this.last = now;
    this.acc += frame;

    const step = this.opts.fixedStepMs;
    let steps = 0;
    while (this.acc >= step && steps < this.opts.maxSubSteps) {
      this.opts.onStep(step / 1000);
      this.acc -= step;
      steps++;
    }
    if (steps === this.opts.maxSubSteps) this.acc = 0;
    this.opts.onRender?.(this.acc / step);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
