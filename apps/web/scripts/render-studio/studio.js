// Offline product studio. window.renderProduct(name) renders one object and returns WebP data URLs.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 1600;
const H = 1200;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

function stage() {
  const scene = new THREE.Scene();
  scene.environment = envMap;
  // Seamless warm studio sweep.
  const bg = document.createElement('canvas');
  bg.width = 8;
  bg.height = 256;
  const g = bg.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#e9ecf0');
  grad.addColorStop(0.62, '#f5f6f8');
  grad.addColorStop(1, '#e4e7ec');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(bg);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.22 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const key = new THREE.DirectionalLight(0xfff3e0, 2.4);
  key.position.set(-3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 8;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd9e4ff, 1.1);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 0.5));
  return scene;
}

const cast = (o) => {
  o.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return o;
};
const mat = (o) => new THREE.MeshPhysicalMaterial(o);

function stripes(base, line, n, vertical) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < n; i++) {
    g.strokeStyle = line;
    g.globalAlpha = 0.18 + Math.random() * 0.25;
    g.lineWidth = 1 + Math.random() * 1.5;
    const p = (i / n) * 512;
    g.beginPath();
    if (vertical) {
      g.moveTo(p, 0);
      g.lineTo(p + 6, 512);
    } else {
      g.moveTo(0, p);
      g.lineTo(512, p + 4);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const products = {
  drum() {
    const grp = new THREE.Group();
    const paint = mat({
      color: 0x132a49,
      metalness: 0.35,
      roughness: 0.42,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    });
    const steel = mat({ color: 0xb9bec6, metalness: 1, roughness: 0.32 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.74, 96, 1, true), paint);
    body.position.y = 0.87;
    grp.add(body);
    for (const y of [0.04, 0.6, 1.14, 1.7]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.585, y === 0.04 || y === 1.7 ? 0.035 : 0.022, 16, 128),
        y === 0.04 || y === 1.7 ? steel : paint,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      grp.add(ring);
    }
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.575, 0.575, 0.02, 96), paint);
    lid.position.y = 1.72;
    grp.add(lid);
    for (const [x, r] of [
      [0.32, 0.07],
      [-0.3, 0.045],
    ]) {
      const bung = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 32), steel);
      bung.position.set(x, 1.75, 0.05);
      grp.add(bung);
    }
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.586, 0.586, 0.36, 96, 1, true, -0.7, 1.4),
      mat({ color: 0xf4f1ea, roughness: 0.8 }),
    );
    label.position.y = 0.87;
    grp.add(label);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.588, 0.588, 0.05, 96, 1, true, -0.7, 1.4),
      mat({ color: 0xc49a42, roughness: 0.5, metalness: 0.2 }),
    );
    band.position.y = 0.96;
    grp.add(band);
    // A second drum behind, for depth.
    const back = grp.clone();
    back.position.set(-1.05, 0, -0.75);
    back.rotation.y = 1.2;
    const scene = new THREE.Group();
    scene.add(grp, back);
    grp.rotation.y = -0.35;
    return { object: scene, camera: [3.02, 2.44, 5.34], target: [-0.3, 0.85, -0.3] };
  },
  ingots() {
    const alu = mat({ color: 0xc8ccd2, metalness: 1, roughness: 0.38, clearcoat: 0.2 });
    const ingot = new THREE.BoxGeometry(1.4, 0.22, 0.34, 1, 1, 1);
    const p = ingot.attributes.position;
    for (let i = 0; i < p.count; i++)
      if (p.getY(i) > 0) {
        p.setX(i, p.getX(i) * 0.9);
        p.setZ(i, p.getZ(i) * 0.72);
      }
    ingot.computeVertexNormals();
    const grp = new THREE.Group();
    for (let layer = 0; layer < 5; layer++) {
      for (let k = 0; k < 4; k++) {
        const m = new THREE.Mesh(ingot, alu);
        const off = (k - 1.5) * 0.36;
        m.position.y = 0.11 + layer * 0.225;
        if (layer % 2) {
          m.rotation.y = Math.PI / 2;
          m.position.x = off;
        } else {
          m.position.z = off;
        }
        grp.add(m);
      }
    }
    grp.rotation.y = -0.6;
    return { object: grp, camera: [3.25, 2.67, 4.18], target: [0, 0.55, 0] };
  },
  housing() {
    const cast = mat({ color: 0xbfc3c9, metalness: 0.9, roughness: 0.58 });
    const machined = mat({ color: 0xdfe2e6, metalness: 1, roughness: 0.18 });
    const parts = [];
    const body = new THREE.CylinderGeometry(0.5, 0.5, 1.3, 96, 1, true);
    parts.push(body);
    for (let i = 0; i < 28; i++) {
      const fin = new THREE.BoxGeometry(0.035, 1.18, 0.16);
      fin.translate(0, 0, 0.55);
      fin.rotateY((i / 28) * Math.PI * 2);
      parts.push(fin);
    }
    const shell = new THREE.Mesh(mergeGeometries(parts), cast);
    const grp = new THREE.Group();
    grp.add(shell);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.09, 96), machined);
    flange.position.y = 0.68;
    grp.add(flange);
    const bore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.1, 64),
      mat({ color: 0x3a3f47, metalness: 0.8, roughness: 0.4 }),
    );
    bore.position.y = 0.69;
    grp.add(bore);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.1, 20),
        mat({ color: 0x2a2e35, roughness: 0.6 }),
      );
      hole.position.set(Math.cos(a) * 0.62, 0.69, Math.sin(a) * 0.62);
      grp.add(hole);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 96), cast);
    cap.position.y = -0.66;
    grp.add(cap);
    grp.rotation.set(0, 0, Math.PI / 2 - 0.08);
    grp.position.y = 0.73;
    const holder = new THREE.Group();
    holder.add(grp);
    holder.rotation.y = -0.65;
    return { object: holder, camera: [2.78, 1.97, 3.94], target: [0, 0.6, 0] };
  },
  yarn() {
    const grp = new THREE.Group();
    const profile = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      profile.push(new THREE.Vector2(0.62 - t * 0.3 + Math.sin(t * Math.PI) * 0.03, t * 1.3));
    }
    const yarnTex = stripes('#efe7d7', '#b9a98a', 220, false);
    yarnTex.repeat.set(1, 1);
    const yarnMat = mat({
      color: 0xffffff,
      map: yarnTex,
      roughness: 0.95,
      sheen: 1,
      sheenColor: new THREE.Color(0xfff6e6),
      sheenRoughness: 0.6,
    });
    const makeCone = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), yarnMat);
      g.add(body);
      const top = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.32, 96), yarnMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = 1.3;
      g.add(top);
      const bottom = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.62, 96), yarnMat);
      bottom.rotation.x = Math.PI / 2;
      bottom.position.y = 0.001;
      g.add(bottom);
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.17, 1.45, 64, 1, true),
        mat({ color: 0x132a49, roughness: 0.6, side: THREE.DoubleSide }),
      );
      core.position.y = 0.72;
      g.add(core);
      return g;
    };
    const a = makeCone();
    const b = makeCone();
    b.position.set(-1.1, 0, -0.6);
    const c = makeCone();
    c.position.set(0.95, 0, -0.9);
    grp.add(a, b, c);
    return { object: grp, camera: [2.55, 2.55, 4.87], target: [-0.05, 0.6, -0.4] };
  },
  pump() {
    const paint = mat({ color: 0x16304f, metalness: 0.3, roughness: 0.38, clearcoat: 0.6 });
    const steel = mat({ color: 0xc3c7cd, metalness: 1, roughness: 0.3 });
    const dark = mat({ color: 0x2b2f36, metalness: 0.6, roughness: 0.5 });
    const grp = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.9), dark);
    base.position.y = 0.06;
    grp.add(base);
    // Volute casing
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 96), paint);
    casing.rotation.z = Math.PI / 2;
    casing.position.set(-0.8, 0.75, 0);
    grp.add(casing);
    const scroll = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.17, 32, 96, Math.PI * 1.4),
      paint,
    );
    scroll.rotation.y = Math.PI / 2;
    scroll.position.set(-0.8, 0.75, 0);
    grp.add(scroll);
    const dis = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 48), paint);
    dis.position.set(-0.8, 1.28, 0.25);
    grp.add(dis);
    const disF = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 48), steel);
    disF.position.set(-0.8, 1.54, 0.25);
    grp.add(disF);
    const suc = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.4, 48), paint);
    suc.rotation.z = Math.PI / 2;
    suc.position.set(-1.2, 0.75, 0);
    grp.add(suc);
    const sucF = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 48), steel);
    sucF.rotation.z = Math.PI / 2;
    sucF.position.set(-1.41, 0.75, 0);
    grp.add(sucF);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.6), paint);
    foot.position.set(-0.8, 0.27, 0);
    grp.add(foot);
    // Bearing frame, coupling guard and motor
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.6, 48), paint);
    frame.rotation.z = Math.PI / 2;
    frame.position.set(-0.25, 0.75, 0);
    grp.add(frame);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.4, 0.42),
      mat({ color: 0xc49a42, roughness: 0.5, metalness: 0.2 }),
    );
    guard.position.set(0.22, 0.75, 0);
    grp.add(guard);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.95, 96), paint);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0.92, 0.75, 0);
    grp.add(motor);
    for (let i = 0; i < 18; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.08), paint);
      const a = (i / 18) * Math.PI * 2;
      fin.position.set(0.92, 0.75 + Math.sin(a) * 0.42, Math.cos(a) * 0.42);
      fin.rotation.x = -a;
      grp.add(fin);
    }
    const mfoot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.7), paint);
    mfoot.position.set(0.92, 0.27, 0);
    grp.add(mfoot);
    grp.rotation.y = -0.55;
    return { object: grp, camera: [2.55, 2.32, 4.18], target: [0, 0.65, 0] };
  },
  pellets() {
    const grp = new THREE.Group();
    const pellet = new THREE.SphereGeometry(0.045, 16, 12);
    pellet.scale(1, 0.7, 1.15);
    const m = mat({ color: 0xf6f7f8, roughness: 0.28, clearcoat: 0.6, sheen: 0.4 });
    const count = 2600;
    const inst = new THREE.InstancedMesh(pellet, m, count);
    const d = new THREE.Object3D();
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(rnd()) * 1.2;
      const a = rnd() * Math.PI * 2;
      const hgt = Math.max(0, 0.75 * (1 - r / 1.2) ** 1.3);
      d.position.set(Math.cos(a) * r, 0.03 + rnd() * hgt, Math.sin(a) * r);
      d.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
    }
    grp.add(inst);
    const scoop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.32, 0.5, 64, 1, true),
      mat({ color: 0x132a49, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide }),
    );
    scoop.position.set(-1.2, 0.25, -0.7);
    grp.add(scoop);
    return { object: grp, camera: [2.67, 2.2, 3.48], target: [0, 0.25, 0] };
  },
};

window.renderProduct = (name) => {
  const scene = stage();
  const { object, camera: cp, target } = products[name]();
  scene.add(cast(object));
  const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
  camera.position.set(...cp);
  camera.lookAt(...target);
  renderer.render(scene, camera);
  const out = {};
  for (const [w, q] of [
    [1600, 0.84],
    [800, 0.82],
  ]) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = (w * H) / W;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(renderer.domElement, 0, 0, c.width, c.height);
    out[w] = c.toDataURL('image/webp', q);
  }
  return out;
};
window.studioReady = true;
