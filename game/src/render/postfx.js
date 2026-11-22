// Custom lightweight HDR Bloom + ACES Filmic Color Grading Post-Processor
// Zero external dependencies; renders into HalfFloat (or fallback UnsignedByte) render targets.

import * as THREE from 'three';

const FULLSCREEN_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BRIGHT_FRAG = `
uniform sampler2D tScene;
uniform float uThreshold;
uniform float uKnee;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float soft = clamp((luma - uThreshold + uKnee) / (2.0 * uKnee + 0.0001), 0.0, 1.0);
  soft = soft * soft;
  float contrib = max(soft, step(uThreshold, luma));
  float weight = max(luma - uThreshold, 0.0) / max(luma, 0.0001);
  vec3 bright = c * max(weight, soft * 0.42) * contrib;
  gl_FragColor = vec4(min(bright, vec3(6.0)), 1.0);
}
`;

const BLUR_FRAG = `
uniform sampler2D tInput;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 acc = texture2D(tInput, vUv).rgb * 0.2270270270;
  acc += texture2D(tInput, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  acc += texture2D(tInput, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  acc += texture2D(tInput, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  acc += texture2D(tInput, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(acc, 1.0);
}
`;

const COMPOSITE_FRAG = `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uBloomStrength;
uniform float uExposure;
uniform float uVignette;
uniform vec3 uWarmTint;
varying vec2 vUv;

vec3 acesFilm(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec3 base = texture2D(tScene, vUv).rgb;
  vec3 bloom = texture2D(tBloom, vUv).rgb;
  vec3 hdr = (base + bloom * uBloomStrength) * uExposure;
  hdr *= uWarmTint;
  vec3 mapped = acesFilm(hdr);

  // Subtle saturation lift for sun-soaked coastal vibrancy
  float gray = dot(mapped, vec3(0.299, 0.587, 0.114));
  mapped = mix(vec3(gray), mapped, 1.12);

  // Subtle cinema vignette
  vec2 centered = (vUv - 0.5) * 2.0;
  float vig = 1.0 - dot(centered, centered) * uVignette;
  mapped *= clamp(vig, 0.65, 1.0);

  // Gamma encode to sRGB
  mapped = pow(clamp(mapped, 0.0, 1.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(mapped, 1.0);
}
`;

export class BloomPostProcessor {
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this.enabled = true;

    const gl = renderer.getContext();
    const isWebGL2 = renderer.capabilities.isWebGL2;
    const hasHalfFloat = isWebGL2
      ? !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float')
      : !!gl.getExtension('OES_texture_half_float');

    this.targetType = hasHalfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.quadGeo = new THREE.PlaneGeometry(2, 2);
    this.orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.brightMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: BRIGHT_FRAG,
      uniforms: {
        tScene: { value: null },
        uThreshold: { value: 0.72 },
        uKnee: { value: 0.32 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.blurMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: BLUR_FRAG,
      uniforms: {
        tInput: { value: null },
        uDir: { value: new THREE.Vector2(1 / 512, 0) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.compMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        uBloomStrength: { value: 0.72 },
        uExposure: { value: 1.08 },
        uVignette: { value: 0.14 },
        uWarmTint: { value: new THREE.Vector3(1.03, 1.0, 0.96) },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadScene = new THREE.Scene();
    this.quadMesh = new THREE.Mesh(this.quadGeo, this.compMat);
    this.quadScene.add(this.quadMesh);

    this.sceneRT = null;
    this.bloomA = null;
    this.bloomB = null;
    this.resize(width, height);
  }

  setGrade({ threshold, bloomStrength, exposure, vignette, warmTint }) {
    if (threshold !== undefined) this.brightMat.uniforms.uThreshold.value = threshold;
    if (bloomStrength !== undefined) this.compMat.uniforms.uBloomStrength.value = bloomStrength;
    if (exposure !== undefined) this.compMat.uniforms.uExposure.value = exposure;
    if (vignette !== undefined) this.compMat.uniforms.uVignette.value = vignette;
    if (warmTint) this.compMat.uniforms.uWarmTint.value.set(warmTint[0], warmTint[1], warmTint[2]);
  }

  resize(width, height) {
    const w = Math.max(2, Math.floor(width));
    const h = Math.max(2, Math.floor(height));
    const bw = Math.max(2, Math.floor(w * 0.35));
    const bh = Math.max(2, Math.floor(h * 0.35));

    if (this.sceneRT) this.sceneRT.dispose();
    if (this.bloomA) this.bloomA.dispose();
    if (this.bloomB) this.bloomB.dispose();

    const opts = {
      type: this.targetType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    };

    this.sceneRT = new THREE.WebGLRenderTarget(w, h, { ...opts, depthBuffer: true });
    this.bloomA = new THREE.WebGLRenderTarget(bw, bh, { ...opts, depthBuffer: false });
    this.bloomB = new THREE.WebGLRenderTarget(bw, bh, { ...opts, depthBuffer: false });
    this.bloomW = bw;
    this.bloomH = bh;
  }

  render(scene, camera) {
    if (!this.enabled) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
      return;
    }

    const r = this.renderer;
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);

    // 1) Bright-pass luminance extraction
    this.quadMesh.material = this.brightMat;
    this.brightMat.uniforms.tScene.value = this.sceneRT.texture;
    r.setRenderTarget(this.bloomA);
    r.render(this.quadScene, this.orthoCam);

    // 2) Two-iteration separable Gaussian blur for wide creamy bloom halos
    this.quadMesh.material = this.blurMat;
    for (let pass = 0; pass < 2; pass++) {
      const spread = pass === 0 ? 1.0 : 2.1;
      this.blurMat.uniforms.tInput.value = this.bloomA.texture;
      this.blurMat.uniforms.uDir.value.set(spread / this.bloomW, 0);
      r.setRenderTarget(this.bloomB);
      r.render(this.quadScene, this.orthoCam);

      this.blurMat.uniforms.tInput.value = this.bloomB.texture;
      this.blurMat.uniforms.uDir.value.set(0, spread / this.bloomH);
      r.setRenderTarget(this.bloomA);
      r.render(this.quadScene, this.orthoCam);
    }

    // 3) Filmic ACES composite to screen
    this.quadMesh.material = this.compMat;
    this.compMat.uniforms.tScene.value = this.sceneRT.texture;
    this.compMat.uniforms.tBloom.value = this.bloomA.texture;
    r.setRenderTarget(null);
    r.render(this.quadScene, this.orthoCam);
  }
}
