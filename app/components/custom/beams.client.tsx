import { type FC, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

import { useFrame } from "@react-three/fiber";

import { PerspectiveCamera } from "@react-three/drei";

import {
  BufferAttribute,
  BufferGeometry,
  type Camera,
  Color,
  type DirectionalLight,
  type Mesh,
  MeshStandardMaterial,
  type ShaderMaterial,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";

import { ShaderCanvas, extendMaterial, glslNoise, hexToNormalizedRGB } from "#/lib/shader";

interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

const Beams: FC<BeamsProps> = ({
  beamWidth = 2,
  beamHeight = 15,
  beamNumber = 12,
  lightColor = "#ffffff",
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 0,
}) => {
  const meshRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null!);

  const beamMaterial = useMemo(
    () =>
      extendMaterial(MeshStandardMaterial, {
        header: `
  varying vec3 vEye;
  varying float vNoise;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform float uSpeed;
  uniform float uNoiseIntensity;
  uniform float uScale;
  ${glslNoise}`,
        vertexHeader: `
  float getPos(vec3 pos) {
    vec3 noisePos =
      vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
    return cnoise(noisePos);
  }
  vec3 getCurrentPos(vec3 pos) {
    vec3 newpos = pos;
    newpos.z += getPos(pos);
    return newpos;
  }
  vec3 getNormal(vec3 pos) {
    vec3 curpos = getCurrentPos(pos);
    vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
    vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
    vec3 tangentX = normalize(nextposX - curpos);
    vec3 tangentZ = normalize(nextposZ - curpos);
    return normalize(cross(tangentZ, tangentX));
  }`,
        fragmentHeader: "",
        vertex: {
          "#include <begin_vertex>": `transformed.z += getPos(transformed.xyz);`,
          "#include <beginnormal_vertex>": `objectNormal = getNormal(position.xyz);`,
        },
        fragment: {
          "#include <dithering_fragment>": `
    float randomNoise = noise(gl_FragCoord.xy);
    gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`,
        },
        material: { fog: true },
        uniforms: {
          diffuse: new Color(...hexToNormalizedRGB("#000000")),
          time: { shared: true, mixed: true, linked: true, value: 0 },
          roughness: 0.3,
          metalness: 0.3,
          uSpeed: { shared: true, mixed: true, linked: true, value: speed },
          envMapIntensity: 10,
          uNoiseIntensity: noiseIntensity,
          uScale: scale,
        },
      }),
    [speed, noiseIntensity, scale],
  );

  return (
    <ShaderCanvas backgroundColor="#000000">
      <group rotation={[0, 0, degToRad(rotation)]}>
        <PlaneNoise
          ref={meshRef}
          material={beamMaterial}
          count={beamNumber}
          width={beamWidth}
          height={beamHeight}
        />
        <DirLight color={lightColor} position={[0, 3, 10]} />
      </group>
      <ambientLight intensity={1} />
      <color attach="background" args={["#000000"]} />
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={30} />
    </ShaderCanvas>
  );
};

function createStackedPlanesBufferGeometry(
  n: number,
  width: number,
  height: number,
  spacing: number,
  heightSegments: number,
  beamAnimations: number[] = [],
): BufferGeometry {
  const geometry = new BufferGeometry();
  const numVertices = n * (heightSegments + 1) * 2;
  const numFaces = n * heightSegments * 2;
  const positions = new Float32Array(numVertices * 3);
  const indices = new Uint32Array(numFaces * 3);
  const uvs = new Float32Array(numVertices * 2);

  let vertexOffset = 0;
  let indexOffset = 0;
  let uvOffset = 0;
  const totalWidth = n * width + (n - 1) * spacing;
  const xOffsetBase = -totalWidth / 2;

  for (let i = 0; i < n; i++) {
    const xOffset = xOffsetBase + i * (width + spacing);
    const uvXOffset = Math.random() * 300;
    const uvYOffset = Math.random() * 300;

    // Apply animation scale to each beam individually
    const beamScale = beamAnimations[i] !== undefined ? beamAnimations[i] : 1;

    for (let j = 0; j <= heightSegments; j++) {
      const y = height * (j / heightSegments - 0.5) * beamScale;
      const v0 = [xOffset, y, 0];
      const v1 = [xOffset + width, y, 0];
      positions.set([...v0, ...v1], vertexOffset * 3);

      const uvY = j / heightSegments;
      uvs.set([uvXOffset, uvY + uvYOffset, uvXOffset + 1, uvY + uvYOffset], uvOffset);

      if (j < heightSegments) {
        const a = vertexOffset,
          b = vertexOffset + 1,
          c = vertexOffset + 2,
          d = vertexOffset + 3;
        indices.set([a, b, c, c, b, d], indexOffset);
        indexOffset += 6;
      }
      vertexOffset += 2;
      uvOffset += 4;
    }
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

const MergedPlanes = forwardRef<
  Mesh<BufferGeometry, ShaderMaterial>,
  {
    material: ShaderMaterial;
    width: number;
    count: number;
    height: number;
  }
>(({ material, width, count, height }, ref) => {
  const mesh = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null!);
  useImperativeHandle(ref, () => mesh.current);

  // Use refs instead of state for animation values to avoid re-renders
  const animationRef = useRef<{
    startTime: number;
    beamScales: number[];
    isAnimating: boolean;
  }>({
    startTime: 0,
    beamScales: Array(count).fill(0),
    isAnimating: true,
  });

  // Create initial geometry
  const geometry = useMemo(() => {
    const geo = createStackedPlanesBufferGeometry(
      count,
      width,
      height,
      0,
      100,
      Array(count).fill(0),
    );
    return geo;
  }, [count, width, height]);

  // Handle animation in the frame loop for smoother performance
  useFrame((_, delta) => {
    // Update material time for wave animation
    mesh.current.material.uniforms.time.value += 0.1 * delta;

    // Handle beam scaling animation
    const anim = animationRef.current;
    if (!anim.isAnimating) return;

    const now = performance.now();
    if (anim.startTime === 0) {
      anim.startTime = now;
    }

    const animationDuration = 1500; // 1.5 seconds per beam
    const staggerDelay = 70; // 70ms between beams
    let allComplete = true;
    let needsUpdate = false;

    // Update position attribute directly for smoother animation
    const positions = geometry.getAttribute("position") as BufferAttribute;
    const posArray = positions.array as Float32Array;

    // Calculate each beam's scale
    for (let i = 0; i < count; i++) {
      const beamStartTime = anim.startTime + i * staggerDelay;
      const elapsed = now - beamStartTime;

      if (elapsed <= 0) {
        // Beam animation hasn't started yet
        allComplete = false;
        continue;
      } else if (elapsed >= animationDuration) {
        // Beam animation complete
        if (anim.beamScales[i] !== 1) {
          anim.beamScales[i] = 1;
          needsUpdate = true;
        }
      } else {
        // Beam animation in progress
        allComplete = false;
        const progress = elapsed / animationDuration;
        // Cubic ease-out for smoother motion
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        if (Math.abs(anim.beamScales[i] - easedProgress) > 0.005) {
          anim.beamScales[i] = easedProgress;
          needsUpdate = true;
        }
      }
    }

    // Update geometry if needed
    if (needsUpdate) {
      const heightSegments = 100;
      const verticesPerBeam = (heightSegments + 1) * 2;

      // Update each beam's vertices based on its scale
      for (let i = 0; i < count; i++) {
        const beamScale = anim.beamScales[i];
        const startIdx = i * verticesPerBeam * 3; // *3 because each vertex has x,y,z

        for (let j = 0; j <= heightSegments; j++) {
          const vertIdx = startIdx + j * 2 * 3; // 2 vertices per row, 3 components per vertex
          const y = height * (j / heightSegments - 0.5) * beamScale;

          // Update y position for both vertices in this row
          posArray[vertIdx + 1] = y; // First vertex y
          posArray[vertIdx + 4] = y; // Second vertex y
        }
      }

      // Mark position attribute as needing update
      positions.needsUpdate = true;
    }

    // Stop animation when all beams are complete
    if (allComplete) {
      anim.isAnimating = false;
    }
  });

  return <mesh ref={mesh} geometry={geometry} material={material} />;
});
MergedPlanes.displayName = "MergedPlanes";

const PlaneNoise = forwardRef<
  Mesh<BufferGeometry, ShaderMaterial>,
  {
    material: ShaderMaterial;
    width: number;
    count: number;
    height: number;
  }
>((props, ref) => {
  return (
    <MergedPlanes
      ref={ref}
      material={props.material}
      width={props.width}
      count={props.count}
      height={props.height}
    />
  );
});
PlaneNoise.displayName = "PlaneNoise";

const DirLight: FC<{ position: [number, number, number]; color: string }> = ({
  position,
  color,
}) => {
  const dir = useRef<DirectionalLight>(null!);
  useEffect(() => {
    if (!dir.current) return;
    const cam = dir.current.shadow.camera as Camera & {
      top: number;
      bottom: number;
      left: number;
      right: number;
      far: number;
    };
    cam.top = 24;
    cam.bottom = -24;
    cam.left = -24;
    cam.right = 24;
    cam.far = 64;
    dir.current.shadow.bias = -0.004;
  }, []);
  return <directionalLight ref={dir} color={color} intensity={1} position={position} />;
};

export { Beams };
