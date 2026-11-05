import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { decodeDots, hubById, HUBS, ROUTES, START_VIEW, toVec3 } from './geo';

export interface GlobeOptions {
  /** Phones and low-power devices: fewer dots, fewer routes, lower pixel ratio. */
  lite: boolean;
  /** Reduced motion: no idle rotation; one frame per change. */
  still: boolean;
  dotsUrl: string;
}

export interface Globe {
  setProgress(progress: number): void;
  resize(): void;
  setActive(active: boolean): void;
  dispose(): void;
}

const GOLD = new Color('#c49a42');
const HAZE = new Color('#d9c7a0');
const STEEL = new Color('#b7c2d2');
const DEG = Math.PI / 180;

const dotMaterial = (size: number, dpr: number) =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSize: { value: size * dpr }, uColor: { value: STEEL } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      varying float vFacing;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFacing = dot(normalize(normalMatrix * position), vec3(0.0, 0.0, 1.0));
        gl_PointSize = uSize * (3.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vFacing;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float edge = smoothstep(0.5, 0.32, d);
        float light = smoothstep(-0.05, 0.55, vFacing);
        gl_FragColor = vec4(uColor * (0.55 + 0.45 * light), edge * (0.15 + 0.75 * light));
      }`,
  });

const arcMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uColor: { value: GOLD } },
    vertexShader: /* glsl */ `
      varying float vT;
      void main() {
        vT = uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw;
      uniform float uTime;
      uniform vec3 uColor;
      varying float vT;
      void main() {
        if (vT > uDraw) discard;
        float head = smoothstep(uDraw - 0.12, uDraw, vT) * step(uDraw, 0.999);
        float pulse = smoothstep(0.06, 0.0, abs(fract(uTime * 0.18) - vT)) * step(0.999, uDraw);
        float ends = smoothstep(0.0, 0.05, vT) * smoothstep(1.0, 0.95, vT);
        float a = (0.62 + 1.2 * head + 1.0 * pulse) * ends;
        gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.93, 0.78), head + pulse), a);
      }`,
  });

/** Great-circle arc lifted off the surface, as a thin tube with uv.x running 0 → 1. */
function arc(a: [number, number, number], b: [number, number, number], radius: number) {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const angle = va.angleTo(vb);
  const lift = 0.06 + angle * 0.16;
  const points: Vector3[] = [];
  for (let i = 0; i <= 48; i += 1) {
    const t = i / 48;
    const p = va.clone().lerp(vb, t).normalize();
    points.push(p.multiplyScalar(1.005 + Math.sin(Math.PI * t) * lift));
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 96, radius, 5, false);
}

export async function createGlobe(
  canvas: HTMLCanvasElement,
  options: GlobeOptions,
): Promise<Globe> {
  const dpr = Math.min(window.devicePixelRatio || 1, options.lite ? 1.5 : 1.75);
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !options.lite,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const globe = new Group();
  scene.add(globe);

  // Body: deep navy with a soft light from the upper left.
  const body = new Mesh(
    new SphereGeometry(1, 64, 48),
    new ShaderMaterial({
      uniforms: { uTop: { value: new Color('#16263d') }, uBottom: { value: new Color('#060b14') } },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        void main() {
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uBottom;
        varying vec3 vN;
        void main() {
          float l = clamp(dot(vN, normalize(vec3(-0.5, 0.6, 0.8))) * 0.5 + 0.5, 0.0, 1.0);
          float rim = pow(1.0 - max(vN.z, 0.0), 3.0);
          gl_FragColor = vec4(mix(uBottom, uTop, l) + vec3(0.55, 0.47, 0.32) * rim * 0.35, 1.0);
        }`,
    }),
  );
  globe.add(body);

  // Atmosphere: warm rim light around the limb.
  const atmosphere = new Mesh(
    new SphereGeometry(1.14, 64, 48),
    new ShaderMaterial({
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uColor: { value: HAZE } },
      vertexShader: /* glsl */ `
        varying vec3 vN;
        void main() {
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying vec3 vN;
        void main() {
          float halo = pow(clamp(1.0 - abs(vN.z), 0.0, 1.0), 5.0);
          gl_FragColor = vec4(uColor, clamp(halo * 0.55, 0.0, 1.0));
        }`,
    }),
  );
  scene.add(atmosphere);

  // Land dots.
  const response = await fetch(options.dotsUrl);
  const dots = decodeDots(await response.arrayBuffer());
  const positions = new Float32Array((dots.length / 2) * 3);
  for (let i = 0, j = 0; i < dots.length; i += 2, j += 3) {
    const [x, y, z] = toVec3(dots[i] ?? 0, dots[i + 1] ?? 0);
    positions[j] = x * 1.002;
    positions[j + 1] = y * 1.002;
    positions[j + 2] = z * 1.002;
  }
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  const dotMat = dotMaterial(options.lite ? 4.2 : 3.2, dpr);
  globe.add(new Points(dotGeometry, dotMat));

  // Hubs.
  const hubPositions = new Float32Array(HUBS.length * 3);
  HUBS.forEach((h, i) => {
    const [x, y, z] = toVec3(h.lat, h.lon);
    hubPositions.set([x * 1.01, y * 1.01, z * 1.01], i * 3);
  });
  const hubGeometry = new BufferGeometry();
  hubGeometry.setAttribute('position', new BufferAttribute(hubPositions, 3));
  const hubMat = dotMaterial(12, dpr);
  hubMat.uniforms.uColor!.value = GOLD;
  globe.add(new Points(hubGeometry, hubMat));

  // Routes.
  const routes = (options.lite ? ROUTES.slice(0, 8) : ROUTES).map(([from, to]) => {
    const a = hubById(from)!;
    const b = hubById(to)!;
    const material = arcMaterial();
    const mesh = new Mesh(
      arc(toVec3(a.lat, a.lon), toVec3(b.lat, b.lon), options.lite ? 0.0075 : 0.0055),
      material,
    );
    globe.add(mesh);
    return material;
  });

  let progress = 0;
  let active = false;
  let frame = 0;
  let idle = 0;
  let last = performance.now();
  let dirty = true;

  const layout = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  };

  const apply = (time: number) => {
    const p = progress;
    const lon = START_VIEW.lon - p * 120 - idle;
    const lat = START_VIEW.lat + Math.sin(p * Math.PI) * 6;
    globe.rotation.set(lat * DEG, -lon * DEG, 0);
    const wide = camera.aspect > 1.1;
    camera.position.set(0, 0, (wide ? 5.4 : 6.6) - Math.sin(p * Math.PI) * 0.45);
    globe.position.x = wide ? 0.78 : 0;
    globe.position.y = wide ? 0 : -1.05;
    atmosphere.position.copy(globe.position);
    camera.lookAt(0, 0, 0);
    routes.forEach((m, i) => {
      const start = (i / routes.length) * 0.75;
      m.uniforms.uDraw!.value = Math.min(1, Math.max(0, (p - start) / 0.18));
      m.uniforms.uTime!.value = time / 1000 + i * 0.7;
    });
  };

  const loop = (now: number) => {
    frame = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!options.still) idle += dt * 1.6;
    apply(now);
    renderer.render(scene, camera);
    dirty = false;
    if (active && !options.still) frame = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (frame) return;
    if (active && !options.still) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    } else if (dirty) {
      frame = requestAnimationFrame(loop);
    }
  };

  layout();
  return {
    setProgress(value) {
      progress = Math.min(1, Math.max(0, value));
      dirty = true;
      kick();
    },
    resize() {
      layout();
      kick();
    },
    setActive(value) {
      active = value;
      if (!value && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      dirty = true;
      kick();
    },
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Points) {
          const { geometry, material } = object as Mesh<BufferGeometry, ShaderMaterial>;
          geometry.dispose();
          material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
