import React, { useMemo } from 'react';
import * as THREE from 'three';
import { buildLandGeometries } from '../geography/geoJsonToThree';

export const GeographicLandLayer: React.FC = () => {
  const { extrudedGeometry, coastlineGeometry } = useMemo(
    () => buildLandGeometries(0.035),
    []
  );

  // Custom Shader Material for realistic multi-color natural terrain (valleys, golden plateaus, rocky mountains, snow peaks)
  const terrainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          // Terrain Palette:
          vec3 lowlands     = vec3(0.443, 0.541, 0.345); // #718A58
          vec3 vegetation   = vec3(0.380, 0.475, 0.310); // #61794F
          vec3 plateau      = vec3(0.604, 0.506, 0.357); // #9A815B
          vec3 dryTerrain   = vec3(0.651, 0.549, 0.388); // #A68C63
          vec3 highlands    = vec3(0.435, 0.404, 0.341); // #6F6757
          vec3 coastalRegion= vec3(0.514, 0.608, 0.412); // #839B69

          // Procedural topographic noise for subtle relief feel
          float n1 = noise(vWorldPosition.xz * 0.75);
          float n2 = noise(vWorldPosition.xz * 2.1) * 0.45;
          float terrainElevation = n1 + n2;

          // Regional variation (North highlands, Central plateau, coastal lowlands)
          float isNorthernHighlands = smoothstep(-1.0, -5.5, vWorldPosition.z);
          float isDeccanPlateau = smoothstep(-3.0, 4.0, vWorldPosition.x) * smoothstep(2.0, -2.5, vWorldPosition.z);

          // Layer 1: Lowland to vegetation transition
          vec3 landColor = mix(coastalRegion, lowlands, smoothstep(0.1, 0.4, terrainElevation));
          landColor = mix(landColor, vegetation, smoothstep(0.4, 0.7, terrainElevation));

          // Layer 2: Deccan Plateau and dry inland regions
          landColor = mix(landColor, plateau, isDeccanPlateau * 0.60 + smoothstep(0.65, 0.95, terrainElevation) * 0.30);
          landColor = mix(landColor, dryTerrain, isDeccanPlateau * smoothstep(0.7, 1.2, terrainElevation) * 0.45);

          // Layer 3: Highland mountain belts
          landColor = mix(landColor, highlands, isNorthernHighlands * 0.70 + smoothstep(1.1, 1.45, terrainElevation) * 0.45);

          // Directional lighting & ambient shading
          vec3 lightDir = normalize(vec3(0.45, 0.85, 0.55));
          float diff = max(dot(vNormal, lightDir), 0.25) * 0.75 + 0.38;

          gl_FragColor = vec4(landColor * diff, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Shallow Extruded Land Mesh with Terrain Relief Styling */}
      <mesh
        geometry={extrudedGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        material={terrainMaterial}
      />

      {/* Official 1:50m Natural Earth Coastline Layer */}
      <lineSegments geometry={coastlineGeometry}>
        <lineBasicMaterial
          color="#839B69"
          transparent
          opacity={0.85}
          linewidth={1.5}
        />
      </lineSegments>
    </group>
  );
};
