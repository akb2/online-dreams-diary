import { Vector2 } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";





export const OITPass: ShaderPass = new ShaderPass({
  uniforms: {
    tOpaque: { type: "t", value: null },
    tTransparent: { type: "t", value: null },
    uResolution: { type: "v2", value: new Vector2(1, 1) },
    uOpacity: { type: "f", value: 1.0 },
    uStepSize: { type: "f", value: 1.0 },
    uSliceCount: { type: "i", value: 50 },
  },

  vertexShader: /* glsl */ `
    precision highp float;
    precision highp int;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;
    precision highp int;
    uniform sampler2D tOpaque;
    uniform sampler2D tTransparent;
    uniform vec2 uResolution;
    uniform float uOpacity;
    uniform float uStepSize;
    uniform int uSliceCount;
    varying vec2 vUv;

    const int MAX_FRAGMENT_COUNT = 50;
    const int ACCUMULATION_BUFFER_SIZE = MAX_FRAGMENT_COUNT * 4;

    int uFragmentCount;
    int uHeadPointer[MAX_FRAGMENT_COUNT];
    int uFragmentStorage[ACCUMULATION_BUFFER_SIZE];

    void storeFragment(int index, float depth, vec3 color) {
      int loc = index * 4;

      uFragmentStorage[loc + 0] = floatBitsToInt(depth);
      uFragmentStorage[loc + 1] = floatBitsToInt(color.r);
      uFragmentStorage[loc + 2] = floatBitsToInt(color.g);
      uFragmentStorage[loc + 3] = floatBitsToInt(color.b);
    }

    void getFragment(int index, out float depth, out vec3 color) {
      int loc = index * 4;

      depth = intBitsToFloat(uFragmentStorage[loc + 0]);
      color.r = intBitsToFloat(uFragmentStorage[loc + 1]);
      color.g = intBitsToFloat(uFragmentStorage[loc + 2]);
      color.b = intBitsToFloat(uFragmentStorage[loc + 3]);
    }

    void clearBuffers() {
      for (int i = 0; i < uSliceCount; i++) {
        uHeadPointer[i] = -1;
      }

      for (int i = 0; i < ACCUMULATION_BUFFER_SIZE; i++) {
        uFragmentStorage[i] = 0;
      }

      uFragmentCount = 0;
    }

    void main() {
      clearBuffers();
      vec2 texelSize = vec2(1.0) / uResolution;
      vec2 offset = vec2(0.5) / uResolution;

      for (int i = 0; i < uSlice; i++) {
        float depth = texture2D(tTransparent, vUv + offset + vec2(0.0, float(i) * uStepSize * texelSize.y)).a;
        vec4 color = texture2D(tTransparent, vUv + offset + vec2(0.0, float(i) * uStepSize * texelSize.y));  if (color.a == 0.0) continue;

        vec4 opaqueColor = texture2D(tOpaque, vUv + offset);
        float opaqueDepth = opaqueColor.a;

        if (depth > opaqueDepth) continue;

        int headPointerIndex = i;
        float headDepth;
        vec3 headColor;
        bool isOverlapping = false;
        int currentFragmentIndex = uHeadPointer[headPointerIndex];

        while (currentFragmentIndex != -1) {
          getFragment(currentFragmentIndex, headDepth, headColor);

          if (depth >= headDepth) {
            storeFragment(currentFragmentIndex, depth, color.rgb);
            isOverlapping = true;
            break;
          }

          currentFragmentIndex = intBitsToFloat(uFragmentStorage[currentFragmentIndex * 4 + 3]);
        }

        if (!isOverlapping) {
          storeFragment(uFragmentCount, depth, color.rgb);

          if (uHeadPointer[headPointerIndex] != -1) {
            uFragmentStorage[uFragmentCount * 4 + 3] = floatBitsToInt(uHeadPointer[headPointerIndex]);
          }

          uHeadPointer[headPointerIndex] = uFragmentCount;
          uFragmentCount++;
        }
      }

      vec4 finalColor = vec4(0.0);
      float accumulatedAlpha = 0.0;

      for (int i = 0; i < uSliceCount; i++) {
        int currentFragmentIndex = uHeadPointer[i];

        while (currentFragmentIndex != -1) {
          float depth;
          vec3 color;

          getFragment(currentFragmentIndex, depth, color);

          vec4 sampleColor = vec4(color, 1.0);

          finalColor.rgb += (1.0 - accumulatedAlpha) * sampleColor.rgb * sampleColor.a;
          accumulatedAlpha += (1.0 - accumulatedAlpha) * sampleColor.a;

          if (accumulatedAlpha >= 1.0) break;

          currentFragmentIndex = intBitsToFloat(uFragmentStorage[currentFragmentIndex * 4 + 3]);
        }

        if (accumulatedAlpha >= 1.0) break;
      }

      finalColor.a = uOpacity;
      gl_FragColor = finalColor;
    }
  `
});
