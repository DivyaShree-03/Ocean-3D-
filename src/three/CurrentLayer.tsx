import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleCurrentField } from '../data/demoCurrents';
import { geoToScene, SCENE_BOUNDS } from '../utils/geoToScene';
import { regionalLandData } from '../data/geography/regionalLand';
import { useExplorerStore } from '../store/explorerStore';

interface Particle {
  lon: number;
  lat: number;
  age: number;
  maxAge: number;
}

export const CurrentLayer: React.FC = () => {
  const currentDensity = useExplorerStore((state) => state.currentDensity);
  const showCurrents = useExplorerStore((state) => state.showCurrents);

  // Determine particle count based on density setting (Phase 3B: Low 400, Medium 800, High 1400)
  const numParticles = useMemo(() => {
    switch (currentDensity) {
      case 'low': return 400;
      case 'medium': return 800;
      case 'high': return 1400;
      default: return 800;
    }
  }, [currentDensity]);

  const lineMeshRef = useRef<THREE.LineSegments>(null);
  const pointsMeshRef = useRef<THREE.Points>(null);

  // 1. Precompute CPU Land Mask raster (256x256) for instant O(1) particle land-collision checks
  const landMaskCtx = useMemo(() => {
    const width = 256;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';

    const lonSpan = SCENE_BOUNDS.MAX_LON - SCENE_BOUNDS.MIN_LON;
    const latSpan = SCENE_BOUNDS.MAX_LAT - SCENE_BOUNDS.MIN_LAT;

    const lonToPx = (lon: number) => ((lon - SCENE_BOUNDS.MIN_LON) / lonSpan) * width;
    const latToPy = (lat: number) => ((SCENE_BOUNDS.MAX_LAT - lat) / latSpan) * height;

    regionalLandData.features.forEach((feature: any) => {
      const geometry = feature.geometry;
      if (!geometry) return;

      const drawRing = (ring: number[][]) => {
        if (!ring || ring.length === 0) return;
        ctx.moveTo(lonToPx(ring[0][0]), latToPy(ring[0][1]));
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(lonToPx(ring[i][0]), latToPy(ring[i][1]));
        }
      };

      ctx.beginPath();
      if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach((ring: number[][]) => drawRing(ring));
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((poly: number[][][]) => {
          poly.forEach((ring: number[][]) => drawRing(ring));
        });
      }
      ctx.closePath();
      ctx.fill('evenodd');
    });

    const imgData = ctx.getImageData(0, 0, width, height);
    return { data: imgData.data, width, height };
  }, []);

  // Fast O(1) CPU Land Lookup
  const checkIsLand = (lon: number, lat: number): boolean => {
    if (!landMaskCtx) return false;
    if (lon < SCENE_BOUNDS.MIN_LON || lon > SCENE_BOUNDS.MAX_LON ||
        lat < SCENE_BOUNDS.MIN_LAT || lat > SCENE_BOUNDS.MAX_LAT) {
      return true;
    }

    const px = Math.floor(((lon - SCENE_BOUNDS.MIN_LON) / (SCENE_BOUNDS.MAX_LON - SCENE_BOUNDS.MIN_LON)) * landMaskCtx.width);
    const py = Math.floor(((SCENE_BOUNDS.MAX_LAT - lat) / (SCENE_BOUNDS.MAX_LAT - SCENE_BOUNDS.MIN_LAT)) * landMaskCtx.height);
    const idx = (py * landMaskCtx.width + px) * 4;
    return landMaskCtx.data[idx] > 128;
  };

  // Helper to spawn a particle at a valid ocean location
  const getRandomOceanPoint = (): [number, number] => {
    let attempts = 0;
    while (attempts < 60) {
      const lon = SCENE_BOUNDS.MIN_LON + Math.random() * (SCENE_BOUNDS.MAX_LON - SCENE_BOUNDS.MIN_LON);
      const lat = SCENE_BOUNDS.MIN_LAT + Math.random() * (SCENE_BOUNDS.MAX_LAT - SCENE_BOUNDS.MIN_LAT);
      if (!checkIsLand(lon, lat)) {
        return [lon, lat];
      }
      attempts++;
    }
    return [85.0, 12.0];
  };

  // 2. Custom Shader Material for circular small particle heads (eliminates square point artifacts)
  const headMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute float a_alpha;
        varying float v_alpha;
        void main() {
          v_alpha = a_alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.2; // Small 2.2px circular leading head dot
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float v_alpha;
        void main() {
          vec2 p = gl_PointCoord - vec2(0.5);
          if (length(p) > 0.5) {
            discard; // Circular point clipping: removes square artifacts
          }
          gl_FragColor = vec4(0.96, 0.99, 1.0, 0.90 * v_alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // 3. Preallocated Typed Arrays & Particle Initialization
  const { particles, positionAttribute, lineAlphaAttribute, headPosAttribute, headAlphaAttribute } = useMemo(() => {
    const pts: Particle[] = [];
    const totalVertices = numParticles * 2; // Tail + Head per particle

    const posArray = new Float32Array(totalVertices * 3);
    const lineAlphaArray = new Float32Array(totalVertices * 4);

    const headPosArray = new Float32Array(numParticles * 3);
    const headAlphaArray = new Float32Array(numParticles);

    for (let i = 0; i < numParticles; i++) {
      const [lon, lat] = getRandomOceanPoint();
      const maxAge = 2.5 + Math.random() * 3.5;
      const age = Math.random() * maxAge;

      pts.push({ lon, lat, age, maxAge });

      // Tail vertex (dimmer #F5FCFF, alpha 0.15)
      lineAlphaArray[i * 8 + 0] = 0.96;
      lineAlphaArray[i * 8 + 1] = 0.99;
      lineAlphaArray[i * 8 + 2] = 1.0;
      lineAlphaArray[i * 8 + 3] = 0.15;

      // Head vertex (brighter #F5FCFF, alpha 0.65)
      lineAlphaArray[i * 8 + 4] = 0.96;
      lineAlphaArray[i * 8 + 5] = 0.99;
      lineAlphaArray[i * 8 + 6] = 1.0;
      lineAlphaArray[i * 8 + 7] = 0.65;

      headAlphaArray[i] = 1.0;
    }

    const posAttr = new THREE.BufferAttribute(posArray, 3);
    const lineAlphaAttr = new THREE.BufferAttribute(lineAlphaArray, 4);

    const headPosAttr = new THREE.BufferAttribute(headPosArray, 3);
    const headAlphaAttr = new THREE.BufferAttribute(headAlphaArray, 1);

    return {
      particles: pts,
      positionAttribute: posAttr,
      lineAlphaAttribute: lineAlphaAttr,
      headPosAttribute: headPosAttr,
      headAlphaAttribute: headAlphaAttr,
    };
  }, [numParticles]);

  // 4. Animation Update Loop (direct GPU Float32Array updates in useFrame)
  useFrame((_, delta) => {
    if (!showCurrents || !lineMeshRef.current) return;

    const dt = Math.min(delta, 0.05);
    const speedScale = 1.2; // Visual speed factor
    const posArray = positionAttribute.array as Float32Array;
    const headPosArray = headPosAttribute.array as Float32Array;

    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];
      p.age += dt;

      // Sample vector field
      const { u, v, speed } = sampleCurrentField(p.lon, p.lat);

      // Advect particle head position
      p.lon += u * 0.70 * speedScale * dt;
      p.lat += v * 0.70 * speedScale * dt;

      // Check collision / out-of-bounds / age expiration
      const hitLand = checkIsLand(p.lon, p.lat);
      const expired = p.age >= p.maxAge;

      if (hitLand || expired) {
        const [newLon, newLat] = getRandomOceanPoint();
        p.lon = newLon;
        p.lat = newLat;
        p.age = 0;
        p.maxAge = 2.5 + Math.random() * 3.5;
      }

      // Compute normalized direction vector
      let du = u;
      let dv = v;
      if (speed > 0.01) {
        du = u / speed;
        dv = v / speed;
      }

      // Dynamic trail length based on current speed (0.15 to 0.35 scene units equivalent)
      const normSpeed = Math.min(1.0, Math.max(0.0, (speed - 0.15) / 1.0));
      const trailLengthDeg = 0.55 + normSpeed * 0.75; // in lon/lat degrees

      // Tail geographic position: head - direction * trailLength
      const tailLon = p.lon - du * trailLengthDeg;
      const tailLat = p.lat - dv * trailLengthDeg;

      // Map tail & head to 3D scene coordinates
      const [tailX, tailY, tailZ] = geoToScene(tailLon, tailLat, 15, 1.0);
      const [headX, headY, headZ] = geoToScene(p.lon, p.lat, 15, 1.0);

      // Line Segment: Tail -> Head (Y offset +0.005)
      posArray[i * 6 + 0] = tailX;
      posArray[i * 6 + 1] = tailY + 0.005;
      posArray[i * 6 + 2] = tailZ;

      posArray[i * 6 + 3] = headX;
      posArray[i * 6 + 4] = headY + 0.005;
      posArray[i * 6 + 5] = headZ;

      // Head Point: exact head position (Y offset +0.006)
      headPosArray[i * 3 + 0] = headX;
      headPosArray[i * 3 + 1] = headY + 0.006;
      headPosArray[i * 3 + 2] = headZ;
    }

    positionAttribute.needsUpdate = true;
    headPosAttribute.needsUpdate = true;
  });

  if (!showCurrents) return null;

  return (
    <group>
      {/* 1. Directional Trail Line Segments (tail -> head) */}
      <lineSegments ref={lineMeshRef}>
        <bufferGeometry>
          <primitive object={positionAttribute} attach="attributes-position" />
          <primitive object={lineAlphaAttribute} attach="attributes-color" />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.85}
          linewidth={1.8}
          depthWrite={false}
        />
      </lineSegments>

      {/* 2. Small Circular Leading Head Dots (gl_PointCoord clipped, zero square artifacts) */}
      <points ref={pointsMeshRef} material={headMaterial}>
        <bufferGeometry>
          <primitive object={headPosAttribute} attach="attributes-position" />
          <primitive object={headAlphaAttribute} attach="attributes-a_alpha" />
        </bufferGeometry>
      </points>
    </group>
  );
};
