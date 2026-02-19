import { useRef, useMemo } from "react";
import * as THREE from "three";

const M = (color: string, props?: { metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number; transparent?: boolean; opacity?: number }) => (
  <meshStandardMaterial color={color} metalness={props?.metalness ?? 0.1} roughness={props?.roughness ?? 0.6} emissive={props?.emissive} emissiveIntensity={props?.emissiveIntensity ?? 0} transparent={props?.transparent} opacity={props?.opacity} />
);

export function CoffeeCup() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.5, 24]} />
        {M("#F5F5F0", { roughness: 0.3 })}
      </mesh>
      <mesh position={[0.28, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.1, 0.025, 8, 16, Math.PI]} />
        {M("#F5F5F0", { roughness: 0.3 })}
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
        {M("#3E2723")}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.04, 24]} />
        {M("#F5F5F0", { roughness: 0.3 })}
      </mesh>
    </group>
  );
}

export function ChocolateCake() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 24]} />
        {M("#5D4037")}
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.04, 24]} />
        {M("#3E2723")}
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.02, 24]} />
        {M("#FFCDD2")}
      </mesh>
      {[0, Math.PI * 0.66, Math.PI * 1.33].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.2, 0.38, Math.sin(a) * 0.2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          {M("#E53935")}
        </mesh>
      ))}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.03, 24]} />
        {M("#E0E0E0", { roughness: 0.2 })}
      </mesh>
    </group>
  );
}

export function MenuCard() {
  return (
    <group rotation={[0.3, 0, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.55, 0.03]} />
        {M("#F5E6CA")}
      </mesh>
      <mesh position={[0, 0.3, 0.018]}>
        <boxGeometry args={[0.34, 0.48, 0.005]} />
        {M("#FFFDE7")}
      </mesh>
      {[-0.1, 0, 0.1].map((y, i) => (
        <mesh key={i} position={[0, 0.3 + y, 0.022]}>
          <boxGeometry args={[0.25, 0.015, 0.002]} />
          {M("#795548")}
        </mesh>
      ))}
    </group>
  );
}

export function Waiter() {
  return (
    <group>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        {M("#FFCC80")}
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 0.6, 12]} />
        {M("#212121")}
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
        {M("#F44336")}
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.4, 12]} />
        {M("#212121")}
      </mesh>
      <mesh position={[0.35, 0.95, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 16]} />
        {M("#B0BEC5", { metalness: 0.6, roughness: 0.2 })}
      </mesh>
    </group>
  );
}

export function CafeTable() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
        {M("#795548")}
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.44, 8]} />
        {M("#4E342E")}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.03, 16]} />
        {M("#4E342E")}
      </mesh>
    </group>
  );
}

export function SugarBowl() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
        {M("#FFFFFF", { roughness: 0.2 })}
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
        {M("#FFFDE7")}
      </mesh>
      <mesh position={[0.05, 0.15, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.06, 0.01, 0.01]} />
        {M("#B0BEC5", { metalness: 0.5 })}
      </mesh>
    </group>
  );
}

export function FruitStand() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.5]} />
        {M("#8D6E63")}
      </mesh>
      {[[-0.3, 0], [0, 0], [0.3, 0]].map(([x, z], i) => (
        <mesh key={`leg${i}`} position={[x as number, 0, z as number]}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          {M("#6D4C41")}
        </mesh>
      ))}
      {[[-0.25, 0.3], [-0.1, 0.28], [0.05, 0.32], [0.2, 0.29]].map(([x, y], i) => (
        <mesh key={`apple${i}`} position={[x as number, y as number, -0.1]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          {M(i % 2 === 0 ? "#E53935" : "#C62828")}
        </mesh>
      ))}
      {[[-0.2, 0.3], [0.05, 0.28], [0.25, 0.31]].map(([x, y], i) => (
        <mesh key={`orange${i}`} position={[x as number, y as number, 0.1]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          {M("#FF9800")}
        </mesh>
      ))}
      <mesh position={[0.3, 0.28, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        {M("#FFEB3B")}
      </mesh>
    </group>
  );
}

export function VegetableCart() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.06, 0.45]} />
        {M("#6D4C41")}
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.68, 0.3, 0.43]} />
        {M("#8D6E63")}
      </mesh>
      {[[-0.35, -0.05], [0.35, -0.05]].map(([x, y], i) => (
        <mesh key={i} position={[x as number, y as number, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
          {M("#424242", { metalness: 0.4 })}
        </mesh>
      ))}
      {[[-0.15, 0.42], [0, 0.4], [0.15, 0.43]].map(([x, y], i) => (
        <mesh key={`tom${i}`} position={[x as number, y as number, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          {M("#D32F2F")}
        </mesh>
      ))}
      {[[-0.1, 0.45], [0.1, 0.44]].map(([x, y], i) => (
        <mesh key={`carrot${i}`} position={[x as number, y as number, 0.12]} rotation={[0.8, 0, 0]}>
          <coneGeometry args={[0.03, 0.18, 8]} />
          {M("#FF6D00")}
        </mesh>
      ))}
    </group>
  );
}

export function CoinsAndBills() {
  return (
    <group>
      {[0, 0.02, 0.04].map((y, i) => (
        <mesh key={`coin${i}`} position={[i * 0.08 - 0.08, y + 0.01, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.015, 16]} />
          {M("#FFD54F", { metalness: 0.7, roughness: 0.2 })}
        </mesh>
      ))}
      <mesh position={[0.15, 0.015, 0.05]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <boxGeometry args={[0.28, 0.13, 0.004]} />
        {M("#66BB6A")}
      </mesh>
      <mesh position={[0.12, 0.02, -0.03]} rotation={[-Math.PI / 2, 0, -0.05]}>
        <boxGeometry args={[0.28, 0.13, 0.004]} />
        {M("#42A5F5")}
      </mesh>
    </group>
  );
}

export function ShoppingBasket() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.25, 0.3]} />
        {M("#8D6E63")}
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.34, 0.22, 0.24]} />
        {M("#A1887F")}
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.18, 0.015, 8, 16, Math.PI]} />
        {M("#6D4C41")}
      </mesh>
    </group>
  );
}

export function MarketVendor() {
  return (
    <group>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        {M("#D7A86E")}
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.18, 0.16, 0.55, 12]} />
        {M("#1565C0")}
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.14, 0.12, 0.35, 12]} />
        {M("#37474F")}
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.35, 0.06, 0.06]} />
        {M("#F5F5F5")}
      </mesh>
    </group>
  );
}

export function WeighingScale() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.2]} />
        {M("#607D8B", { metalness: 0.5 })}
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.03, 0.4, 0.03]} />
        {M("#78909C", { metalness: 0.5 })}
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.35, 0.025, 0.03]} />
        {M("#78909C", { metalness: 0.5 })}
      </mesh>
      {[-0.15, 0.15].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.35, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.04, 12]} />
            {M("#B0BEC5", { metalness: 0.4 })}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function PriceTag() {
  return (
    <group rotation={[0.2, 0, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.28, 0.01]} />
        {M("#FFFDE7")}
      </mesh>
      <mesh position={[-0.04, 0.22, 0.008]}>
        <boxGeometry args={[0.1, 0.015, 0.002]} />
        {M("#212121")}
      </mesh>
      <mesh position={[0, 0.18, 0.008]}>
        <boxGeometry args={[0.14, 0.015, 0.002]} />
        {M("#212121")}
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <torusGeometry args={[0.015, 0.005, 6, 12]} />
        {M("#757575", { metalness: 0.5 })}
      </mesh>
    </group>
  );
}

export function Passport() {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.22, 0.01, 0.3]} />
        {M("#1565C0")}
      </mesh>
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[0.18, 0.005, 0.25]} />
        {M("#FFD54F", { metalness: 0.3 })}
      </mesh>
      <mesh position={[0, 0.09, -0.04]}>
        <cylinderGeometry args={[0.04, 0.04, 0.003, 16]} />
        {M("#FFD54F", { metalness: 0.3 })}
      </mesh>
    </group>
  );
}

export function BoardingPass() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.35, 0.15, 0.003]} />
        {M("#F5F5F5")}
      </mesh>
      <mesh position={[-0.06, 0.013, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.15, 0.01, 0.001]} />
        {M("#1565C0")}
      </mesh>
      <mesh position={[0.1, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.001]} />
        {M("#E0E0E0")}
      </mesh>
      <mesh position={[0.03, 0.013, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.06, 0.006, 0.001]} />
        {M("#424242")}
      </mesh>
    </group>
  );
}

export function Luggage() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.35, 0.5, 0.2]} />
        {M("#C62828")}
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <torusGeometry args={[0.08, 0.015, 6, 12, Math.PI]} />
        {M("#424242", { metalness: 0.5 })}
      </mesh>
      {[[-0.12, 0], [0.12, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x as number, -0.02, z as number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.015, 8]} />
          {M("#212121", { metalness: 0.4 })}
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0.11]}>
        <boxGeometry args={[0.2, 0.06, 0.01]} />
        {M("#FFEB3B")}
      </mesh>
    </group>
  );
}

export function DepartureGate() {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.04]} />
        {M("#37474F")}
      </mesh>
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.06, 1, 0.04]} />
          {M("#37474F")}
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.03]} />
        {M("#0D47A1")}
      </mesh>
      <mesh position={[0, 1.15, 0.018]}>
        <boxGeometry args={[0.12, 0.12, 0.002]} />
        {M("#FFFFFF", { emissive: "#FFFFFF", emissiveIntensity: 0.3 })}
      </mesh>
    </group>
  );
}

export function SecurityCheckpoint() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 1.6, 0.1]} />
        {M("#78909C")}
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.6, 1.4, 0.06]} />
        {M("#B0BEC5")}
      </mesh>
      <mesh position={[0.5, 0.3, 0.3]}>
        <boxGeometry args={[0.8, 0.35, 0.4]} />
        {M("#455A64")}
      </mesh>
    </group>
  );
}

export function FlightBoard() {
  return (
    <group>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1, 0.6, 0.05]} />
        {M("#212121")}
      </mesh>
      <mesh position={[0, 1.2, 0.03]}>
        <boxGeometry args={[0.9, 0.5, 0.01]} />
        {M("#0D47A1", { emissive: "#1565C0", emissiveIntensity: 0.4 })}
      </mesh>
      {[-0.15, -0.05, 0.05, 0.15].map((y, i) => (
        <mesh key={i} position={[-0.1, 1.2 + y, 0.035]}>
          <boxGeometry args={[0.6, 0.025, 0.001]} />
          {M("#4FC3F7", { emissive: "#4FC3F7", emissiveIntensity: 0.5 })}
        </mesh>
      ))}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.06, 1.2, 0.06]} />
        {M("#424242", { metalness: 0.4 })}
      </mesh>
    </group>
  );
}

export function Doctor() {
  return (
    <group>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        {M("#FFCC80")}
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.18, 0.16, 0.55, 12]} />
        {M("#FAFAFA")}
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.14, 0.12, 0.35, 12]} />
        {M("#FAFAFA")}
      </mesh>
      <mesh position={[0, 0.65, 0.15]}>
        <torusGeometry args={[0.08, 0.012, 8, 16]} />
        {M("#757575", { metalness: 0.5 })}
      </mesh>
      <mesh position={[0, 0.65, 0.22]}>
        <cylinderGeometry args={[0.03, 0.03, 0.01, 12]} />
        {M("#B0BEC5", { metalness: 0.6 })}
      </mesh>
    </group>
  );
}

export function MedicineCabinet() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.25]} />
        {M("#ECEFF1")}
      </mesh>
      <mesh position={[0, 0.6, 0.13]}>
        <boxGeometry args={[0.56, 0.75, 0.01]} />
        {M("#E3F2FD", { transparent: true, opacity: 0.5 })}
      </mesh>
      {[0.35, 0.55, 0.75].map((y, i) => (
        <group key={i}>
          {[-0.15, 0, 0.15].map((x, j) => (
            <mesh key={j} position={[x, y, 0.05]}>
              <boxGeometry args={[0.08, 0.12, 0.06]} />
              {M(["#EF5350", "#42A5F5", "#66BB6A"][j] as string)}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function AppointmentDesk() {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.45]} />
        {M("#ECEFF1")}
      </mesh>
      <mesh position={[0, 0.2, -0.18]}>
        <boxGeometry args={[0.88, 0.4, 0.06]} />
        {M("#CFD8DC")}
      </mesh>
      <mesh position={[-0.25, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.25, 0.01]} />
        {M("#E0E0E0")}
      </mesh>
      <mesh position={[0.2, 0.48, 0.05]}>
        <boxGeometry args={[0.2, 0.15, 0.12]} />
        {M("#37474F")}
      </mesh>
      <mesh position={[0.2, 0.56, 0.04]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.2, 0.13, 0.01]} />
        {M("#263238", { emissive: "#1565C0", emissiveIntensity: 0.2 })}
      </mesh>
    </group>
  );
}

export function Thermometer() {
  return (
    <group rotation={[0, 0, 0.4]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
        {M("#F5F5F5", { transparent: true, opacity: 0.7 })}
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.25, 8]} />
        {M("#E53935")}
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        {M("#E53935")}
      </mesh>
    </group>
  );
}

export function PrescriptionPad() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.25, 0.35, 0.02]} />
        {M("#FFFDE7")}
      </mesh>
      {[-0.08, -0.03, 0.02, 0.07].map((y, i) => (
        <mesh key={i} position={[-0.02, 0.03, y]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.15, 0.005, 0.001]} />
          {M("#1565C0")}
        </mesh>
      ))}
      <mesh position={[0, 0.03, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.002]} />
        {M("#1565C0")}
      </mesh>
    </group>
  );
}

export function Stethoscope() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[0.15, 0.012, 12, 24, Math.PI * 1.5]} />
        {M("#424242", { metalness: 0.3 })}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        {M("#B0BEC5", { metalness: 0.6, roughness: 0.2 })}
      </mesh>
      <mesh position={[0.15, 0.15, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        {M("#757575", { metalness: 0.5 })}
      </mesh>
      <mesh position={[-0.15, 0.15, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        {M("#757575", { metalness: 0.5 })}
      </mesh>
    </group>
  );
}

export function WaitingRoom() {
  return (
    <group>
      {[-0.5, 0, 0.5].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.35, 0.04, 0.3]} />
            {M("#42A5F5")}
          </mesh>
          <mesh position={[0, 0.35, -0.13]}>
            <boxGeometry args={[0.35, 0.25, 0.04]} />
            {M("#42A5F5")}
          </mesh>
          {[[-0.14, 0.1], [0.14, 0.1]].map(([lx, ly], j) => (
            <mesh key={j} position={[lx as number, ly as number, 0]}>
              <boxGeometry args={[0.04, 0.2, 0.04]} />
              {M("#757575", { metalness: 0.4 })}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function PresentationScreen() {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 0.7, 0.04]} />
        {M("#263238")}
      </mesh>
      <mesh position={[0, 1, 0.025]}>
        <boxGeometry args={[1.1, 0.6, 0.01]} />
        {M("#1565C0", { emissive: "#1976D2", emissiveIntensity: 0.3 })}
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.06, 0.65, 0.06]} />
        {M("#424242", { metalness: 0.4 })}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
        {M("#424242", { metalness: 0.4 })}
      </mesh>
    </group>
  );
}

export function CalendarDeadlines() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.35, 0.3, 0.02]} />
        {M("#FFFFFF")}
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.06, 0.025]} />
        {M("#E53935")}
      </mesh>
      {[-0.1, -0.03, 0.04].map((y, row) =>
        [-0.1, -0.03, 0.04, 0.11].map((x, col) => (
          <mesh key={`${row}-${col}`} position={[x, 0.12 + y * -1, 0.012]}>
            <boxGeometry args={[0.05, 0.04, 0.002]} />
            {M(row === 1 && col === 2 ? "#E53935" : "#E0E0E0")}
          </mesh>
        ))
      )}
    </group>
  );
}

export function BusinessProposal() {
  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.22, 0.32, 0.02]} />
        {M("#1565C0")}
      </mesh>
      <mesh position={[0, 0.18, 0.012]}>
        <boxGeometry args={[0.18, 0.25, 0.005]} />
        {M("#FFFFFF")}
      </mesh>
      {[-0.04, 0, 0.04].map((y, i) => (
        <mesh key={i} position={[0, 0.15 + y, 0.016]}>
          <boxGeometry args={[0.12, 0.008, 0.001]} />
          {M("#757575")}
        </mesh>
      ))}
      <mesh position={[0, 0.27, 0.016]}>
        <boxGeometry args={[0.1, 0.03, 0.001]} />
        {M("#1565C0")}
      </mesh>
    </group>
  );
}

export function MeetingRoom() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1, 0.05, 0.5]} />
        {M("#5D4037")}
      </mesh>
      {[[-0.4, -0.2], [-0.4, 0.2], [0.4, -0.2], [0.4, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x as number, 0.15, z as number]}>
          <boxGeometry args={[0.04, 0.3, 0.04]} />
          {M("#4E342E")}
        </mesh>
      ))}
      {[[-0.3, 0.35], [0, 0.35], [0.3, 0.35]].map(([x, z], i) => (
        <group key={`chair${i}`} position={[x as number, 0, z as number]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.2, 0.04, 0.18]} />
            {M("#424242")}
          </mesh>
          <mesh position={[0, 0.35, -0.08]}>
            <boxGeometry args={[0.2, 0.25, 0.03]} />
            {M("#424242")}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function ContractDocument() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.22, 0.3, 0.005]} />
        {M("#FFFDE7")}
      </mesh>
      {[-0.08, -0.04, 0, 0.04, 0.08].map((y, i) => (
        <mesh key={i} position={[-0.01, 0.013, y]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.15, 0.005, 0.001]} />
          {M("#424242")}
        </mesh>
      ))}
      <mesh position={[0.04, 0.015, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.08, 0.03, 0.001]} />
        {M("#1565C0")}
      </mesh>
      <mesh position={[0.15, 0.04, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.012, 0.005, 0.2, 6]} />
        {M("#212121")}
      </mesh>
    </group>
  );
}

export function Laptop() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.28]} />
        {M("#B0BEC5", { metalness: 0.5, roughness: 0.3 })}
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.35, 0.008, 0.2]} />
        {M("#424242")}
      </mesh>
      <mesh position={[0, 0.2, -0.13]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.28, 0.01]} />
        {M("#B0BEC5", { metalness: 0.5, roughness: 0.3 })}
      </mesh>
      <mesh position={[0, 0.2, -0.125]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.35, 0.22, 0.005]} />
        {M("#1A237E", { emissive: "#283593", emissiveIntensity: 0.4 })}
      </mesh>
    </group>
  );
}

export function Whiteboard() {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.03]} />
        {M("#ECEFF1")}
      </mesh>
      <mesh position={[0, 1, 0.018]}>
        <boxGeometry args={[1.1, 0.7, 0.005]} />
        {M("#FFFFFF")}
      </mesh>
      <mesh position={[0, 0.57, 0.03]}>
        <boxGeometry args={[0.6, 0.03, 0.04]} />
        {M("#B0BEC5", { metalness: 0.3 })}
      </mesh>
      <mesh position={[-0.25, 0.58, 0.05]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        {M("#E53935")}
      </mesh>
      <mesh position={[-0.2, 0.58, 0.05]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        {M("#1565C0")}
      </mesh>
    </group>
  );
}

const OBJECT_MAP: Record<string, React.FC> = {
  coffee: CoffeeCup,
  cake: ChocolateCake,
  menu: MenuCard,
  waiter: Waiter,
  table: CafeTable,
  sugar: SugarBowl,
  fruits: FruitStand,
  vegetables: VegetableCart,
  money: CoinsAndBills,
  basket: ShoppingBasket,
  vendor: MarketVendor,
  scale: WeighingScale,
  price_tag: PriceTag,
  passport: Passport,
  boarding_pass: BoardingPass,
  luggage: Luggage,
  gate: DepartureGate,
  security: SecurityCheckpoint,
  announcement: FlightBoard,
  doctor: Doctor,
  medicine: MedicineCabinet,
  appointment: AppointmentDesk,
  thermometer: Thermometer,
  prescription: PrescriptionPad,
  stethoscope: Stethoscope,
  waiting_room: WaitingRoom,
  presentation: PresentationScreen,
  deadline: CalendarDeadlines,
  proposal: BusinessProposal,
  meeting: MeetingRoom,
  contract: ContractDocument,
  laptop: Laptop,
  whiteboard: Whiteboard,
};

export function getObjectComponent(objectId: string): React.FC | null {
  return OBJECT_MAP[objectId] || null;
}
