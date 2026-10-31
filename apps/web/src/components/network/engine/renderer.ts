import { ECOSYSTEMS, type Graph, type GraphNode, type NodeKind } from './graph';
import {
  clusterCentre,
  sceneFrame,
  spreadRadius,
  type SceneFrame,
  type SceneId,
  type SceneOptions,
} from './scenes';

/**
 * Canvas 2D renderer for the IBC network ("the loom"). Pseudo-3D (perspective projection
 * of a rotating point cloud) without WebGL, so it is light, runs on mid-range phones and
 * degrades to a single static frame when motion is reduced.
 */
export interface Stage {
  /** Centre of the network on the canvas, in CSS pixels. */
  cx: number;
  cy: number;
  /** Radius of the unit sphere in CSS pixels. */
  radius: number;
  /** Overall opacity (dim the network behind text on small screens). */
  opacity: number;
}

export interface RendererOptions {
  reducedMotion: boolean;
  interactive: boolean;
  stage: (width: number, height: number, scene: SceneId) => Stage;
  onHover?: (node: GraphNode | null) => void;
}

type Vec3 = [number, number, number];

interface Shuttle {
  edge: number;
  t: number;
  speed: number;
}

const CAMERA = 3.4;
const KIND_LABEL: Record<NodeKind, string> = {
  person: 'Person',
  company: 'Company',
  product: 'Product',
  service: 'Service',
  opportunity: 'Opportunity',
};

function cssColor(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function glowSprite(color: string): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.25, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

const ease = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));

export class NetworkRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly count: number;
  private readonly pos: Float32Array;
  private readonly emphasis: Float32Array;
  private readonly ring: Float32Array;
  private readonly edgeAlpha: Float32Array;
  private readonly edgeDraw: Float32Array;
  private readonly screen: Float32Array; // x, y, scale, depth per node
  private readonly colors: Record<NodeKind, string>;
  private readonly sprites: Record<NodeKind, HTMLCanvasElement>;
  private readonly threadColor: string;
  private readonly shuttleColor: string;
  private readonly trustColor: string;
  private readonly labelColor: string;
  private readonly order: number[];

  private frame: SceneFrame;
  private scene: SceneId = 'formation';
  private width = 0;
  private height = 0;
  private dpr = 1;
  private yaw = 0.6;
  private pitch = 0.18;
  private tilt = 1.02;
  private pointer: { x: number; y: number } | null = null;
  private parallax = { x: 0, y: 0 };
  private hovered = -1;
  private shuttles: Shuttle[] = [];
  private shuttleBudget = 0;
  private labelAlpha = 0;
  private elapsed = 0;
  private sceneElapsed = 0;
  private raf = 0;
  private last = 0;
  private running = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly graph: Graph,
    private readonly options: RendererOptions,
  ) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.count = graph.nodes.length;
    this.pos = new Float32Array(this.count * 3);
    this.emphasis = new Float32Array(this.count);
    this.ring = new Float32Array(this.count);
    this.edgeAlpha = new Float32Array(graph.edges.length);
    this.edgeDraw = new Float32Array(graph.edges.length);
    this.screen = new Float32Array(this.count * 4);
    this.order = graph.nodes.map((node) => node.index);
    this.colors = {
      person: cssColor('--node-person', '#8c9bff'),
      company: cssColor('--node-company', '#eef0fa'),
      product: cssColor('--node-product', '#f4a62a'),
      service: cssColor('--node-service', '#c9a8ff'),
      opportunity: cssColor('--node-opportunity', '#ff7a90'),
    };
    this.sprites = {
      person: glowSprite(this.colors.person),
      company: glowSprite(this.colors.company),
      product: glowSprite(this.colors.product),
      service: glowSprite(this.colors.service),
      opportunity: glowSprite(this.colors.opportunity),
    };
    this.threadColor = cssColor('--periwinkle', '#8c9bff');
    this.shuttleColor = cssColor('--marigold', '#f4a62a');
    this.trustColor = cssColor('--jade', '#39c2a0');
    this.labelColor = cssColor('--chalk', '#eef0fa');

    this.frame = sceneFrame(graph, 'formation');
    // Start every node at its home position, collapsed toward the centre for the opening.
    graph.nodes.forEach((node, i) => {
      const spread = options.reducedMotion ? 1 : 0.35;
      this.pos[i * 3] = node.home[0] * spread;
      this.pos[i * 3 + 1] = node.home[1] * spread;
      this.pos[i * 3 + 2] = node.home[2] * spread;
    });
    if (options.reducedMotion) this.settle();
    this.resize();
  }

  setScene(scene: SceneId, options: SceneOptions = {}): void {
    if (scene === this.scene && scene !== 'focus') return;
    this.scene = scene;
    this.sceneElapsed = 0;
    this.frame = sceneFrame(this.graph, scene, options);
    if (this.options.reducedMotion) {
      this.settle();
      this.draw();
    }
  }

  setPointer(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer = { x: clientX - rect.left, y: clientY - rect.top };
    if (this.options.reducedMotion) this.draw();
  }

  clearPointer(): void {
    this.pointer = null;
    if (this.options.reducedMotion) this.draw();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    // Cap device pixel ratio: beyond 2 the cost grows with no visible gain.
    this.dpr = Math.min(window.devicePixelRatio || 1, this.width < 768 ? 1.75 : 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.draw();
  }

  start(): void {
    if (this.running || this.options.reducedMotion) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.step(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    this.options.onHover?.(null);
  }

  /** Jump straight to the scene's end state (reduced motion). */
  private settle(): void {
    this.elapsed = 1e6;
    this.sceneElapsed = 1e6;
    const { targets, edges } = this.frame;
    targets.forEach((t, i) => {
      this.pos[i * 3] = t.x;
      this.pos[i * 3 + 1] = t.y;
      this.pos[i * 3 + 2] = t.z;
      this.emphasis[i] = t.emphasis;
      this.ring[i] = t.ring;
    });
    this.graph.edges.forEach((edge, i) => {
      this.edgeAlpha[i] = edges[edge.kind];
      this.edgeDraw[i] = 1;
    });
    this.labelAlpha = this.frame.clusterLabels ? 1 : 0;
    this.tilt = this.frame.tilt;
    this.pitch = this.tilt;
    this.shuttles = [];
  }

  private step(dt: number): void {
    this.elapsed += dt;
    this.sceneElapsed += dt;
    const { targets, edges, spin } = this.frame;

    for (let i = 0; i < this.count; i += 1) {
      const t = targets[i]!;
      // Opening: nodes appear in a staggered wave.
      const appear = Math.min(
        1,
        Math.max(0, (this.elapsed - this.graph.nodes[i]!.reveal * 1.1) / 0.45),
      );
      this.pos[i * 3] = ease(this.pos[i * 3]!, t.x, 2.6, dt);
      this.pos[i * 3 + 1] = ease(this.pos[i * 3 + 1]!, t.y, 2.6, dt);
      this.pos[i * 3 + 2] = ease(this.pos[i * 3 + 2]!, t.z, 2.6, dt);
      this.emphasis[i] = ease(this.emphasis[i]!, t.emphasis * appear, 4, dt);
      this.ring[i] = ease(this.ring[i]!, t.ring, 3, dt);
    }

    this.graph.edges.forEach((edge, i) => {
      const target = edges[edge.kind];
      const formationGate = this.elapsed > 0.7 + edge.delay * 1.4 ? 1 : 0;
      this.edgeAlpha[i] = ease(this.edgeAlpha[i]!, target * formationGate, 3, dt);
      if (this.edgeAlpha[i] < 0.02) this.edgeDraw[i] = 0;
      else if (formationGate) this.edgeDraw[i] = Math.min(1, this.edgeDraw[i]! + dt * 1.6);
    });

    this.labelAlpha = ease(this.labelAlpha, this.frame.clusterLabels ? 1 : 0, 3, dt);

    // Camera: idle spin plus gentle parallax toward the pointer.
    const px = this.pointer ? (this.pointer.x / this.width - 0.5) * 2 : 0;
    const py = this.pointer ? (this.pointer.y / this.height - 0.5) * 2 : 0;
    this.parallax.x = ease(this.parallax.x, px, 2, dt);
    this.parallax.y = ease(this.parallax.y, py, 2, dt);
    this.yaw += spin * dt;
    this.tilt = ease(this.tilt, this.frame.tilt, 1.8, dt);
    this.pitch = this.tilt + this.parallax.y * 0.12;

    this.stepShuttles(dt);
  }

  private stepShuttles(dt: number): void {
    const { edges } = this.graph;
    this.shuttleBudget += this.frame.shuttleRate * dt;
    while (this.shuttleBudget >= 1 && this.shuttles.length < 60) {
      this.shuttleBudget -= 1;
      const candidates = edges
        .map((edge, i) => ({ edge, i }))
        .filter(({ edge, i }) =>
          this.frame.shuttlesOnPath
            ? edge.kind === 'path'
            : this.edgeAlpha[i]! > 0.3 && this.edgeDraw[i]! >= 1,
        );
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
      this.shuttles.push({ edge: pick.i, t: 0, speed: 0.35 + Math.random() * 0.35 });
    }
    this.shuttles = this.shuttles.filter((shuttle) => {
      shuttle.t += shuttle.speed * dt;
      return shuttle.t < 1 && this.edgeAlpha[shuttle.edge]! > 0.05;
    });
  }

  private project(): void {
    const stage = this.options.stage(this.width, this.height, this.scene);
    const yaw = this.yaw + this.parallax.x * 0.3;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    for (let i = 0; i < this.count; i += 1) {
      const x = this.pos[i * 3]!;
      const y = this.pos[i * 3 + 1]!;
      const z = this.pos[i * 3 + 2]!;
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const perspective = CAMERA / (CAMERA - z2);
      this.screen[i * 4] = stage.cx + x1 * stage.radius * perspective;
      this.screen[i * 4 + 1] = stage.cy - y1 * stage.radius * perspective;
      this.screen[i * 4 + 2] = perspective;
      // Depth cue: 0 (far) .. 1 (near)
      this.screen[i * 4 + 3] = Math.min(1, Math.max(0, (z2 + 1.3) / 2.6));
    }
  }

  private nodeVisibility(i: number): number {
    const spread = this.frame.spreadFrom;
    let visibility = this.emphasis[i]!;
    if (spread) {
      const home = this.graph.nodes[i]!.home;
      const distance = Math.hypot(home[0] - spread[0], home[1] - spread[1], home[2] - spread[2]);
      const radius = spreadRadius(this.sceneElapsed);
      visibility *= Math.min(1, Math.max(0.08, (radius - distance) * 4 + 0.08));
    }
    if (this.frame.pulse) {
      const home = this.graph.nodes[i]!.home;
      const distance = Math.hypot(home[0], home[1] - 0.3, home[2] - 0.9);
      const wave = (this.sceneElapsed * 0.7) % 2.4;
      visibility = Math.min(
        1,
        visibility * 0.55 + Math.exp(-((distance - wave) ** 2) / 0.03) * 0.9,
      );
    }
    return visibility;
  }

  private draw(): void {
    const { ctx, graph } = this;
    const stage = this.options.stage(this.width, this.height, this.scene);
    ctx.clearRect(0, 0, this.width, this.height);
    this.project();
    ctx.globalAlpha = 1;
    const opacity = stage.opacity;

    const visibility = new Float32Array(this.count);
    for (let i = 0; i < this.count; i += 1) visibility[i] = this.nodeVisibility(i);

    this.updateHover();
    const hoverNeighbours = this.hovered >= 0 ? new Set(graph.neighbours[this.hovered]) : null;

    // Threads
    ctx.lineCap = 'round';
    graph.edges.forEach((edge, i) => {
      const alpha = this.edgeAlpha[i]!;
      const drawn = this.edgeDraw[i]!;
      if (alpha < 0.01 || drawn <= 0) return;
      const ax = this.screen[edge.a * 4]!;
      const ay = this.screen[edge.a * 4 + 1]!;
      const bx = this.screen[edge.b * 4]!;
      const by = this.screen[edge.b * 4 + 1]!;
      const depth = (this.screen[edge.a * 4 + 3]! + this.screen[edge.b * 4 + 3]!) / 2;
      const ends = Math.min(visibility[edge.a]!, visibility[edge.b]!);
      const highlighted = this.hovered >= 0 && (edge.a === this.hovered || edge.b === this.hovered);
      // Long threads recede so the local weave reads clearly.
      const length = Math.hypot(bx - ax, by - ay) / stage.radius;
      const lengthFade = Math.min(1, Math.max(0.12, 1.35 - length * 0.85));
      let a = alpha * ends * (0.12 + depth * 0.4) * opacity * lengthFade;
      if (edge.kind === 'path') a = alpha * opacity * 0.9;
      if (highlighted) a = Math.min(1, a * 3 + 0.25);
      if (a < 0.008) return;
      const [cxp, cyp] = this.control(ax, ay, bx, by, stage);
      ctx.strokeStyle = edge.kind === 'path' ? this.shuttleColor : this.threadColor;
      ctx.globalAlpha = a;
      ctx.lineWidth = edge.kind === 'path' ? 1.8 : highlighted ? 1.4 : 0.9;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      if (drawn >= 1) {
        ctx.quadraticCurveTo(cxp, cyp, bx, by);
      } else {
        // Partial quadratic (de Casteljau split) so threads are drawn in, not faded in.
        const t = drawn;
        const q1x = ax + (cxp - ax) * t;
        const q1y = ay + (cyp - ay) * t;
        const q2x = cxp + (bx - cxp) * t;
        const q2y = cyp + (by - cyp) * t;
        ctx.quadraticCurveTo(q1x, q1y, q1x + (q2x - q1x) * t, q1y + (q2y - q1y) * t);
      }
      ctx.stroke();
    });

    // Shuttles carry the motion of commerce along the threads.
    ctx.fillStyle = this.shuttleColor;
    for (const shuttle of this.shuttles) {
      const edge = graph.edges[shuttle.edge]!;
      const ax = this.screen[edge.a * 4]!;
      const ay = this.screen[edge.a * 4 + 1]!;
      const bx = this.screen[edge.b * 4]!;
      const by = this.screen[edge.b * 4 + 1]!;
      const [cxp, cyp] = this.control(ax, ay, bx, by, stage);
      for (let trail = 0; trail < 3; trail += 1) {
        const t = Math.max(0, shuttle.t - trail * 0.025);
        const u = 1 - t;
        const x = u * u * ax + 2 * u * t * cxp + t * t * bx;
        const y = u * u * ay + 2 * u * t * cyp + t * t * by;
        ctx.globalAlpha =
          (1 - trail * 0.35) *
          this.edgeAlpha[shuttle.edge]! *
          opacity *
          Math.sin(Math.PI * shuttle.t);
        ctx.beginPath();
        ctx.arc(x, y, 1.9 - trail * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Knots (nodes), far to near.
    this.order.sort((p, q) => this.screen[p * 4 + 3]! - this.screen[q * 4 + 3]!);
    for (const i of this.order) {
      const node = graph.nodes[i]!;
      let v = visibility[i]!;
      if (hoverNeighbours && (i === this.hovered || hoverNeighbours.has(i))) v = Math.max(v, 1);
      if (v < 0.01) continue;
      const x = this.screen[i * 4]!;
      const y = this.screen[i * 4 + 1]!;
      const perspective = this.screen[i * 4 + 2]!;
      const depth = this.screen[i * 4 + 3]!;
      const core = (1.4 + v * 1.9) * perspective * (i === this.hovered ? 1.7 : 1);
      const alpha = v * (0.35 + depth * 0.65) * opacity;
      if (v > 0.45) {
        const glow = core * 7;
        ctx.globalAlpha = alpha * 0.8;
        ctx.drawImage(this.sprites[node.kind], x - glow / 2, y - glow / 2, glow, glow);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.colors[node.kind];
      ctx.beginPath();
      ctx.arc(x, y, core, 0, Math.PI * 2);
      ctx.fill();
      const ring = this.ring[i]!;
      if (ring > 0.02) {
        ctx.globalAlpha = ring * alpha;
        ctx.strokeStyle = this.trustColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, core + 3.5 * perspective, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    this.drawClusterLabels(stage);
    this.drawHoverLabel(opacity);
    ctx.globalAlpha = 1;
  }

  private control(ax: number, ay: number, bx: number, by: number, stage: Stage): [number, number] {
    // Threads bow outward from the centre, like warp threads under tension.
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    return [mx + (mx - stage.cx) * 0.14, my + (my - stage.cy) * 0.14];
  }

  private drawClusterLabels(stage: Stage): void {
    if (this.labelAlpha < 0.02) return;
    const { ctx } = this;
    const yaw = this.yaw + this.parallax.x * 0.3;
    ctx.font = `600 ${this.width < 768 ? 12 : 14}px ${cssColor('--font-sans', 'sans-serif')}`;
    ctx.textAlign = 'center';
    ECOSYSTEMS.forEach((name, cluster) => {
      const [x, y, z] = clusterCentre(cluster);
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const y1 = y * Math.cos(this.pitch) - z1 * Math.sin(this.pitch);
      const z2 = y * Math.sin(this.pitch) + z1 * Math.cos(this.pitch);
      const perspective = CAMERA / (CAMERA - z2);
      const sx = stage.cx + x1 * stage.radius * perspective;
      const sy = stage.cy - y1 * stage.radius * perspective + 0.32 * stage.radius * perspective;
      ctx.globalAlpha = this.labelAlpha * stage.opacity * 0.9;
      ctx.fillStyle = this.labelColor;
      ctx.fillText(name, sx, sy);
    });
    ctx.textAlign = 'start';
  }

  private updateHover(): void {
    let hovered = -1;
    if (this.options.interactive && this.pointer) {
      let best = 22 * 22;
      for (let i = 0; i < this.count; i += 1) {
        if (this.emphasis[i]! < 0.3) continue;
        const dx = this.screen[i * 4]! - this.pointer.x;
        const dy = this.screen[i * 4 + 1]! - this.pointer.y;
        const d = dx * dx + dy * dy;
        if (d < best) {
          best = d;
          hovered = i;
        }
      }
    }
    if (hovered !== this.hovered) {
      this.hovered = hovered;
      this.options.onHover?.(hovered >= 0 ? this.graph.nodes[hovered]! : null);
    }
  }

  private drawHoverLabel(opacity: number): void {
    if (this.hovered < 0) return;
    const { ctx } = this;
    const node = this.graph.nodes[this.hovered]!;
    const x = this.screen[this.hovered * 4]! + 14;
    const y = this.screen[this.hovered * 4 + 1]! - 14;
    const font = cssColor('--font-sans', 'sans-serif');
    ctx.globalAlpha = Math.max(0.85, opacity);
    ctx.font = `600 14px ${font}`;
    const titleWidth = ctx.measureText(node.label).width;
    ctx.font = `400 12px ${font}`;
    const kindWidth = ctx.measureText(KIND_LABEL[node.kind]).width;
    const w = Math.max(titleWidth, kindWidth) + 24;
    ctx.fillStyle = 'rgba(15, 22, 64, 0.92)';
    ctx.strokeStyle = this.colors[node.kind];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y - 40, w, 46, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.labelColor;
    ctx.font = `600 14px ${font}`;
    ctx.fillText(node.label, x + 12, y - 20);
    ctx.fillStyle = this.colors[node.kind];
    ctx.font = `400 12px ${font}`;
    ctx.fillText(KIND_LABEL[node.kind], x + 12, y - 4);
  }
}

export type { Vec3 };
