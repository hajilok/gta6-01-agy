// Procedural PBR Texture Library, Custom GLSL Ocean Surf Shader & Atmospheric Sky Dome

import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function makeTexture(canvas, repeatX = 1, repeatY = 1, isColor = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPbrTextureLibrary() {
  // 1) Wet-sheen coastal asphalt (Albedo + Roughness + Bump)
  const aspAlb = makeCanvas(512, 512);
  const aspRgh = makeCanvas(512, 512);
  const ctxA = aspAlb.getContext('2d');
  const ctxR = aspRgh.getContext('2d');

  ctxA.fillStyle = '#252932';
  ctxA.fillRect(0, 0, 512, 512);
  ctxR.fillStyle = '#a8a8a8';
  ctxR.fillRect(0, 0, 512, 512);

  // Subtle tire wear tracks & coastal damp sheen
  const gradTrack = ctxR.createLinearGradient(0, 0, 512, 0);
  gradTrack.addColorStop(0.0, '#c0c0c0');
  gradTrack.addColorStop(0.24, '#565656');
  gradTrack.addColorStop(0.45, '#969696');
  gradTrack.addColorStop(0.55, '#969696');
  gradTrack.addColorStop(0.76, '#565656');
  gradTrack.addColorStop(1.0, '#c0c0c0');
  ctxR.fillStyle = gradTrack;
  ctxR.fillRect(0, 0, 512, 512);

  // Fine mineral aggregate noise
  for (let i = 0; i < 6500; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    const v = 30 + ((i * 53) % 24);
    ctxA.fillStyle = `rgb(${v},${v + 2},${v + 7})`;
    ctxA.fillRect(x, y, 2, 2);
  }
  // Crisp white edge lines & golden double center divider
  ctxA.fillStyle = 'rgba(244,242,235,0.88)';
  ctxA.fillRect(16, 0, 10, 512);
  ctxA.fillRect(486, 0, 10, 512);
  ctxA.fillStyle = 'rgba(255,198,66,0.92)';
  ctxA.fillRect(247, 0, 6, 512);
  ctxA.fillRect(259, 0, 6, 512);
  // Dashed inner lane stripes
  ctxA.fillStyle = 'rgba(240,242,248,0.68)';
  for (let y = 20; y < 512; y += 92) {
    ctxA.fillRect(132, y, 6, 44);
    ctxA.fillRect(374, y, 6, 44);
  }

  // 2) Travertine Boardwalk & Sidewalk Tile
  const tileCan = makeCanvas(256, 256);
  const ct = tileCan.getContext('2d');
  ct.fillStyle = '#d9cbb4';
  ct.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      const shade = 206 + (((x * 13 + y * 29) >> 3) % 22);
      ct.fillStyle = `rgb(${shade},${shade - 12},${shade - 28})`;
      ct.fillRect(x + 1, y + 1, 30, 30);
    }
  }
  ct.strokeStyle = 'rgba(92,76,58,0.34)';
  ct.lineWidth = 2;
  for (let i = 0; i <= 256; i += 32) {
    ct.beginPath(); ct.moveTo(i, 0); ct.lineTo(i, 256); ct.stroke();
    ct.beginPath(); ct.moveTo(0, i); ct.lineTo(256, i); ct.stroke();
  }

  // 3) Fiesta Cobblestone Plaza
  const cobCan = makeCanvas(256, 256);
  const cc = cobCan.getContext('2d');
  cc.fillStyle = '#8b6f58';
  cc.fillRect(0, 0, 256, 256);
  const cobPal = ['#cfa47a', '#be8e64', '#d8b68e', '#a97b58', '#c6936c'];
  for (let r = 0; r < 16; r++) {
    const off = (r % 2) * 16;
    for (let c = 0; c < 8; c++) {
      cc.fillStyle = cobPal[(r * 7 + c * 3) % cobPal.length];
      cc.fillRect(((c * 32 + off) % 256) + 2, r * 16 + 2, 28, 12);
    }
  }

  // 4) Glass Skyscraper Facade (Albedo + Emissive Window Grid)
  const skyAlb = makeCanvas(512, 512);
  const skyEmi = makeCanvas(512, 512);
  const sa = skyAlb.getContext('2d');
  const se = skyEmi.getContext('2d');
  sa.fillStyle = '#1b2b3d';
  sa.fillRect(0, 0, 512, 512);
  se.fillStyle = '#000000';
  se.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 12;
  const cw = 512 / cols;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    // Structural spandrel band
    sa.fillStyle = '#33465c';
    sa.fillRect(0, r * rh, 512, 7);
    for (let c = 0; c < cols; c++) {
      const hash = (r * 37 + c * 17 + r * c * 11) % 100;
      const g = sa.createLinearGradient(c * cw, r * rh + 8, c * cw, (r + 1) * rh - 3);
      g.addColorStop(0, '#5a8eb3');
      g.addColorStop(0.55, '#2b4f6e');
      g.addColorStop(1, '#1d364d');
      sa.fillStyle = g;
      sa.fillRect(c * cw + 4, r * rh + 8, cw - 8, rh - 11);

      if (hash < 46) {
        const warm = hash % 3 === 0 ? '#ffd285' : (hash % 3 === 1 ? '#ffe8b8' : '#85e8ff');
        se.fillStyle = warm;
        se.globalAlpha = 0.45 + (hash % 5) * 0.11;
        se.fillRect(c * cw + 6, r * rh + 10, cw - 12, rh - 15);
        se.globalAlpha = 1;
      }
    }
  }

  // 5) Art-Deco Hotel Facade (Albedo + Warm Glowing Emissive Windows)
  const decoAlb = makeCanvas(512, 512);
  const decoEmi = makeCanvas(512, 512);
  const da = decoAlb.getContext('2d');
  const de = decoEmi.getContext('2d');
  da.fillStyle = '#f5e8d8';
  da.fillRect(0, 0, 512, 512);
  de.fillStyle = '#000000';
  de.fillRect(0, 0, 512, 512);

  // Horizontal Art-Deco speedlines
  for (let r = 0; r < 8; r++) {
    const y = r * 64;
    da.fillStyle = '#e5d0ba';
    da.fillRect(0, y, 512, 6);
    da.fillStyle = '#ffffff';
    da.fillRect(0, y + 6, 512, 3);
    for (let c = 0; c < 6; c++) {
      const x = c * 85 + 14;
      da.fillStyle = '#25394c';
      da.fillRect(x, y + 16, 54, 38);
      da.strokeStyle = '#fff4e6';
      da.lineWidth = 3;
      da.strokeRect(x, y + 16, 54, 38);
      const lit = (r * 19 + c * 23) % 10;
      if (lit < 6) {
        de.fillStyle = lit % 2 === 0 ? '#ffcf7d' : '#ff9cc6';
        de.globalAlpha = 0.65;
        de.fillRect(x + 4, y + 20, 46, 30);
        de.globalAlpha = 1;
      }
    }
  }

  // 6) Terracotta Old Town Stucco & Arched Windows
  const oldAlb = makeCanvas(512, 512);
  const oldEmi = makeCanvas(512, 512);
  const oa = oldAlb.getContext('2d');
  const oe = oldEmi.getContext('2d');
  oa.fillStyle = '#df9a6a';
  oa.fillRect(0, 0, 512, 512);
  oe.fillStyle = '#000000';
  oe.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2200; i++) {
    oa.fillStyle = i % 2 ? 'rgba(255,235,210,0.08)' : 'rgba(120,56,28,0.08)';
    oa.fillRect((i * 79) % 512, (i * 151) % 512, 6, 4);
  }
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const x = c * 102 + 24;
      const y = r * 102 + 24;
      oa.fillStyle = '#3b2822';
      oa.beginPath();
      oa.arc(x + 26, y + 20, 24, Math.PI, 0);
      oa.lineTo(x + 50, y + 66);
      oa.lineTo(x + 2, y + 66);
      oa.closePath();
      oa.fill();
      oa.strokeStyle = '#f6dfbe';
      oa.lineWidth = 4;
      oa.stroke();
      if ((r + c * 2) % 3 !== 0) {
        oe.fillStyle = '#ffbe63';
        oe.globalAlpha = 0.55;
        oe.fillRect(x + 8, y + 18, 36, 42);
        oe.globalAlpha = 1;
      }
    }
  }

  // 7) Corrugated Shipping Container Texture
  const contCan = makeCanvas(256, 128);
  const cg = contCan.getContext('2d');
  cg.fillStyle = '#d8d8d8';
  cg.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 10) {
    cg.fillStyle = 'rgba(0,0,0,0.22)';
    cg.fillRect(x, 0, 4, 128);
    cg.fillStyle = 'rgba(255,255,255,0.16)';
    cg.fillRect(x + 4, 0, 2, 128);
  }
  cg.strokeStyle = 'rgba(0,0,0,0.35)';
  cg.lineWidth = 6;
  cg.strokeRect(3, 3, 250, 122);

  // 8) Soft Radial Particle Sprite (Billowing Smoke / Glow / Sparks)
  const puffCan = makeCanvas(128, 128);
  const pf = puffCan.getContext('2d');
  const pg = pf.createRadialGradient(64, 64, 4, 64, 64, 62);
  pg.addColorStop(0.0, 'rgba(255,255,255,0.95)');
  pg.addColorStop(0.38, 'rgba(255,255,255,0.58)');
  pg.addColorStop(0.72, 'rgba(255,255,255,0.18)');
  pg.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  pf.fillStyle = pg;
  pf.fillRect(0, 0, 128, 128);

  return {
    asphaltMap: makeTexture(aspAlb, 1, 1, true),
    asphaltRoughness: makeTexture(aspRgh, 1, 1, false),
    boardwalkMap: makeTexture(tileCan, 14, 14, true),
    cobbleMap: makeTexture(cobCan, 8, 8, true),
    skyMap: makeTexture(skyAlb, 1, 1, true),
    skyEmissive: makeTexture(skyEmi, 1, 1, true),
    decoMap: makeTexture(decoAlb, 1, 1, true),
    decoEmissive: makeTexture(decoEmi, 1, 1, true),
    oldTownMap: makeTexture(oldAlb, 1, 1, true),
    oldTownEmissive: makeTexture(oldEmi, 1, 1, true),
    containerMap: makeTexture(contCan, 1, 1, true),
    softParticleMap: makeTexture(puffCan, 1, 1, true),
  };
}

export function createNeonSignTexture(text, bgHex = '#101628', fgHex = '#ff4d8d', subText = '') {
  const c = makeCanvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = bgHex;
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fgHex;
  g.lineWidth = 6;
  g.strokeRect(8, 8, 496, 112);

  g.shadowColor = fgHex;
  g.shadowBlur = 18;
  g.fillStyle = '#ffffff';
  g.font = '900 50px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, subText ? 52 : 66);

  if (subText) {
    g.shadowBlur = 8;
    g.fillStyle = fgHex;
    g.font = '800 22px "Segoe UI", sans-serif';
    g.fillText(subText, 256, 96);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createOceanMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.65, 0.34, 0.68).normalize() },
      uSunColor: { value: new THREE.Color(0xffb86b) },
      uShallowColor: { value: new THREE.Color(0x1bd1c8) },
      uDeepColor: { value: new THREE.Color(0x0b3963) },
      uHorizonColor: { value: new THREE.Color(0xff9970) },
      uFogColor: { value: new THREE.Color(0xf7a476) },
      uFogDensity: { value: 0.00125 },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float w1 = sin(wp.x * 0.045 + uTime * 1.4) * cos(wp.z * 0.038 + uTime * 1.1) * 0.28;
        float w2 = sin(wp.x * 0.11 - wp.z * 0.09 + uTime * 2.2) * 0.12;
        wp.y += w1 + w2;
        vWorldPos = wp.xyz;
        float dx = cos(wp.x * 0.045 + uTime * 1.4) * 0.025 + cos(wp.x * 0.11 - wp.z * 0.09 + uTime * 2.2) * 0.02;
        float dz = -sin(wp.z * 0.038 + uTime * 1.1) * 0.02 - cos(wp.x * 0.11 - wp.z * 0.09 + uTime * 2.2) * 0.018;
        vNormalW = normalize(vec3(-dx * 3.0, 1.0, -dz * 3.0));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uShallowColor;
      uniform vec3 uDeepColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;

      float coastZ(float x) {
        float dx = x + 110.0;
        return 162.0 - 0.00052 * dx * dx + 14.0 * sin(x * 0.011);
      }

      void main() {
        vec3 viewVec = normalize(cameraPosition - vWorldPos);
        // Smooth organic dual-frequency wave ripples (zero grid aliasing)
        float r1 = sin(vWorldPos.x * 0.14 + vWorldPos.z * 0.09 + uTime * 1.6);
        float r2 = cos(vWorldPos.x * 0.21 - vWorldPos.z * 0.17 - uTime * 2.1);
        float r3 = sin(vWorldPos.x * 0.43 + vWorldPos.z * 0.37 + uTime * 2.8) * 0.5;
        vec3 N = normalize(vNormalW + vec3((r1 + r2) * 0.055 + r3 * 0.025, 0.0, (r2 - r1) * 0.055 + r3 * 0.025));

        // Smooth distance to crescent beach, east harbor & Monte Faro island
        float dBeach = vWorldPos.z - coastZ(vWorldPos.x);
        float dIsland = length(vWorldPos.xz - vec2(398.0, 145.0)) - 118.0;
        float dHarbor = vWorldPos.x - 214.0;
        float shoreDist = min(
          (vWorldPos.x < 214.0) ? max(dBeach, 0.0) : max(dHarbor, 0.0),
          max(dIsland, 0.0)
        );

        float shallowFactor = 1.0 - smoothstep(0.0, 58.0, shoreDist);
        vec3 waterCol = mix(uDeepColor, uShallowColor, shallowFactor);

        // Fresnel sky reflection
        float fresnel = pow(1.0 - max(dot(viewVec, N), 0.0), 3.4);
        waterCol = mix(waterCol, uHorizonColor * 0.88, fresnel * 0.55);

        // Sparkling golden sun specular path
        vec3 H = normalize(uSunDir + viewVec);
        float specBroad = pow(max(dot(N, H), 0.0), 32.0) * 0.48;
        float specSharp = pow(max(dot(N, H), 0.0), 180.0) * 2.1;
        waterCol += uSunColor * (specBroad + specSharp);

        // Clean organic shoreline surf foam ONLY right along beach/island edge
        float shoreBand = 1.0 - smoothstep(0.0, 7.5, shoreDist);
        float surfLace = smoothstep(-0.15, 0.75, sin(shoreDist * 0.9 - uTime * 2.6 + r1 * 2.0));
        waterCol = mix(waterCol, vec3(0.95, 0.99, 1.0), shoreBand * (0.45 + 0.45 * surfLace));

        // Exponential distance fog
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 1.55));
        vec3 finalCol = mix(waterCol, uFogColor, clamp(fogFactor, 0.0, 0.9));

        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
  });
}

export function createSkyDomeMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(0x1f3f7a) },
      uMidColor: { value: new THREE.Color(0xdf7b6b) },
      uHorizonColor: { value: new THREE.Color(0xffc07a) },
      uSunDir: { value: new THREE.Vector3(0.65, 0.25, 0.68).normalize() },
      uSunColor: { value: new THREE.Color(0xfff1c4) },
      uTime: { value: 0 },
      uStarAlpha: { value: 0 },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uTime;
      uniform float uStarAlpha;
      varying vec3 vDir;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.24, h));
        col = mix(col, uTopColor, smoothstep(0.22, 0.85, h));

        // Sun disk & warm atmospheric scattering halo
        float sunAmt = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunColor * pow(sunAmt, 8.0) * 0.42;
        col += uSunColor * pow(sunAmt, 160.0) * 2.2;

        // Soft drifting coastal sunset clouds
        if (d.y > 0.03) {
          vec2 uv = d.xz / (d.y + 0.22) * 1.15 + vec2(uTime * 0.008, 0.0);
          float c = noise(uv * 2.0) * 0.55 + noise(uv * 4.3 + 3.1) * 0.3 + noise(uv * 8.6) * 0.15;
          float cloudMask = smoothstep(0.54, 0.82, c) * smoothstep(0.03, 0.22, d.y) * (1.0 - smoothstep(0.55, 0.92, d.y));
          vec3 cloudCol = mix(uMidColor * 1.15, uSunColor * 1.15, pow(sunAmt, 2.0) * 0.7 + 0.2);
          col = mix(col, cloudCol, cloudMask * 0.55);
        }

        // Delicate pinpoint twilight stars near zenith at dusk
        if (uStarAlpha > 0.01 && d.y > 0.22) {
          vec2 starUv = d.xz / (d.y + 0.15) * 190.0;
          vec2 cell = floor(starUv);
          vec2 f = fract(starUv) - 0.5;
          float rnd = hash21(cell);
          float pinpoint = smoothstep(0.24, 0.03, length(f)) * step(0.986, rnd);
          col += vec3(0.95, 0.97, 1.0) * pinpoint * uStarAlpha * smoothstep(0.22, 0.55, d.y);
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
