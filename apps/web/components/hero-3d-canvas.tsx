import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Color, Group } from "three";

type Voxel = {
  position: [number, number, number];
  color: string;
};

const VOXEL_SIZE = 0.45;
const VOXEL_GAP = VOXEL_SIZE * 0.25;
const LETTER_SPACING = VOXEL_SIZE * 1.5;

const glyphs: Record<string, string[]> = {
  U: [
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    "XXXXX",
  ],
  M: [
    "X   X",
    "XX XX",
    "X X X",
    "X   X",
    "X   X",
  ],
  K: [
    "X   X",
    "X  X ",
    "XXX  ",
    "X  X ",
    "X   X",
  ],
};

function buildWordmark(): Voxel[] {
  const letters = ["U", "M", "K", "M"] as const;
  const voxels: Voxel[] = [];
  let cursorX = 0;

  for (const letter of letters) {
    const pattern = glyphs[letter];
    const rows = pattern.length;
    const cols = pattern[0].length;
    const baseColor = new Color("#b497ff");
    const accentColor = new Color("#40d8b0");

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (pattern[row][col] !== "X") continue;
        const blend = (row / Math.max(rows - 1, 1) + col / Math.max(cols - 1, 1)) / 2;
        const color = baseColor.clone().lerp(accentColor, blend).getStyle();
        const x = cursorX + col * (VOXEL_SIZE + VOXEL_GAP);
        const y = (rows - 1 - row) * (VOXEL_SIZE + VOXEL_GAP);
        voxels.push({ position: [x, y, 0], color });
      }
    }

    cursorX += cols * (VOXEL_SIZE + VOXEL_GAP) + LETTER_SPACING;
  }

  if (voxels.length === 0) {
    return voxels;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const voxel of voxels) {
    minX = Math.min(minX, voxel.position[0]);
    maxX = Math.max(maxX, voxel.position[0]);
    minY = Math.min(minY, voxel.position[1]);
    maxY = Math.max(maxY, voxel.position[1]);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return voxels.map((voxel) => ({
    position: [voxel.position[0] - centerX, voxel.position[1] - centerY, voxel.position[2]] as [number, number, number],
    color: voxel.color,
  }));
}

function Wordmark() {
  const voxels = useMemo(buildWordmark, []);
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.25;
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.1;
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {voxels.map((voxel, index) => (
        <mesh
          key={`${voxel.position.join("-")}-${index}`}
          castShadow
          receiveShadow
          position={voxel.position}
        >
          <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
          <meshStandardMaterial color={voxel.color} roughness={0.45} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function AccentOrbs() {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, 0.25, 0]}>
      <mesh position={[-2.8, 1.3, -0.8]} castShadow>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#ff8f66" roughness={0.2} metalness={0.35} />
      </mesh>
      <mesh position={[2.7, 1.8, 0.4]} castShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#69b7ff" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, -1.2, -1.4]} castShadow>
        <torusKnotGeometry args={[0.45, 0.12, 80, 16, 1, 3]} />
        <meshStandardMaterial color="#5dffb7" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#0e101a" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

export default function Hero3DCanvas() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.enablePan = false;
    controlsRef.current.enableZoom = false;
  }, []);

  return (
    <Canvas shadows camera={{ position: [5, 4.5, 8], fov: 45 }}>
      <color attach="background" args={["#04050a"]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        intensity={1.2}
        position={[3, 6, 5]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        intensity={0.4}
        angle={0.7}
        penumbra={0.4}
        position={[-6, 7, 4]}
        castShadow
      />
      <Suspense fallback={null}>
        <Environment preset="night" background={false} />
        <Wordmark />
        <AccentOrbs />
      </Suspense>
      <Floor />
      <OrbitControls
        ref={controlsRef}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
