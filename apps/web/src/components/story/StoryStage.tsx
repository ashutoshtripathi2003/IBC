'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { NetworkGraph } from '@/components/network';
import type { SceneId } from '@/components/network/engine';
import { track } from '@/lib/analytics';

const StageContext = createContext<(scene: SceneId) => void>(() => undefined);

/** Owns the single network stage behind the home page; chapters tell it which scene to show. */
export function StoryStage({ children }: { children: ReactNode }) {
  const [scene, setScene] = useState<SceneId>('formation');
  return (
    <StageContext.Provider value={setScene}>
      <NetworkGraph scene={scene} variant="stage" />
      {children}
    </StageContext.Provider>
  );
}

/**
 * A chapter of the story. When it crosses the middle of the viewport it becomes the
 * active chapter: the network re-weaves into its scene and a section view is recorded.
 */
export function Chapter({
  scene,
  name,
  children,
}: {
  scene: SceneId;
  name: string;
  children: ReactNode;
}) {
  const setScene = useContext(StageContext);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let seen = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setScene(scene);
        if (!seen) {
          seen = true;
          track({ name: 'section_view', section: name });
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [scene, name, setScene]);
  return (
    <div ref={ref} data-chapter={name}>
      {children}
    </div>
  );
}
