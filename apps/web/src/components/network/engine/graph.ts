/**
 * The IBC business graph model used by the network visualisation.
 * Deterministic (seeded) so server, client and tests agree on the same picture.
 */
export const NODE_KINDS = ['person', 'company', 'product', 'service', 'opportunity'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

/** The six fragmented ecosystems shown before IBC weaves them together. */
export const ECOSYSTEMS = [
  'People',
  'Businesses',
  'Suppliers',
  'Buyers',
  'Products',
  'Platforms',
] as const;

export interface GraphNode {
  index: number;
  kind: NodeKind;
  /** Ecosystem cluster (index into ECOSYSTEMS) used by the fragmented scene. */
  cluster: number;
  label: string;
  /** Unit-sphere home position (fibonacci lattice) used by cloud-like scenes. */
  home: readonly [number, number, number];
  /** Order in which the node appears during formation (0..1). */
  reveal: number;
  /** Whether the node is shown as verified in the trust scene. */
  verified: boolean;
}

export type EdgeKind = 'local' | 'cross' | 'path';

export interface GraphEdge {
  a: number;
  b: number;
  kind: EdgeKind;
  /** Stagger for draw-in animations (0..1). */
  delay: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Node indices forming the RFQ → delivery journey, in order. */
  tradePath: number[];
  neighbours: number[][];
}

/** mulberry32: tiny deterministic PRNG. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LABELS: Record<NodeKind, readonly string[]> = {
  person: [
    'Founder',
    'Sourcing lead',
    'Export manager',
    'Consultant',
    'Engineer',
    'Buyer',
    'Designer',
  ],
  company: [
    'Textile mill',
    'Auto components maker',
    'Logistics firm',
    'Pharma distributor',
    'Agri exporter',
    'Software studio',
  ],
  product: [
    'Organic cotton yarn',
    'CNC parts',
    'Spices',
    'Solar panels',
    'Packaging film',
    'Machined castings',
  ],
  service: [
    'Freight forwarding',
    'Quality inspection',
    'Trade finance',
    'Compliance advisory',
    'Warehousing',
  ],
  opportunity: [
    'Open RFQ',
    'Distributor wanted',
    'Joint venture',
    'Export order',
    'Hiring partner',
  ],
};

// Relative frequency of each kind in the picture.
const KIND_WEIGHTS: readonly [NodeKind, number][] = [
  ['person', 0.34],
  ['company', 0.26],
  ['product', 0.2],
  ['service', 0.12],
  ['opportunity', 0.08],
];

function pickKind(r: number): NodeKind {
  let acc = 0;
  for (const [kind, weight] of KIND_WEIGHTS) {
    acc += weight;
    if (r < acc) return kind;
  }
  return 'person';
}

function clusterFor(kind: NodeKind, r: number): number {
  // People / Businesses / Suppliers / Buyers / Products / Platforms
  switch (kind) {
    case 'person':
      return r < 0.75 ? 0 : 3;
    case 'company':
      return r < 0.5 ? 1 : r < 0.8 ? 2 : 3;
    case 'product':
      return r < 0.7 ? 4 : 2;
    case 'service':
      return r < 0.6 ? 5 : 2;
    case 'opportunity':
      return r < 0.5 ? 3 : 5;
  }
}

function fibonacciSphere(i: number, n: number): [number, number, number] {
  const y = 1 - (2 * (i + 0.5)) / n;
  const radius = Math.sqrt(1 - y * y);
  const theta = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(theta) * radius, y, Math.sin(theta) * radius];
}

const distance = (p: readonly number[], q: readonly number[]) =>
  Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);

export function createGraph(options: { nodeCount: number; seed?: number }): Graph {
  const random = createRandom(options.seed ?? 20_26);
  const n = Math.max(24, options.nodeCount);
  const nodes: GraphNode[] = [];
  for (let i = 0; i < n; i += 1) {
    const kind = pickKind(random());
    const labels = LABELS[kind];
    nodes.push({
      index: i,
      kind,
      cluster: clusterFor(kind, random()),
      label: labels[Math.floor(random() * labels.length)]!,
      home: fibonacciSphere(i, n),
      reveal: random(),
      verified: random() < 0.62,
    });
  }

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addEdge = (a: number, b: number, kind: EdgeKind) => {
    if (a === b) return;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) {
      // The trade journey takes over an existing thread rather than duplicating it.
      if (kind === 'path') {
        const existing = edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
        if (existing) existing.kind = 'path';
      }
      return;
    }
    seen.add(key);
    edges.push({ a, b, kind, delay: random() });
  };

  // Local threads: each node to its two nearest neighbours within the same ecosystem.
  for (const node of nodes) {
    const nearest = nodes
      .filter((other) => other.cluster === node.cluster && other.index !== node.index)
      .sort((p, q) => distance(p.home, node.home) - distance(q.home, node.home))
      .slice(0, 2);
    for (const other of nearest) addEdge(node.index, other.index, 'local');
  }
  // Cross threads: what IBC adds — links between different ecosystems.
  for (const node of nodes) {
    if (random() > 0.55) continue;
    const candidates = nodes
      .filter((other) => other.cluster !== node.cluster)
      .sort((p, q) => distance(p.home, node.home) - distance(q.home, node.home))
      .slice(0, 4);
    const other = candidates[Math.floor(random() * candidates.length)];
    if (other) addEdge(node.index, other.index, 'cross');
  }

  // Trade journey: person → company → product → … → company, spread across the sphere.
  const sequence: NodeKind[] = [
    'person',
    'company',
    'product',
    'company',
    'service',
    'company',
    'person',
  ];
  const tradePath: number[] = [];
  sequence.forEach((kind, step) => {
    const target = Math.floor(((step + 0.5) / sequence.length) * n);
    let best = -1;
    for (let offset = 0; offset < n && best < 0; offset += 1) {
      for (const candidate of [target + offset, target - offset]) {
        const node = nodes[candidate];
        if (node?.kind === kind && !tradePath.includes(candidate)) {
          best = candidate;
          break;
        }
      }
    }
    if (best >= 0) tradePath.push(best);
  });
  for (let i = 1; i < tradePath.length; i += 1) addEdge(tradePath[i - 1]!, tradePath[i]!, 'path');

  const neighbours: number[][] = nodes.map(() => []);
  for (const edge of edges) {
    neighbours[edge.a]!.push(edge.b);
    neighbours[edge.b]!.push(edge.a);
  }
  return { nodes, edges, tradePath, neighbours };
}
