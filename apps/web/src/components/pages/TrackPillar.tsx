'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export function TrackPillar({ pillar }: { pillar: string }) {
  useEffect(() => {
    track({ name: 'pillar_explore', pillar });
  }, [pillar]);
  return null;
}
