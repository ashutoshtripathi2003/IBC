import { ECOSYSTEMS, type Graph, type NodeKind } from './graph';

/**
 * Scenes are declarative descriptions of what the network should look like. The renderer
 * eases from the current state toward the active scene, so changing scenes is always a
 * continuous re-weaving of the same network rather than a cut.
 */
export const SCENE_IDS = [
  'formation',
  'fragmented',
  'woven',
  'discover',
  'connect',
  'trade',
  'trust',
  'intelligence',
  'global',
  'focus',
] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export interface SceneOptions {
  /** For the `focus` scene: the node kind to bring forward. */
  focusKind?: NodeKind;
}

export interface NodeTarget {
  x: number;
  y: number;
  z: number;
  /** 0 = receded, 1 = fully present. */
  emphasis: number;
  /** Verification ring strength (trust scene). */
  ring: number;
}

export interface SceneFrame {
  targets: NodeTarget[];
  /** Visibility per edge kind. */
  edges: { local: number; cross: number; path: number };
  /** Radians per second of idle rotation. */
  spin: number;
  /** Camera pitch in radians (0 = side-on; ~1 = looking down onto the ring). */
  tilt: number;
  /** Shuttles (particles) per second travelling along threads. */
  shuttleRate: number;
  /** Restrict shuttles to the trade path. */
  shuttlesOnPath: boolean;
  /** Draw ecosystem labels at cluster centres. */
  clusterLabels: boolean;
  /** Ripple pulses emanating from the centre (intelligence scene). */
  pulse: boolean;
  /** Reveal nodes progressively outward from an origin (global scene). */
  spreadFrom: readonly [number, number, number] | null;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Positions of the six ecosystem clusters (fragmented scene), on a tilted ring. */
export function clusterCentre(cluster: number): [number, number, number] {
  const angle = (cluster / ECOSYSTEMS.length) * Math.PI * 2 + Math.PI / 6;
  return [Math.cos(angle) * 0.85, Math.sin(angle) * 0.6, Math.sin(angle) * 0.3];
}

// Maharashtra on a unit globe (≈19°N, 75°E), the origin of the global spread.
const lat = (19 * Math.PI) / 180;
const lon = (75 * Math.PI) / 180;
export const GLOBAL_ORIGIN: readonly [number, number, number] = [
  Math.cos(lat) * Math.sin(lon),
  Math.sin(lat),
  Math.cos(lat) * Math.cos(lon),
];

export function sceneFrame(graph: Graph, scene: SceneId, options: SceneOptions = {}): SceneFrame {
  const { nodes, tradePath } = graph;
  const base: Omit<SceneFrame, 'targets'> = {
    edges: { local: 0.55, cross: 0.55, path: 0 },
    spin: 0.05,
    tilt: 0.18,
    shuttleRate: 3,
    shuttlesOnPath: false,
    clusterLabels: false,
    pulse: false,
    spreadFrom: null,
  };
  const onSphere = (index: number, scale = 1, emphasis = 1) => {
    const [x, y, z] = nodes[index]!.home;
    return { x: x * scale, y: y * scale, z: z * scale, emphasis, ring: 0 };
  };

  switch (scene) {
    case 'formation':
      // The Circle: the network woven into a ring, like yarn wound on a spindle. Sphere
      // longitude becomes the angle around the ring and latitude the angle around the tube,
      // so threads between neighbours stay short.
      return {
        ...base,
        spin: 0.07,
        tilt: 1.02,
        shuttleRate: 5,
        targets: nodes.map((n) => {
          const [hx, hy, hz] = n.home;
          const u = Math.atan2(hz, hx);
          const v = Math.asin(Math.max(-1, Math.min(1, hy))) * 2;
          const tube = 0.13;
          const radial = 1 + tube * Math.cos(v);
          return {
            x: radial * Math.cos(u),
            y: tube * Math.sin(v),
            z: radial * Math.sin(u),
            emphasis: 1,
            ring: 0,
          };
        }),
      };

    case 'fragmented':
      return {
        ...base,
        edges: { local: 0.7, cross: 0, path: 0 },
        spin: 0.02,
        shuttleRate: 0,
        clusterLabels: true,
        targets: nodes.map((n) => {
          const [cx, cy, cz] = clusterCentre(n.cluster);
          const [hx, hy, hz] = n.home;
          return {
            x: cx + hx * 0.22,
            y: cy + hy * 0.22,
            z: cz + hz * 0.22,
            emphasis: 0.85,
            ring: 0,
          };
        }),
      };

    case 'woven': {
      // A loom: nodes laid on a gently rippling cloth of warp and weft.
      const columns = Math.ceil(Math.sqrt(nodes.length * 1.6));
      return {
        ...base,
        edges: { local: 0.6, cross: 0.85, path: 0 },
        spin: 0.03,
        tilt: 0.42,
        shuttleRate: 6,
        targets: nodes.map((n) => {
          const col = n.index % columns;
          const row = Math.floor(n.index / columns);
          const rows = Math.ceil(nodes.length / columns);
          const x = (col / (columns - 1) - 0.5) * 1.9;
          const z = (row / Math.max(1, rows - 1) - 0.5) * 1.3;
          const y = Math.sin(x * 2.2 + z * 1.4) * 0.16 + (n.kind === 'company' ? 0.06 : 0);
          return { x, y, z, emphasis: 1, ring: 0 };
        }),
      };
    }

    case 'discover': {
      // A search for suppliers: companies and products that match come forward.
      return {
        ...base,
        edges: { local: 0.25, cross: 0.35, path: 0 },
        spin: 0.025,
        shuttleRate: 1,
        targets: nodes.map((n) => {
          const match = (n.kind === 'company' || n.kind === 'product') && n.reveal < 0.42;
          return onSphere(n.index, match ? 1.08 : 0.92, match ? 1 : 0.18);
        }),
      };
    }

    case 'connect':
      return {
        ...base,
        edges: { local: 0.5, cross: 1, path: 0 },
        spin: 0.035,
        shuttleRate: 5,
        targets: nodes.map((n) =>
          onSphere(n.index, 1, n.kind === 'person' || n.kind === 'company' ? 1 : 0.3),
        ),
      };

    case 'trade': {
      const onPath = new Map(tradePath.map((index, step) => [index, step]));
      return {
        ...base,
        edges: { local: 0.12, cross: 0.12, path: 1 },
        spin: 0,
        shuttleRate: 7,
        shuttlesOnPath: true,
        targets: nodes.map((n) => {
          const step = onPath.get(n.index);
          if (step === undefined) return onSphere(n.index, 1.25, 0.12);
          // The journey is laid out as a gentle arc across the stage.
          const t = step / Math.max(1, tradePath.length - 1);
          return {
            x: (t - 0.5) * 2.2,
            y: Math.sin(t * Math.PI) * 0.35 - 0.1,
            z: 0.4,
            emphasis: 1,
            ring: 0,
          };
        }),
      };
    }

    case 'trust':
      return {
        ...base,
        edges: { local: 0.4, cross: 0.4, path: 0 },
        spin: 0.03,
        shuttleRate: 2,
        targets: nodes.map((n) => ({
          ...onSphere(n.index, 1, n.verified ? 1 : 0.35),
          ring: n.verified ? 1 : 0,
        })),
      };

    case 'intelligence':
      return {
        ...base,
        edges: { local: 0.5, cross: 0.7, path: 0 },
        spin: 0.06,
        shuttleRate: 10,
        pulse: true,
        targets: nodes.map((n) => onSphere(n.index, 0.9)),
      };

    case 'global':
      return {
        ...base,
        edges: { local: 0.45, cross: 0.65, path: 0 },
        spin: 0.08,
        tilt: 0.3,
        shuttleRate: 6,
        spreadFrom: GLOBAL_ORIGIN,
        targets: nodes.map((n) => onSphere(n.index, 1.12)),
      };

    case 'focus': {
      const kind = options.focusKind ?? 'company';
      return {
        ...base,
        spin: 0.04,
        targets: nodes.map((n) =>
          onSphere(n.index, n.kind === kind ? 1.05 : 0.95, n.kind === kind ? 1 : 0.25),
        ),
      };
    }
  }
}

/** Fraction of nodes revealed by the global spread at a given time (seconds). */
export function spreadRadius(elapsedSeconds: number): number {
  // Angular distance on the unit sphere ranges 0..2 (chord length); spread over ~3s.
  return clamp01(elapsedSeconds / 3.2) * 2.05;
}
