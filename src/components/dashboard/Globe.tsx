import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Text, Html } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Satellite } from "lucide-react";

function Orbits() {
  const circles = Array.from({ length: 6 }).map((_, i) => {
    const points: THREE.Vector3[] = [];
    const radius = 2.1 + i * 0.08;
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius * (0.6 + (i % 3) * 0.1); // slight ellipses
      points.push(new THREE.Vector3(x, y, 0));
    }
    return points;
  });

  return (
    <group rotation={[Math.PI / 3.5, 0, 0]}>
      {circles.map((pts, idx) => (
        <Line
          key={idx}
          points={pts}
          color="#4fd1c5"
          lineWidth={1}
          dashed={false}
          transparent
          opacity={0.6}
        />
      ))}
    </group>
  );
}

function Earth() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial color="#1a2540" metalness={0.2} roughness={0.9} />
    </mesh>
  );
}

interface SpaceObject {
  id: string;
  type: 'satellite' | 'debris';
  position: [number, number, number];
  risk: number;
  name: string;
}

function SpaceObjects() {
  const objects: SpaceObject[] = useMemo(() => [
    { id: '1', type: 'satellite', position: [2.8, 1.2, 0.5], risk: 0.9, name: 'SAT-2391' },
    { id: '2', type: 'debris', position: [2.9, 1.1, 0.6], risk: 0.9, name: 'DEB-9921' },
    { id: '3', type: 'satellite', position: [3.2, -0.8, 1.1], risk: 0.7, name: 'SAT-4521' },
    { id: '4', type: 'debris', position: [3.1, -0.9, 1.2], risk: 0.7, name: 'DEB-5563' },
    { id: '5', type: 'satellite', position: [-2.7, 0.5, -1.8], risk: 0.3, name: 'SAT-7821' },
    { id: '6', type: 'debris', position: [-2.8, 0.6, -1.9], risk: 0.3, name: 'DEB-2193' },
    { id: '7', type: 'satellite', position: [1.5, 2.2, -1.5], risk: 0.0, name: 'SAT-1042' },
    { id: '8', type: 'satellite', position: [-1.2, -2.1, 1.8], risk: 0.0, name: 'SAT-6677' },
    { id: '9', type: 'debris', position: [0.8, 2.8, 0.2], risk: 0.0, name: 'DEB-8891' },
    { id: '10', type: 'debris', position: [3.0, 0.1, -0.8], risk: 0.0, name: 'DEB-1002' },
  ], []);

  return (
    <group>
      {objects.map((obj) => {
        const isHighRisk = obj.risk >= 0.7;
        const isMediumRisk = obj.risk >= 0.3 && obj.risk < 0.7;
        const color = isHighRisk ? '#ef4444' : isMediumRisk ? '#f59e0b' : obj.type === 'satellite' ? '#3b82f6' : '#6b7280';
        const size = obj.type === 'satellite' ? 0.08 : 0.05;
        
        return (
          <group key={obj.id} position={obj.position}>
            <mesh>
              {obj.type === 'satellite' ? (
                <boxGeometry args={[size, size, size * 2]} />
              ) : (
                <sphereGeometry args={[size, 8, 8]} />
              )}
              <meshStandardMaterial color={color} emissive={isHighRisk ? '#ef4444' : '#000000'} emissiveIntensity={isHighRisk ? 0.3 : 0} />
            </mesh>
            {isHighRisk && (
              <pointLight color="#ef4444" intensity={0.5} distance={1} />
            )}
            <Html
              position={[0, size + 0.1, 0]}
              center
              style={{
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              <div className="text-xs bg-black/80 text-white px-2 py-1 rounded whitespace-nowrap">
                {obj.name}
                {isHighRisk && <span className="ml-1 text-red-400">⚠️</span>}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function CollisionPaths() {
  const paths = useMemo(() => [
    {
      start: [2.8, 1.2, 0.5] as [number, number, number],
      end: [2.9, 1.1, 0.6] as [number, number, number],
      risk: 0.9
    },
    {
      start: [3.2, -0.8, 1.1] as [number, number, number],
      end: [3.1, -0.9, 1.2] as [number, number, number],
      risk: 0.7
    },
    {
      start: [-2.7, 0.5, -1.8] as [number, number, number],
      end: [-2.8, 0.6, -1.9] as [number, number, number],
      risk: 0.3
    }
  ], []);

  return (
    <group>
      {paths.map((path, idx) => {
        const isHighRisk = path.risk >= 0.7;
        const isMediumRisk = path.risk >= 0.3 && path.risk < 0.7;
        const color = isHighRisk ? '#ef4444' : isMediumRisk ? '#f59e0b' : '#22c55e';
        const points = [new THREE.Vector3(...path.start), new THREE.Vector3(...path.end)];
        
        return (
          <Line
            key={idx}
            points={points}
            color={color}
            lineWidth={isHighRisk ? 4 : isMediumRisk ? 3 : 2}
            dashed={true}
            dashSize={0.1}
            gapSize={0.05}
            transparent
            opacity={isHighRisk ? 0.9 : 0.6}
          />
        );
      })}
    </group>
  );
}

export default function Globe() {
  return (
    <div className="w-full rounded-lg border bg-card p-2">
      <Canvas className="h-[360px] md:h-[420px]" camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Stars radius={80} depth={30} count={2000} factor={4} saturation={0} fade speed={1} />
        <Earth />
        <Orbits />
        <SpaceObjects />
        <CollisionPaths />
        <OrbitControls enablePan={false} enableZoom={true} minDistance={3.5} maxDistance={12} />
      </Canvas>
    </div>
  );
}
