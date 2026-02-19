import { useMemo } from "react";
import * as THREE from "three";
import { Plane } from "@react-three/drei";

const M = (color: string, props?: { metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number; transparent?: boolean; opacity?: number; side?: THREE.Side }) => (
  <meshStandardMaterial color={color} metalness={props?.metalness ?? 0.05} roughness={props?.roughness ?? 0.7} emissive={props?.emissive} emissiveIntensity={props?.emissiveIntensity ?? 0} transparent={props?.transparent} opacity={props?.opacity} side={props?.side} />
);

function Wall({ position, size, color, rotation }: { position: [number, number, number]; size: [number, number, number]; color: string; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      {M(color)}
    </mesh>
  );
}

export function CafeEnvironment() {
  const tables = useMemo(() => [
    { pos: [-3, 0, -2] as [number, number, number] },
    { pos: [3, 0, -2] as [number, number, number] },
    { pos: [-3, 0, 3] as [number, number, number] },
    { pos: [3, 0, 3] as [number, number, number] },
  ], []);

  return (
    <group>
      <Plane args={[14, 14]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {M("#7B6B5A")}
      </Plane>

      <Wall position={[0, 2, -5]} size={[14, 4.5, 0.2]} color="#D7CCC8" />
      <Wall position={[-7, 2, 0]} size={[0.2, 4.5, 14]} color="#BCAAA4" />
      <Wall position={[7, 2, 0]} size={[0.2, 4.5, 14]} color="#BCAAA4" />

      <mesh position={[-6.5, 1.2, -4.5]}>
        <boxGeometry args={[0.06, 1.5, 0.06]} />
        {M("#5D4037")}
      </mesh>
      <mesh position={[-6.5, 2, -4.5]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        {M("#FFE082", { emissive: "#FFB300", emissiveIntensity: 0.8 })}
      </mesh>
      <pointLight position={[-6.5, 2, -4.5]} intensity={0.3} distance={5} color="#FFE0B2" />

      <mesh position={[5, 0.5, -4.5]}>
        <boxGeometry args={[3, 1.1, 0.8]} />
        {M("#5D4037")}
      </mesh>
      <mesh position={[5, 1.06, -4.5]}>
        <boxGeometry args={[3.1, 0.05, 0.85]} />
        {M("#795548")}
      </mesh>
      <mesh position={[5.8, 1.15, -4.5]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        {M("#4E342E")}
      </mesh>

      <mesh position={[0, 3.5, -4.8]}>
        <boxGeometry args={[2.5, 0.5, 0.04]} />
        {M("#3E2723")}
      </mesh>

      {tables.map((t, i) => (
        <group key={i} position={t.pos}>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.04, 16]} />
            {M("#6D4C41")}
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.36, 8]} />
            {M("#3E2723")}
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 12]} />
            {M("#3E2723")}
          </mesh>
          {[-0.3, 0.3].map((x, j) => (
            <group key={j} position={[x, 0, 0.5 * (j === 0 ? -1 : 1)]}>
              <mesh position={[0, 0.22, 0]}>
                <boxGeometry args={[0.3, 0.04, 0.25]} />
                {M("#A1887F")}
              </mesh>
              <mesh position={[0, 0.35, -0.1]}>
                <boxGeometry args={[0.3, 0.2, 0.03]} />
                {M("#A1887F")}
              </mesh>
            </group>
          ))}
        </group>
      ))}

      <mesh position={[6.5, 1.8, 0]}>
        <boxGeometry args={[0.03, 0.9, 0.7]} />
        {M("#8D6E63")}
      </mesh>

      <pointLight position={[0, 3.5, 0]} intensity={0.5} distance={10} color="#FFF3E0" />
      <pointLight position={[-3, 3, -2]} intensity={0.2} distance={6} color="#FFE0B2" />
      <pointLight position={[3, 3, 2]} intensity={0.2} distance={6} color="#FFE0B2" />
    </group>
  );
}

export function MarketEnvironment() {
  return (
    <group>
      <Plane args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {M("#C9B99A")}
      </Plane>

      {[-6, -2, 2, 6].map((x, i) => (
        <group key={i} position={[x, 0, -5]}>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[3.2, 0.06, 2]} />
            {M(["#FF8A65", "#FFB74D", "#81C784", "#64B5F6"][i] as string)}
          </mesh>
          {[[-1.4, 0], [1.4, 0], [-1.4, -0.9], [1.4, -0.9]].map(([px, pz], j) => (
            <mesh key={j} position={[px as number, 0.6, pz as number]}>
              <boxGeometry args={[0.08, 1.2, 0.08]} />
              {M("#795548")}
            </mesh>
          ))}
          <mesh position={[0, 2.2, -0.5]}>
            <boxGeometry args={[3.3, 0.04, 2.5]} />
            {M(["#E64A19", "#F57C00", "#388E3C", "#1976D2"][i] as string, { transparent: true, opacity: 0.6 })}
          </mesh>
        </group>
      ))}

      {[[-4, 3], [0, 3], [4, 3]].map(([x, z], i) => (
        <mesh key={`crate${i}`} position={[x as number, 0.2, z as number]}>
          <boxGeometry args={[0.6, 0.4, 0.5]} />
          {M("#8D6E63")}
        </mesh>
      ))}

      <mesh position={[0, 0, 6]}>
        <boxGeometry args={[3, 1.5, 0.5]} />
        {M("#A1887F")}
      </mesh>

      <pointLight position={[0, 4, 0]} intensity={0.4} distance={12} color="#FFE0B2" />
    </group>
  );
}

export function AirportEnvironment() {
  return (
    <group>
      <Plane args={[24, 16]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {M("#E0E0E0", { roughness: 0.3 })}
      </Plane>

      <Wall position={[0, 2.5, -7]} size={[24, 5, 0.2]} color="#ECEFF1" />
      <Wall position={[-12, 2.5, 0]} size={[0.2, 5, 16]} color="#CFD8DC" />
      <Wall position={[12, 2.5, 0]} size={[0.2, 5, 16]} color="#CFD8DC" />
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[24, 0.15, 16]} />
        {M("#F5F5F5")}
      </mesh>

      {[[-8, -6], [-4, -6], [0, -6], [4, -6]].map(([x, z], i) => (
        <mesh key={`window${i}`} position={[x as number, 3, z as number]}>
          <boxGeometry args={[2.5, 2, 0.05]} />
          {M("#B3E5FC", { transparent: true, opacity: 0.4, emissive: "#81D4FA", emissiveIntensity: 0.1 })}
        </mesh>
      ))}

      {[[-6, 3], [-2, 3], [2, 3], [6, 3]].map(([x, z], i) => (
        <group key={`seat${i}`} position={[x as number, 0, z as number]}>
          {[0, 0.5, 1].map((offset, j) => (
            <group key={j} position={[offset, 0, 0]}>
              <mesh position={[0, 0.22, 0]}>
                <boxGeometry args={[0.4, 0.04, 0.35]} />
                {M("#546E7A")}
              </mesh>
              <mesh position={[0, 0.38, -0.15]}>
                <boxGeometry args={[0.4, 0.28, 0.04]} />
                {M("#546E7A")}
              </mesh>
            </group>
          ))}
          <mesh position={[0.5, 0.1, 0]}>
            <boxGeometry args={[1.5, 0.04, 0.04]} />
            {M("#78909C", { metalness: 0.4 })}
          </mesh>
        </group>
      ))}

      {[-3, 3].map((x, i) => (
        <mesh key={`pillar${i}`} position={[x, 2.5, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 5, 8]} />
          {M("#CFD8DC", { metalness: 0.2 })}
        </mesh>
      ))}

      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[2, 0.08, 0.4]} />
        {M("#FFFFFF", { emissive: "#E3F2FD", emissiveIntensity: 0.3 })}
      </mesh>
      <pointLight position={[0, 4.5, 0]} intensity={0.6} distance={12} color="#F5F5F5" />
      <pointLight position={[-6, 4, 0]} intensity={0.3} distance={8} color="#F5F5F5" />
      <pointLight position={[6, 4, 0]} intensity={0.3} distance={8} color="#F5F5F5" />
    </group>
  );
}

export function HospitalEnvironment() {
  return (
    <group>
      <Plane args={[16, 16]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {M("#F5F5F5", { roughness: 0.2 })}
      </Plane>

      <Wall position={[0, 2, -7]} size={[16, 4.5, 0.2]} color="#FAFAFA" />
      <Wall position={[-8, 2, 0]} size={[0.2, 4.5, 16]} color="#F5F5F5" />
      <Wall position={[8, 2, 0]} size={[0.2, 4.5, 16]} color="#F5F5F5" />

      <mesh position={[0, 1.5, -6.85]}>
        <boxGeometry args={[0.8, 0.8, 0.02]} />
        {M("#E53935")}
      </mesh>
      <mesh position={[0, 1.5, -6.83]}>
        <boxGeometry args={[0.15, 0.6, 0.01]} />
        {M("#FFFFFF")}
      </mesh>
      <mesh position={[0, 1.5, -6.83]}>
        <boxGeometry args={[0.6, 0.15, 0.01]} />
        {M("#FFFFFF")}
      </mesh>

      {[-4, -1, 2, 5].map((x, i) => (
        <mesh key={`strip${i}`} position={[x, 4.2, 0]}>
          <boxGeometry args={[1.5, 0.05, 0.3]} />
          {M("#FFFFFF", { emissive: "#FFFFFF", emissiveIntensity: 0.5 })}
        </mesh>
      ))}
      <pointLight position={[0, 4, 0]} intensity={0.7} distance={14} color="#FAFAFA" />
      <pointLight position={[-4, 3.5, 0]} intensity={0.3} distance={6} color="#FAFAFA" />
      <pointLight position={[4, 3.5, 0]} intensity={0.3} distance={6} color="#FAFAFA" />

      <mesh position={[-7.5, 0.5, -2]}>
        <boxGeometry args={[0.6, 1, 0.3]} />
        {M("#B0BEC5", { metalness: 0.3 })}
      </mesh>

      {[[-3, 4], [0, 4], [3, 4]].map(([x, z], i) => (
        <group key={`curtain${i}`} position={[x as number, 0, z as number]}>
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[0.02, 0.5, 2]} />
            {M("#90CAF9", { transparent: true, opacity: 0.4 })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function OfficeEnvironment() {
  return (
    <group>
      <Plane args={[16, 16]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {M("#9E9E9E", { roughness: 0.4 })}
      </Plane>

      <Wall position={[0, 2, -7]} size={[16, 4.5, 0.2]} color="#ECEFF1" />
      <Wall position={[-8, 2, 0]} size={[0.2, 4.5, 16]} color="#E0E0E0" />
      <Wall position={[8, 2, 0]} size={[0.2, 4.5, 16]} color="#E0E0E0" />

      {[[-5, -3], [0, -3], [5, -3]].map(([x, z], i) => (
        <group key={`desk${i}`} position={[x as number, 0, z as number]}>
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[1.2, 0.04, 0.6]} />
            {M("#795548")}
          </mesh>
          {[[-0.55, -0.25], [-0.55, 0.25], [0.55, -0.25], [0.55, 0.25]].map(([lx, lz], j) => (
            <mesh key={j} position={[lx as number, 0.18, lz as number]}>
              <boxGeometry args={[0.04, 0.36, 0.04]} />
              {M("#5D4037")}
            </mesh>
          ))}
          <group position={[0, 0, 0.5]}>
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.4, 0.04, 0.35]} />
              {M("#37474F")}
            </mesh>
            <mesh position={[0, 0.42, -0.15]}>
              <boxGeometry args={[0.4, 0.3, 0.03]} />
              {M("#37474F")}
            </mesh>
          </group>
        </group>
      ))}

      {[-6, -2, 2, 6].map((x, i) => (
        <mesh key={`window${i}`} position={[x, 2.5, -6.85]}>
          <boxGeometry args={[1.8, 2, 0.04]} />
          {M("#B3E5FC", { transparent: true, opacity: 0.35, emissive: "#81D4FA", emissiveIntensity: 0.05 })}
        </mesh>
      ))}

      <mesh position={[7, 2.5, -4]}>
        <boxGeometry args={[0.04, 1.2, 0.8]} />
        {M("#FFFFFF")}
      </mesh>

      {[-3, 0, 3].map((x, i) => (
        <mesh key={`light${i}`} position={[x, 4.2, 0]}>
          <boxGeometry args={[1.2, 0.06, 0.3]} />
          {M("#FAFAFA", { emissive: "#FFFFFF", emissiveIntensity: 0.4 })}
        </mesh>
      ))}
      <pointLight position={[0, 4, 0]} intensity={0.6} distance={12} color="#FAFAFA" />
      <pointLight position={[-4, 3.5, -2]} intensity={0.25} distance={8} color="#F5F5F5" />
      <pointLight position={[4, 3.5, -2]} intensity={0.25} distance={8} color="#F5F5F5" />
    </group>
  );
}

const ENV_MAP: Record<string, React.FC> = {
  cafe: CafeEnvironment,
  market: MarketEnvironment,
  airport: AirportEnvironment,
  hospital: HospitalEnvironment,
  office: OfficeEnvironment,
};

export function getEnvironmentComponent(sceneType: string): React.FC | null {
  const key = sceneType.toLowerCase().replace(/\s+/g, "");
  if (key.includes("cafe") || key.includes("coffee")) return CafeEnvironment;
  if (key.includes("market") || key.includes("bazaar") || key.includes("shop")) return MarketEnvironment;
  if (key.includes("airport") || key.includes("flight")) return AirportEnvironment;
  if (key.includes("hospital") || key.includes("clinic") || key.includes("health")) return HospitalEnvironment;
  if (key.includes("office") || key.includes("work") || key.includes("business")) return OfficeEnvironment;
  return ENV_MAP[sceneType] || null;
}
