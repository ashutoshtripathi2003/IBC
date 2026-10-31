import { describe, expect, it } from 'vitest';
import { createGraph, ECOSYSTEMS, NODE_KINDS } from './graph';
import { SCENE_IDS, sceneFrame } from './scenes';

describe('network graph', () => {
  const graph = createGraph({ nodeCount: 120 });

  it('is deterministic for a seed', () => {
    const again = createGraph({ nodeCount: 120 });
    expect(again.nodes.map((n) => n.kind)).toEqual(graph.nodes.map((n) => n.kind));
    expect(again.edges).toEqual(graph.edges);
  });

  it('contains every node kind and ecosystem', () => {
    expect(new Set(graph.nodes.map((n) => n.kind))).toEqual(new Set(NODE_KINDS));
    expect(new Set(graph.nodes.map((n) => n.cluster)).size).toBe(ECOSYSTEMS.length);
  });

  it('has threads within and across ecosystems, without duplicates or self-loops', () => {
    const keys = graph.edges.map((e) => [Math.min(e.a, e.b), Math.max(e.a, e.b)].join(':'));
    expect(new Set(keys).size).toBe(keys.length);
    expect(graph.edges.every((e) => e.a !== e.b)).toBe(true);
    for (const edge of graph.edges.filter((e) => e.kind === 'local')) {
      expect(graph.nodes[edge.a]!.cluster).toBe(graph.nodes[edge.b]!.cluster);
    }
    expect(graph.edges.some((e) => e.kind === 'cross')).toBe(true);
  });

  it('lays out a connected trade journey from a person back to a person', () => {
    expect(graph.tradePath.length).toBe(7);
    expect(graph.nodes[graph.tradePath[0]!]!.kind).toBe('person');
    const pathEdges = graph.edges.filter((e) => e.kind === 'path');
    expect(pathEdges).toHaveLength(6);
  });

  it('produces a full, finite target for every node in every scene', () => {
    for (const scene of SCENE_IDS) {
      const frame = sceneFrame(graph, scene, { focusKind: 'product' });
      expect(frame.targets).toHaveLength(graph.nodes.length);
      for (const t of frame.targets) {
        expect([t.x, t.y, t.z, t.emphasis, t.ring].every(Number.isFinite)).toBe(true);
        expect(t.emphasis).toBeGreaterThanOrEqual(0);
        expect(t.emphasis).toBeLessThanOrEqual(1);
      }
    }
  });

  it('separates ecosystems before IBC and weaves them after', () => {
    expect(sceneFrame(graph, 'fragmented').edges.cross).toBe(0);
    expect(sceneFrame(graph, 'woven').edges.cross).toBeGreaterThan(0.5);
  });
});
