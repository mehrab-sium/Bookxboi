import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Custom GLSL Shader Material for realistic page curl
const PageCurlShader = {
  uniforms: {
    uTexture: { value: null },
    uBackTexture: { value: null },
    uProgress: { value: 0.0 }, // 0.0 (flat right) to 1.0 (flat left)
    uSpineLeft: { value: 1.0 }, // 1.0 for right-to-left turn, -1.0 for left-to-right
  },
  vertexShader: `
    uniform float uProgress;
    uniform float uSpineLeft;
    varying vec2 vUv;
    varying float vDirection;
    varying float vDepthShadow;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Map X from [-0.5, 0.5] to [0.0, 1.0] relative to the spine
      // Assuming spine is at x = -0.5 (left side) and page curls to the left
      float x = pos.x + 0.5; 
      
      // Page curl deformation math
      float pi = 3.14159265;
      float angle = uProgress * pi;
      
      // The radius of the curl. It starts small, expands, and flattens out
      float radius = 0.12 + 0.12 * sin(angle);
      
      // Curl axis line: x_bend moves from right to left (1.1 down to -0.1)
      float x_bend = 1.1 - uProgress * 2.2;
      
      // Angled curl: add a small factor of y so the page curls diagonally
      float deformCoord = x - (x_bend + pos.y * 0.1);
      
      if (deformCoord > 0.0) {
        float theta = deformCoord / radius;
        if (theta < pi) {
          // Inside the cylinder bend
          x = (x_bend + pos.y * 0.1) + radius * sin(theta);
          pos.z = radius * (1.0 - cos(theta));
          vDirection = 1.0;
          vDepthShadow = sin(theta);
        } else {
          // Flipped over, lying flat on the left
          x = (x_bend + pos.y * 0.1) - (deformCoord - radius * pi);
          pos.z = radius * 2.0;
          vDirection = -1.0;
          vDepthShadow = 0.0;
        }
      } else {
        // Flat page on the right side
        vDirection = 1.0;
        vDepthShadow = 0.0;
      }
      
      pos.x = x - 0.5;
      
      // Lift the page slightly during mid-flip to prevent mesh intersection
      pos.z += sin(uProgress * pi) * 0.08;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform sampler2D uBackTexture;
    uniform float uProgress;
    varying vec2 vUv;
    varying float vDirection;
    varying float vDepthShadow;

    void main() {
      vec4 texColor;
      
      if (vDirection > 0.0) {
        // Front page content
        texColor = texture2D(uTexture, vUv);
      } else {
        // Back page content (flip horizontally because it is seen from the back)
        vec2 flippedUv = vec2(1.0 - vUv.x, vUv.y);
        texColor = texture2D(uBackTexture, flippedUv);
        
        // Darken the back of the page for realism (paper opacity/shadow)
        texColor.rgb *= 0.85;
      }

      // Add shading inside the curl (vDepthShadow represents curvature height)
      float shadow = 1.0 - (vDepthShadow * 0.45 * sin(uProgress * 3.14159265));
      
      // Spine shadow gradient
      float spineShadow = smoothstep(0.0, 0.25, vUv.x + 0.5);
      shadow *= (0.75 + 0.25 * spineShadow);

      gl_FragColor = vec4(texColor.rgb * shadow, texColor.a);
    }
  `
};

// Shader material instance wrapper
function PageMesh({ currentPageCanvas, nextPageCanvas, isAnimating, onAnimationComplete }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const progressRef = useRef(0);
  
  const frontTextureRef = useRef(null);
  const backTextureRef = useRef(null);

  // Load textures synchronously to avoid first-frame null renders in Fiber
  const frontTexture = React.useMemo(() => {
    if (frontTextureRef.current) {
      frontTextureRef.current.dispose();
    }
    if (!currentPageCanvas) return null;
    const tex = new THREE.CanvasTexture(currentPageCanvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    frontTextureRef.current = tex;
    return tex;
  }, [currentPageCanvas]);

  const backTexture = React.useMemo(() => {
    if (backTextureRef.current) {
      backTextureRef.current.dispose();
    }
    if (!nextPageCanvas) return null;
    const tex = new THREE.CanvasTexture(nextPageCanvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    backTextureRef.current = tex;
    return tex;
  }, [nextPageCanvas]);

  // Frame animation loop
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    const uniforms = materialRef.current.uniforms;

    if (isAnimating) {
      // Progress from 0 to 1 over 0.7 seconds
      progressRef.current += delta * 1.45;
      if (progressRef.current >= 1.0) {
        progressRef.current = 1.0;
        uniforms.uProgress.value = 1.0;
        // Let react know animation is done
        onAnimationComplete();
      } else {
        uniforms.uProgress.value = progressRef.current;
      }
    } else {
      progressRef.current = 0;
      uniforms.uProgress.value = 0.0;
    }
  });

  if (!frontTexture || !backTexture) return null;

  return (
    <group>
      {/* Background Static Page (The Next Page) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3, 4]} />
        <meshBasicMaterial map={backTexture} transparent />
      </mesh>

      {/* Curling Page Mesh (High Segments for Smooth Bend) */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[3, 4, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          args={[PageCurlShader]}
          uniforms-uTexture-value={frontTexture}
          uniforms-uBackTexture-value={backTexture}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function Book3D({
  currentPageCanvas,
  nextPageCanvas,
  isAnimating,
  onAnimationComplete,
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
      <Canvas
        camera={{ fov: 50, position: [0, 0, 4.289] }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 5, 3]} intensity={1.0} castShadow />
        
        {(currentPageCanvas && nextPageCanvas) ? (
          <PageMesh
            currentPageCanvas={currentPageCanvas}
            nextPageCanvas={nextPageCanvas}
            isAnimating={isAnimating}
            onAnimationComplete={onAnimationComplete}
          />
        ) : null}
      </Canvas>
    </div>
  );
}
