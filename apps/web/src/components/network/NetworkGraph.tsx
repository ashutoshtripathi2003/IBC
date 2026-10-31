'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';
import { usePrefersReducedMotion } from '@/lib/motion/hooks';
import { createGraph, NetworkRenderer, type NodeKind, type SceneId, type Stage } from './engine';
import styles from './NetworkGraph.module.css';

export interface NetworkGraphProps {
  scene: SceneId;
  focusKind?: NodeKind;
  /** `stage`: fixed behind the page. `inline`: fills its parent box. */
  variant?: 'stage' | 'inline';
  interactive?: boolean;
  className?: string | undefined;
}

function nodeCountFor(width: number): number {
  if (width < 768) return 78;
  if (width < 1200) return 115;
  return 150;
}

function stageLayout(variant: 'stage' | 'inline') {
  return (w: number, h: number, scene: SceneId): Stage => {
    if (variant === 'inline')
      return { cx: w / 2, cy: h / 2, radius: Math.min(w, h) * 0.38, opacity: 1 };
    const ring = scene === 'formation';
    if (w < 768) {
      // Phones: the network sits in the upper part of the screen and recedes behind text.
      return ring
        ? { cx: w * 0.5, cy: Math.min(h * 0.2, w * 0.45), radius: w * 0.3, opacity: 0.95 }
        : { cx: w * 0.5, cy: h * 0.28, radius: w * 0.4, opacity: 0.3 };
    }
    if (w < 1024)
      return { cx: w * 0.64, cy: h * 0.48, radius: w * (ring ? 0.24 : 0.3), opacity: 0.7 };
    if (scene === 'trade') {
      // The journey arc sits above the step cards, beside the heading.
      return { cx: w * 0.7, cy: h * 0.3, radius: Math.min(w * 0.2, h * 0.32), opacity: 1 };
    }
    const radius = Math.min(w * (ring ? 0.21 : 0.26), h * 0.4);
    return { cx: w * 0.69, cy: h * (ring ? 0.47 : 0.5), radius, opacity: 1 };
  };
}

/**
 * The IBC business graph visualisation. Purely decorative (`aria-hidden`): every idea it
 * shows is also stated in text. Without canvas or JavaScript, the page still reads fully.
 */
export function NetworkGraph({
  scene,
  focusKind,
  variant = 'stage',
  interactive = true,
  className,
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<NetworkRenderer | null>(null);
  const reduced = usePrefersReducedMotion();
  const sceneRef = useRef({ scene, focusKind });
  // Keep the latest scene available to the (re)initialising effect below.
  useEffect(() => {
    sceneRef.current = { scene, focusKind };
  }, [scene, focusKind]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: NetworkRenderer;
    let reportedInteraction = false;
    try {
      renderer = new NetworkRenderer(
        canvas,
        createGraph({ nodeCount: nodeCountFor(window.innerWidth) }),
        {
          reducedMotion: reduced,
          interactive,
          stage: stageLayout(variant),
          onHover: (node) => {
            document.documentElement.dataset.cursorNode = node ? 'true' : '';
            if (node && !reportedInteraction) {
              reportedInteraction = true;
              track({ name: 'network_interaction', kind: node.kind });
            }
          },
        },
      );
    } catch {
      return; // No canvas support: the CSS backdrop stands in.
    }
    rendererRef.current = renderer;
    const initial = sceneRef.current;
    renderer.setScene(initial.scene, initial.focusKind ? { focusKind: initial.focusKind } : {});

    // Observe the canvas itself, not the window: its real size can change when styles
    // arrive or the layout changes, and the pixel buffer must follow.
    const resizeObserver = new ResizeObserver(() => {
      renderer.resize();
    });
    resizeObserver.observe(canvas);
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') renderer.setPointer(event.clientX, event.clientY);
    };
    const onLeave = () => {
      renderer.clearPointer();
    };
    const onVisibility = () => {
      if (document.hidden) renderer.stop();
      else renderer.start();
    };
    const target: HTMLElement | Window = variant === 'stage' ? window : canvas;
    target.addEventListener('pointermove', onPointer as EventListener);
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    // Inline graphs only animate while visible.
    let observer: IntersectionObserver | undefined;
    if (variant === 'inline') {
      observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) renderer.start();
        else renderer.stop();
      });
      observer.observe(canvas);
    } else {
      renderer.start();
    }

    return () => {
      observer?.disconnect();
      resizeObserver.disconnect();
      target.removeEventListener('pointermove', onPointer as EventListener);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [reduced, interactive, variant]);

  useEffect(() => {
    rendererRef.current?.setScene(scene, focusKind ? { focusKind } : {});
  }, [scene, focusKind]);

  return (
    <div
      className={[styles.root, styles[variant], className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {/* Inline sizing applies before any stylesheet loads, so the canvas can never take its
          intrinsic pixel-buffer width and widen the page. */}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
