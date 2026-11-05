/** Geography shared by the globe poster (SVG, server) and the WebGL globe (client). */

export interface Hub {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

/** Illustrative trade hubs: where the story's routes start and end (not member locations). */
export const HUBS: readonly Hub[] = [
  { id: 'pune', name: 'Pune', lat: 18.52, lon: 73.86 },
  { id: 'mumbai', name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { id: 'chennai', name: 'Chennai', lat: 13.08, lon: 80.27 },
  { id: 'dubai', name: 'Dubai', lat: 25.2, lon: 55.27 },
  { id: 'rotterdam', name: 'Rotterdam', lat: 51.92, lon: 4.48 },
  { id: 'hamburg', name: 'Hamburg', lat: 53.55, lon: 9.99 },
  { id: 'singapore', name: 'Singapore', lat: 1.35, lon: 103.82 },
  { id: 'shanghai', name: 'Shanghai', lat: 31.23, lon: 121.47 },
  { id: 'tokyo', name: 'Tokyo', lat: 35.68, lon: 139.69 },
  { id: 'sydney', name: 'Sydney', lat: -33.87, lon: 151.21 },
  { id: 'nairobi', name: 'Nairobi', lat: -1.29, lon: 36.82 },
  { id: 'lagos', name: 'Lagos', lat: 6.52, lon: 3.38 },
  { id: 'houston', name: 'Houston', lat: 29.76, lon: -95.37 },
  { id: 'saopaulo', name: 'São Paulo', lat: -23.55, lon: -46.63 },
];

/** Routes in the order they are drawn as the visitor scrolls. */
export const ROUTES: readonly [string, string][] = [
  ['pune', 'rotterdam'],
  ['mumbai', 'dubai'],
  ['pune', 'singapore'],
  ['chennai', 'shanghai'],
  ['mumbai', 'nairobi'],
  ['dubai', 'lagos'],
  ['pune', 'hamburg'],
  ['singapore', 'sydney'],
  ['shanghai', 'tokyo'],
  ['mumbai', 'houston'],
  ['rotterdam', 'saopaulo'],
  ['hamburg', 'houston'],
];

export const hubById = (id: string) => HUBS.find((h) => h.id === id);

/** Unit-sphere position (y up, lon 0 facing +z). */
export function toVec3(lat: number, lon: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return [Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda)];
}

/** Decodes the land-dot file: Int16 pairs of (lat × 100, lon × 100). */
export function decodeDots(buffer: ArrayBuffer | Uint8Array): Float32Array {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const out = new Float32Array(view.length);
  for (let i = 0; i < view.length; i += 1) out[i] = (view[i] ?? 0) / 100;
  return out;
}

/** The view the scene opens on: centred on western India. */
export const START_VIEW = { lat: 16, lon: 74 } as const;

/** Orthographic projection of a lat/lon onto a disc of radius 1 around the view centre. */
export function project(lat: number, lon: number, view: { lat: number; lon: number }) {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lon - view.lon) * Math.PI) / 180;
  const phi0 = (view.lat * Math.PI) / 180;
  const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  return {
    x: Math.cos(phi) * Math.sin(lambda),
    y: -(Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
    visible: cosc > 0,
    depth: cosc,
  };
}
