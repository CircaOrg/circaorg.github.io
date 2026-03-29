/**
 * IrrigationFieldView
 *
 * Interactive top-down 3D field visualization for turret targeting.
 * Supports:
 *   - Single-plot click-to-target
 *   - Full-coverage sweep visualisation (animated waypoint trail)
 *   - Arc-path drawing: user drags across the field to create a custom spray path
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useFieldStore } from '../lib/socket';
import type { BaseStation } from '../lib/socket';
import {
  buildFieldGroundGeometry,
  DEFAULT_FIELD_POLYGON,
  polygonBoundingBox,
  polygonPointFromNormalized,
} from '../lib/fieldShape';
import type { FieldPolygon } from '../lib/fieldShape';
import type { SweepWaypoint } from '../lib/irrigationTargeting';
import type { ArcPoint } from '../lib/irrigationTargeting';
import './Field3DView.css';

// ─── Plot Grid ─────────────────────────────────────────────────────────────────

export interface PlotCell {
  id: string;
  gridX: number;
  gridZ: number;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  moisture: number;
}

function generatePlotGrid(vertices: FieldPolygon, cellSizeM = 5): PlotCell[] {
  const { minX, maxX, minZ, maxZ } = polygonBoundingBox(vertices);
  const cols = Math.ceil((maxX - minX) / cellSizeM);
  const rows = Math.ceil((maxZ - minZ) / cellSizeM);
  const plots: PlotCell[] = [];

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const x0 = minX + col * cellSizeM;
      const z0 = minZ + row * cellSizeM;
      plots.push({
        id: `plot-${col}-${row}`,
        gridX: col,
        gridZ: row,
        centerX: x0 + cellSizeM / 2,
        centerZ: z0 + cellSizeM / 2,
        width: cellSizeM,
        depth: cellSizeM,
        moisture: Math.random() * 100,
      });
    }
  }
  return plots;
}

// ─── PlotMesh ──────────────────────────────────────────────────────────────────

function PlotMesh({
  plot,
  isSelected,
  isHovered,
  isSweeping,
  onClick,
  onHover,
}: {
  plot: PlotCell;
  isSelected: boolean;
  isHovered: boolean;
  isSweeping: boolean;
  onClick: (plot: PlotCell) => void;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const baseColor   = plot.moisture < 30 ? '#e2a030' : plot.moisture < 60 ? '#7ec88a' : '#2db876';
  const sweepColor  = '#4fc3f7';
  const selectColor = '#ffeb3b';
  const hoverColor  = '#ffffff';

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    if (isSweeping) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.35, 0.12);
      mat.color.setStyle(sweepColor);
      mat.opacity = 0.9;
    } else if (isSelected) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.3, 0.1);
      mat.color.setStyle(selectColor);
      mat.opacity = 0.85;
    } else if (isHovered) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.18, 0.1);
      mat.color.setStyle(hoverColor);
      mat.opacity = 0.65;
    } else {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 0.08, 0.1);
      mat.color.setStyle(baseColor);
      mat.opacity = 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[plot.centerX, 0.04, plot.centerZ]}
      onClick={(e) => { e.stopPropagation(); onClick(plot); }}
      onPointerEnter={() => { onHover(plot.id); document.body.style.cursor = 'pointer'; }}
      onPointerLeave={() => { onHover(null);    document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[plot.width - 0.3, 0.2, plot.depth - 0.3]} />
      <meshStandardMaterial color={baseColor} metalness={0.1} roughness={0.7} transparent opacity={0.5} />
    </mesh>
  );
}

// ─── WaypointDot — shows where the turret is currently spraying ────────────────

function WaypointDot({ x, z, active }: { x: number; z: number; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    if (active) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 6) * 0.25);
      mat.opacity = 0.9;
    } else {
      meshRef.current.scale.setScalar(1);
      mat.opacity = 0.35;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, 0.15, z]}>
      <sphereGeometry args={[0.4, 8, 8]} />
      <meshBasicMaterial color={active ? '#ffffff' : '#4fc3f7'} transparent opacity={0.35} />
    </mesh>
  );
}

// ─── SweepPath — draws the snake path between waypoints ───────────────────────

function SweepPath({ waypoints, activeIndex }: { waypoints: SweepWaypoint[]; activeIndex: number }) {
  const lineRef = useRef<THREE.Line>(null);

  const geo = useMemo(() => {
    if (waypoints.length < 2) return null;
    const pts = new Float32Array(waypoints.length * 3);
    waypoints.forEach((wp, i) => {
      pts[i * 3]     = wp.x;
      pts[i * 3 + 1] = 0.18;
      pts[i * 3 + 2] = wp.z;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return g;
  }, [waypoints]);

  useEffect(() => () => { geo?.dispose(); }, [geo]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    (lineRef.current.material as THREE.LineBasicMaterial).opacity =
      0.3 + Math.sin(clock.elapsedTime * 2) * 0.1;
  });

  if (!geo) return null;

  return (
    // @ts-expect-error – R3F maps lowercase <line> to THREE.Line
    <line ref={lineRef} geometry={geo} renderOrder={998}>
      <lineBasicMaterial color="#4fc3f7" transparent opacity={0.35} linewidth={1} />
    </line>
  );
}

// ─── ArcPath — renders the user-drawn arc as an orange polyline ───────────────

function ArcPath({
  points,
  waypoints,
  activeIndex,
}: {
  points: ArcPoint[];
  waypoints: SweepWaypoint[];
  activeIndex: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  // Smooth raw polyline for the drawn arc
  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const pts = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      pts[i * 3]     = p.x;
      pts[i * 3 + 1] = 0.2;
      pts[i * 3 + 2] = p.z;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return g;
  }, [points]);

  useEffect(() => () => { geo?.dispose(); }, [geo]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    (lineRef.current.material as THREE.LineBasicMaterial).opacity =
      0.5 + Math.sin(clock.elapsedTime * 3) * 0.15;
  });

  if (!geo) return null;

  return (
    <>
      {/* @ts-expect-error – R3F maps lowercase <line> to THREE.Line */}
      <line ref={lineRef} geometry={geo} renderOrder={997}>
        <lineBasicMaterial color="#ff9800" transparent opacity={0.6} linewidth={2} />
      </line>
      {/* Waypoint dots along the sampled arc */}
      {waypoints.map((wp) => (
        <ArcWaypointDot
          key={wp.index}
          x={wp.x}
          z={wp.z}
          active={wp.index === activeIndex}
        />
      ))}
    </>
  );
}

function ArcWaypointDot({ x, z, active }: { x: number; z: number; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    if (active) {
      meshRef.current.scale.setScalar(1.2 + Math.sin(clock.elapsedTime * 6) * 0.3);
      mat.opacity = 1.0;
    } else {
      meshRef.current.scale.setScalar(1);
      mat.opacity = 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, 0.22, z]}>
      <sphereGeometry args={[0.35, 8, 8]} />
      <meshBasicMaterial color={active ? '#ffffff' : '#ff9800'} transparent opacity={0.5} />
    </mesh>
  );
}

// ─── ArcDrawingPlane — invisible surface to capture pointer drag events ───────

function ArcDrawingPlane({
  enabled,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
}: {
  enabled: boolean;
  onDrawStart: () => void;
  onDrawMove: (point: ArcPoint) => void;
  onDrawEnd: () => void;
}) {
  const planeRef = useRef<THREE.Mesh>(null);
  const drawing = useRef(false);

  // The plane is large enough to cover the whole field
  if (!enabled) return null;

  return (
    <mesh
      ref={planeRef}
      position={[0, 0.06, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        drawing.current = true;
        (e.target as any)?.setPointerCapture?.(e.pointerId);
        onDrawStart();
        // Record the initial point
        if (e.point) {
          onDrawMove({ x: e.point.x, z: e.point.z });
        }
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        e.stopPropagation();
        if (e.point) {
          onDrawMove({ x: e.point.x, z: e.point.z });
        }
      }}
      onPointerUp={(e) => {
        if (!drawing.current) return;
        e.stopPropagation();
        drawing.current = false;
        onDrawEnd();
      }}
      onPointerCancel={() => {
        drawing.current = false;
        onDrawEnd();
      }}
    >
      <planeGeometry args={[300, 300]} />
      <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── TurretMarker ──────────────────────────────────────────────────────────────

function TurretMarker({ worldX, worldZ, rangeM }: { worldX: number; worldZ: number; rangeM: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.05;
  });

  return (
    <group ref={groupRef} position={[worldX, 0, worldZ]}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.6, 0.5, 8]} />
        <meshStandardMaterial color="#c4972a" emissive="#7a5a10" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 1.0, 6]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[rangeM - 0.6, rangeM + 0.6, 64]} />
        <meshBasicMaterial color="#c4972a" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── TargetRay ─────────────────────────────────────────────────────────────────

function TargetRay({ fromX, fromZ, toX, toZ, visible }: {
  fromX: number; fromZ: number; toX: number; toZ: number; visible: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([fromX, 0.25, fromZ, toX, 0.25, toZ]), 3,
    ));
    return g;
  }, [fromX, fromZ, toX, toZ]);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (!lineRef.current || !visible) return;
    (lineRef.current.material as THREE.LineBasicMaterial).opacity =
      0.4 + Math.sin(clock.elapsedTime * 4) * 0.3;
  });

  if (!visible) return null;

  return (
    // @ts-expect-error – R3F maps lowercase <line> to THREE.Line
    <line ref={lineRef} geometry={geo} renderOrder={999}>
      <lineBasicMaterial color="#ffeb3b" transparent opacity={0.6} linewidth={2} />
    </line>
  );
}

// ─── Ground ────────────────────────────────────────────────────────────────────

function FieldGround({ vertices }: { vertices: FieldPolygon }) {
  const geo = useMemo(() => buildFieldGroundGeometry(vertices, 1), [vertices]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#e8e8e0" emissive="#e8e8e0" emissiveIntensity={0.08} />
    </mesh>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────────

function IrrigationScene({
  plots, selectedPlot, hoveredPlotId, stations, vertices,
  sweepWaypoints, sweepActiveIndex,
  arcDrawEnabled, arcRawPoints, arcWaypoints, arcActiveIndex,
  isDrawingArc, onArcDrawStart, onArcDrawMove, onArcDrawEnd,
  onPlotSelect, onPlotHover,
}: {
  plots: PlotCell[];
  selectedPlot: PlotCell | null;
  hoveredPlotId: string | null;
  stations: BaseStation[];
  vertices: FieldPolygon;
  sweepWaypoints: SweepWaypoint[];
  sweepActiveIndex: number;
  arcDrawEnabled: boolean;
  arcRawPoints: ArcPoint[];
  arcWaypoints: SweepWaypoint[];
  arcActiveIndex: number;
  isDrawingArc: boolean;
  onArcDrawStart: () => void;
  onArcDrawMove: (point: ArcPoint) => void;
  onArcDrawEnd: () => void;
  onPlotSelect: (plot: PlotCell) => void;
  onPlotHover: (id: string | null) => void;
}) {
  const { minX, maxX, minZ, maxZ } = useMemo(() => polygonBoundingBox(vertices), [vertices]);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  const isSweeping = sweepWaypoints.length > 0;
  const hasArc = arcRawPoints.length >= 2;

  return (
    <>
      <ambientLight intensity={1.1} color="#f5f5f0" />
      <directionalLight position={[cx, 12, cz]} intensity={0.7} color="#fffbf5" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <FieldGround vertices={vertices} />

      {plots.map((plot) => (
        <PlotMesh
          key={plot.id}
          plot={plot}
          isSelected={selectedPlot?.id === plot.id}
          isHovered={hoveredPlotId === plot.id}
          isSweeping={isSweeping && selectedPlot?.id === plot.id}
          onClick={onPlotSelect}
          onHover={onPlotHover}
        />
      ))}

      {/* Sweep overlay */}
      {isSweeping && (
        <>
          <SweepPath waypoints={sweepWaypoints} activeIndex={sweepActiveIndex} />
          {sweepWaypoints.map((wp) => (
            <WaypointDot
              key={wp.index}
              x={wp.x}
              z={wp.z}
              active={wp.index === sweepActiveIndex}
            />
          ))}
        </>
      )}

      {/* Arc path overlay */}
      {hasArc && (
        <ArcPath
          points={arcRawPoints}
          waypoints={arcWaypoints}
          activeIndex={arcActiveIndex}
        />
      )}

      {/* Arc drawing interaction plane */}
      <ArcDrawingPlane
        enabled={arcDrawEnabled}
        onDrawStart={onArcDrawStart}
        onDrawMove={onArcDrawMove}
        onDrawEnd={onArcDrawEnd}
      />

      {stations.map((station) => {
        const wp = polygonPointFromNormalized(station.field_x, station.field_y, vertices);
        return (
          <TurretMarker key={station.id} worldX={wp.x} worldZ={wp.z} rangeM={station.turret_range_m ?? 20} />
        );
      })}

      {/* Single-target ray (only when not sweeping and no arc active) */}
      {!isSweeping && !hasArc && selectedPlot && stations[0] && (() => {
        const wp = polygonPointFromNormalized(stations[0].field_x, stations[0].field_y, vertices);
        return (
          <TargetRay fromX={wp.x} fromZ={wp.z} toX={selectedPlot.centerX} toZ={selectedPlot.centerZ} visible />
        );
      })()}

      {/* Sweep active ray — turret→current waypoint */}
      {isSweeping && sweepWaypoints[sweepActiveIndex] && stations[0] && (() => {
        const wp  = polygonPointFromNormalized(stations[0].field_x, stations[0].field_y, vertices);
        const cwp = sweepWaypoints[sweepActiveIndex];
        return (
          <TargetRay fromX={wp.x} fromZ={wp.z} toX={cwp.x} toZ={cwp.z} visible />
        );
      })()}

      {/* Arc active ray — turret→current arc waypoint */}
      {hasArc && arcWaypoints[arcActiveIndex] && stations[0] && (() => {
        const wp  = polygonPointFromNormalized(stations[0].field_x, stations[0].field_y, vertices);
        const awp = arcWaypoints[arcActiveIndex];
        return (
          <TargetRay fromX={wp.x} fromZ={wp.z} toX={awp.x} toZ={awp.z} visible />
        );
      })()}

      <OrbitControls
        makeDefault
        enablePan={!isDrawingArc}
        enableZoom
        enableRotate={false}
        zoomSpeed={1.2}
      />
    </>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export function IrrigationFieldView({
  selectedPlot,
  onSelectPlot,
  onHoverPlot,
  sweepWaypoints = [],
  sweepActiveIndex = -1,
  arcDrawEnabled = false,
  arcRawPoints = [],
  arcWaypoints = [],
  arcActiveIndex = -1,
  onArcDrawn,
}: {
  selectedPlot: PlotCell | null;
  onSelectPlot: (plot: PlotCell) => void;
  onHoverPlot: (id: string | null) => void;
  sweepWaypoints?: SweepWaypoint[];
  sweepActiveIndex?: number;
  arcDrawEnabled?: boolean;
  arcRawPoints?: ArcPoint[];
  arcWaypoints?: SweepWaypoint[];
  arcActiveIndex?: number;
  onArcDrawn?: (points: ArcPoint[]) => void;
}) {
  const { stations } = useFieldStore();
  const vertices = DEFAULT_FIELD_POLYGON;
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);
  const [isDrawingArc, setIsDrawingArc] = useState(false);
  const drawingPoints = useRef<ArcPoint[]>([]);

  const plots = useMemo(() => generatePlotGrid(vertices, 5), [vertices]);

  const handleHover = (id: string | null) => {
    setHoveredPlotId(id);
    onHoverPlot(id);
  };

  // Arc drawing callbacks
  const handleArcDrawStart = useCallback(() => {
    drawingPoints.current = [];
    setIsDrawingArc(true);
  }, []);

  const handleArcDrawMove = useCallback((point: ArcPoint) => {
    const pts = drawingPoints.current;
    // Throttle: skip points that are too close to the last one
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      if (Math.hypot(point.x - last.x, point.z - last.z) < 0.3) return;
    }
    pts.push(point);
  }, []);

  const handleArcDrawEnd = useCallback(() => {
    setIsDrawingArc(false);
    if (drawingPoints.current.length >= 2 && onArcDrawn) {
      onArcDrawn([...drawingPoints.current]);
    }
  }, [onArcDrawn]);

  const { minX, maxX, minZ, maxZ } = useMemo(() => polygonBoundingBox(vertices), [vertices]);
  const cx   = (minX + maxX) / 2;
  const cz   = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxZ - minZ);

  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [cx, span * 0.8, cz + span * 0.5], fov: 45 }}
      shadows
    >
      <IrrigationScene
        plots={plots}
        selectedPlot={selectedPlot}
        hoveredPlotId={hoveredPlotId}
        stations={stations}
        vertices={vertices}
        sweepWaypoints={sweepWaypoints}
        sweepActiveIndex={sweepActiveIndex}
        arcDrawEnabled={arcDrawEnabled}
        arcRawPoints={arcRawPoints}
        arcWaypoints={arcWaypoints}
        arcActiveIndex={arcActiveIndex}
        isDrawingArc={isDrawingArc}
        onArcDrawStart={handleArcDrawStart}
        onArcDrawMove={handleArcDrawMove}
        onArcDrawEnd={handleArcDrawEnd}
        onPlotSelect={onSelectPlot}
        onPlotHover={handleHover}
      />
    </Canvas>
  );
}
