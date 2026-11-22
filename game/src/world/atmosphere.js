// Cala Solara — Dynamic Golden-Hour / Day / Neon-Dusk / Morning Atmosphere, Crisp Shadows & Layered VFX

import * as THREE from 'three';
import { createOceanMaterial, createSkyDomeMaterial } from '../render/materials.js';

export const TIME_PRESETS = {
  golden: {
    name: 'Golden Hour',
    sunDir: [0.64, 0.29, 0.71],
    sunColor: 0xffc684,
    sunIntensity: 3.15,
    hemiSky: 0x8db6f0,
    hemiGround: 0x4b3d38,
    hemiIntensity: 0.58,
    fogColor: 0xf09c72,
    fogDensity: 0.0012,
    skyTop: 0x1e3f7a,
    skyMid: 0xdc7668,
    skyHorizon: 0xffc17d,
    shallowWater: 0x1bd1c8,
    deepWater: 0x0b3a63,
    emissiveScale: 1.05,
    starAlpha: 0.0,
    grade: { threshold: 0.74, bloomStrength: 0.72, exposure: 1.08, vignette: 0.14, warmTint: [1.05, 1.0, 0.94] },
  },
  day: {
    name: 'Sunlit Noon',
    sunDir: [-0.48, 0.72, 0.50],
    sunColor: 0xfff4dd,
    sunIntensity: 3.25,
    hemiSky: 0x8cc8ff,
    hemiGround: 0x5c5347,
    hemiIntensity: 0.64,
    fogColor: 0xb9dcf2,
    fogDensity: 0.00095,
    skyTop: 0x1e6ec7,
    skyMid: 0x5ea9e8,
    skyHorizon: 0xd7eefc,
    shallowWater: 0x20e0d4,
    deepWater: 0x0c4a7d,
    emissiveScale: 0.32,
    starAlpha: 0.0,
    grade: { threshold: 0.84, bloomStrength: 0.45, exposure: 1.05, vignette: 0.1, warmTint: [1.02, 1.01, 0.98] },
  },
  dusk: {
    name: 'Neon Dusk',
    sunDir: [0.76, 0.12, 0.64],
    sunColor: 0xff7b63,
    sunIntensity: 1.85,
    hemiSky: 0x45508f,
    hemiGround: 0x241d34,
    hemiIntensity: 0.55,
    fogColor: 0x3b2f59,
    fogDensity: 0.00145,
    skyTop: 0x0c1330,
    skyMid: 0x5b2d69,
    skyHorizon: 0xe86b6e,
    shallowWater: 0x158f9c,
    deepWater: 0x091d3b,
    emissiveScale: 1.68,
    starAlpha: 0.72,
    grade: { threshold: 0.62, bloomStrength: 0.96, exposure: 1.15, vignette: 0.18, warmTint: [1.02, 0.96, 1.08] },
  },
  morning: {
    name: 'Coastal Morning',
    sunDir: [0.68, 0.52, -0.52],
    sunColor: 0xffe9c2,
    sunIntensity: 3.0,
    hemiSky: 0x9cd4ff,
    hemiGround: 0x5a5043,
    hemiIntensity: 0.66,
    fogColor: 0xcbe4f2,
    fogDensity: 0.001,
    skyTop: 0x2467b8,
    skyMid: 0x76b8e8,
    skyHorizon: 0xffe2be,
    shallowWater: 0x1fded4,
    deepWater: 0x0d4c80,
    emissiveScale: 0.45,
    starAlpha: 0.0,
    grade: { threshold: 0.82, bloomStrength: 0.48, exposure: 1.06, vignette: 0.1, warmTint: [1.03, 1.01, 0.97] },
  },
};

export const PRESET_ORDER = ['golden', 'day', 'dusk', 'morning'];

export class AtmosphereAndVfxSystem {
  constructor(scene, textures, postfx) {
    this.scene = scene;
    this.textures = textures;
    this.postfx = postfx;
    this.emissiveRefs = [];
    this.animatedProps = [];
    this.currentPreset = 'golden';
    this.elapsed = 0;

    // 1) Sky Dome
    this.skyMat = createSkyDomeMaterial();
    this.skyMesh = new THREE.Mesh(new THREE.SphereGeometry(950, 32, 20), this.skyMat);
    scene.add(this.skyMesh);

    // 2) Animated GLSL Ocean & Surf Plane
    this.oceanMat = createOceanMaterial();
    this.oceanMesh = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 120, 120), this.oceanMat);
    this.oceanMesh.rotation.x = -Math.PI * 0.5;
    this.oceanMesh.position.set(120, 0, 80);
    scene.add(this.oceanMesh);

    // 3) Crisp Follow-Camera Sun Shadows & Hemisphere Fill
    this.hemiLight = new THREE.HemisphereLight(0x8db6f0, 0x4b3d38, 0.58);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffc684, 3.15);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    const d = 76;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    this.sunLight.shadow.bias = -0.00045;
    this.sunLight.shadow.normalBias = 0.045;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    this.sunDir = new THREE.Vector3(0.64, 0.29, 0.71).normalize();
    this.scene.fog = new THREE.FogExp2(0xf09c72, 0.0012);

    // 4) Layered VFX Pools (Billowing smoke, fireballs, sparks, skidmarks, tracers, flash lights)
    this.particles = [];
    this.skidMarks = [];
    this.tracers = [];
    this.flashLights = [];
    this.skidMat = new THREE.MeshBasicMaterial({
      color: 0x111318,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    this.skidGeo = new THREE.PlaneGeometry(0.46, 1.35);
    this.skidGeo.rotateX(-Math.PI * 0.5);

    this.applyPreset('golden');
  }

  registerDistrictEffects(emissiveRefs, animatedProps) {
    this.emissiveRefs = emissiveRefs;
    this.animatedProps = animatedProps;
    this.applyPreset(this.currentPreset);
  }

  applyPreset(key) {
    const p = TIME_PRESETS[key] || TIME_PRESETS.golden;
    this.currentPreset = key;
    this.sunDir.set(p.sunDir[0], p.sunDir[1], p.sunDir[2]).normalize();

    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;
    this.hemiLight.color.setHex(p.hemiSky);
    this.hemiLight.groundColor.setHex(p.hemiGround);
    this.hemiLight.intensity = p.hemiIntensity;

    this.scene.fog.color.setHex(p.fogColor);
    this.scene.fog.density = p.fogDensity;

    this.skyMat.uniforms.uTopColor.value.setHex(p.skyTop);
    this.skyMat.uniforms.uMidColor.value.setHex(p.skyMid);
    this.skyMat.uniforms.uHorizonColor.value.setHex(p.skyHorizon);
    this.skyMat.uniforms.uSunDir.value.copy(this.sunDir);
    this.skyMat.uniforms.uSunColor.value.setHex(p.sunColor);
    this.skyMat.uniforms.uStarAlpha.value = p.starAlpha;

    this.oceanMat.uniforms.uSunDir.value.copy(this.sunDir);
    this.oceanMat.uniforms.uSunColor.value.setHex(p.sunColor);
    this.oceanMat.uniforms.uShallowColor.value.setHex(p.shallowWater);
    this.oceanMat.uniforms.uDeepColor.value.setHex(p.deepWater);
    this.oceanMat.uniforms.uHorizonColor.value.setHex(p.skyHorizon);
    this.oceanMat.uniforms.uFogColor.value.setHex(p.fogColor);
    this.oceanMat.uniforms.uFogDensity.value = p.fogDensity;

    for (const ref of this.emissiveRefs) {
      ref.mat.emissiveIntensity = ref.alwaysBright ? ref.base * Math.max(0.85, p.emissiveScale) : ref.base * p.emissiveScale;
    }

    if (this.postfx) this.postfx.setGrade(p.grade);
  }

  cyclePreset() {
    const idx = (PRESET_ORDER.indexOf(this.currentPreset) + 1) % PRESET_ORDER.length;
    const next = PRESET_ORDER[idx];
    this.applyPreset(next);
    return TIME_PRESETS[next].name;
  }

  spawnSprite(pos, vel, {
    color = 0xdfe4ec,
    size = 1.2,
    grow = 2.4,
    life = 0.75,
    opacity = 0.55,
    additive = false,
    gravity = 0,
  } = {}) {
    if (this.particles.length > 260) {
      const old = this.particles.shift();
      this.scene.remove(old.mesh);
      old.mesh.material.dispose();
    }
    const mat = new THREE.SpriteMaterial({
      map: this.textures.softParticleMap,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.copy(pos);
    sp.scale.set(size, size, 1);
    this.scene.add(sp);
    this.particles.push({ mesh: sp, vel: vel.clone(), life, maxLife: life, size, grow, baseOpacity: opacity, gravity });
  }

  spawnTireSmoke(pos, carVel) {
    const v = new THREE.Vector3(
      (Math.random() - 0.5) * 2.2 - carVel.x * 0.08,
      1.2 + Math.random() * 1.4,
      (Math.random() - 0.5) * 2.2 - carVel.z * 0.08
    );
    this.spawnSprite(pos, v, {
      color: 0xe6e9ef,
      size: 1.0 + Math.random() * 0.5,
      grow: 3.4,
      life: 0.72 + Math.random() * 0.25,
      opacity: 0.42,
      additive: false,
    });
  }

  spawnSkidMark(pos, yaw) {
    if (this.skidMarks.length > 180) {
      const old = this.skidMarks.shift();
      this.scene.remove(old);
    }
    const m = new THREE.Mesh(this.skidGeo, this.skidMat);
    m.position.set(pos.x, pos.y + 0.04, pos.z);
    m.rotation.y = yaw;
    this.scene.add(m);
    this.skidMarks.push(m);
  }

  spawnMuzzleFlash(pos, dir, color = 0xffd27a) {
    this.spawnSprite(pos, dir.clone().multiplyScalar(2.5), {
      color,
      size: 1.25,
      grow: 1.4,
      life: 0.09,
      opacity: 0.98,
      additive: true,
    });
    this.spawnFlashLight(pos, color, 5.5, 16, 0.08);
  }

  spawnTracer(start, end, color = 0xffe69c, life = 0.08) {
    const dist = start.distanceTo(end);
    if (dist < 0.2) return;
    const geo = new THREE.CylinderGeometry(0.032, 0.055, dist, 5);
    geo.rotateX(Math.PI * 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.lookAt(end);
    this.scene.add(mesh);
    this.tracers.push({ mesh, life, maxLife: life });
  }

  spawnImpactSparks(pos, count = 7, color = 0xffc45e) {
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 11,
        2.5 + Math.random() * 7,
        (Math.random() - 0.5) * 11
      );
      this.spawnSprite(pos, v, {
        color,
        size: 0.34,
        grow: -0.2,
        life: 0.28 + Math.random() * 0.16,
        opacity: 1.0,
        additive: true,
        gravity: 16,
      });
    }
  }

  spawnExplosion(pos, radius = 1.0) {
    // 1) Blazing hot white-amber core
    for (let i = 0; i < 6; i++) {
      const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.6 + Math.random() * 1.2, (Math.random() - 0.5) * 1.4));
      this.spawnSprite(p, new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 4, (Math.random() - 0.5) * 4), {
        color: i < 2 ? 0xfff3c4 : 0xff7b24,
        size: (3.2 + Math.random() * 1.8) * radius,
        grow: 6.5 * radius,
        life: 0.45 + Math.random() * 0.25,
        opacity: 0.95,
        additive: true,
      });
    }
    // 2) Rising dark charcoal smoke plume (prevents flat yellow road smear!)
    for (let i = 0; i < 10; i++) {
      const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2.4, 0.9 + Math.random() * 1.8, (Math.random() - 0.5) * 2.4));
      this.spawnSprite(p, new THREE.Vector3((Math.random() - 0.5) * 3.5, 4.2 + Math.random() * 4.5, (Math.random() - 0.5) * 3.5), {
        color: i % 2 === 0 ? 0x202229 : 0x3b3838,
        size: (2.6 + Math.random() * 1.8) * radius,
        grow: 5.5 * radius,
        life: 1.35 + Math.random() * 0.6,
        opacity: 0.78,
        additive: false,
      });
    }
    // 3) Flying glowing embers & dynamic flash light
    this.spawnImpactSparks(pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 14, 0xffaa33);
    this.spawnFlashLight(pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 0xff8b30, 14, 42, 0.45);
  }

  spawnFlashLight(pos, color, intensity, distance, life) {
    if (this.flashLights.length > 6) {
      const old = this.flashLights.shift();
      this.scene.remove(old.light);
    }
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(pos);
    this.scene.add(light);
    this.flashLights.push({ light, life, maxLife: life, baseIntensity: intensity });
  }

  update(dt, focusPos, freezeParticles = false) {
    this.elapsed += dt;
    this.oceanMat.uniforms.uTime.value = this.elapsed;
    this.skyMat.uniforms.uTime.value = this.elapsed;

    // Follow-camera tight directional shadow box for crisp shadows everywhere!
    if (focusPos) {
      this.skyMesh.position.set(focusPos.x, 0, focusPos.z);
      this.sunLight.target.position.set(focusPos.x, 0, focusPos.z);
      this.sunLight.position.set(
        focusPos.x + this.sunDir.x * 125,
        this.sunDir.y * 125,
        focusPos.z + this.sunDir.z * 125
      );
    }

    // Animate lighthouse beam & coastal palm frond breeze
    for (const prop of this.animatedProps) {
      if (prop.type === 'rotateY') prop.obj.rotation.y += prop.speed * dt;
      else if (prop.type === 'sway') {
        prop.obj.rotation.z = Math.sin(this.elapsed * 1.6 + prop.phase) * 0.06;
        prop.obj.rotation.x = Math.cos(this.elapsed * 1.3 + prop.phase) * 0.04;
      }
    }

    if (freezeParticles) return;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const t = 1 - p.life / p.maxLife;
      const curSize = Math.max(0.05, p.size + p.grow * t);
      p.mesh.scale.set(curSize, curSize, 1);
      p.mesh.material.opacity = p.baseOpacity * (1 - t);
    }

    // Update tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.mesh);
        tr.mesh.geometry.dispose();
        tr.mesh.material.dispose();
        this.tracers.splice(i, 1);
      } else {
        tr.mesh.material.opacity = (tr.life / tr.maxLife) * 0.92;
      }
    }

    // Update dynamic flash lights
    for (let i = this.flashLights.length - 1; i >= 0; i--) {
      const fl = this.flashLights[i];
      fl.life -= dt;
      if (fl.life <= 0) {
        this.scene.remove(fl.light);
        this.flashLights.splice(i, 1);
      } else {
        fl.light.intensity = fl.baseIntensity * (fl.life / fl.maxLife);
      }
    }
  }
}
