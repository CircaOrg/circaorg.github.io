import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { format } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './PredictionPage.css';
import { PREDICTOR_REAL_SNAPSHOT } from '../lib/predictorRealSnapshot';

type ClusterId = 'cluster_1' | 'cluster_2' | 'cluster_3';
type PredictionView = 'graph' | 'timeline';

interface ClusterMeta {
  id: ClusterId;
  label: string;
  zone: string;
  station: string;
  cropType: string;
}

interface PredictionPoint {
  timestamp: string;
  value: number | null;
  actualValue: number | null;
  rawMoisture: number | null;
  predicted: boolean;
  humidity: number | null;
  temperature: number | null;
  rainFlag: boolean | null;
  online: boolean;
  confidence: number | null;
}

interface ClusterNodeSeries {
  id: string;
  label: string;
  color: string;
  points: PredictionPoint[];
}

interface ClusterChartPoint {
  timestamp: string;
  predicted: boolean;
  [key: string]: string | number | boolean | null;
}

interface TimelinePoint {
  timestamp: string;
  predicted: boolean;
  avgValue: number | null;
}

interface NodeSnapshot {
  id: string;
  label: string;
  color: string;
  point: PredictionPoint;
  visible: boolean;
}

interface PredictorPredictionOut {
  cluster_id: ClusterId;
  crop: string;
  timestamp: string;
  predicted_vwc_tomorrow: number | null;
  current_vwc: number | null;
  time_to_critical_days: number | null;
  critical_threshold: number;
  confidence: number;
  irrigation_recommended: boolean;
  top_drivers: Record<string, number>;
  model_version: string;
  fallback_used: boolean;
}

interface PredictorAllPredictionsOut {
  predictions: PredictorPredictionOut[];
  fetched_at: string;
}

interface PredictorChartTrainRow {
  timestamp: string;
  actual_vwc: number | null;
}

interface PredictorChartTestRow {
  timestamp: string;
  predicted_vwc_tomorrow: number | null;
  actual_vwc_next_day: number | null;
  error: number | null;
  abs_error: number | null;
}

interface PredictorChartOut {
  cluster_id: ClusterId;
  model_version: string;
  split_ratio: number;
  split_index: number;
  split_timestamp: string | null;
  total_rows: number;
  fallback_used: boolean;
  train_history: PredictorChartTrainRow[];
  test_predictions: PredictorChartTestRow[];
}

const CLUSTERS: ClusterMeta[] = [
  {
    id: 'cluster_1',
    label: 'Cluster 1',
    zone: 'North Terrace',
    station: 'Base-01',
    cropType: 'Wheat',
  },
  {
    id: 'cluster_2',
    label: 'Cluster 2',
    zone: 'East Field',
    station: 'Base-02',
    cropType: 'Tomato',
  },
  {
    id: 'cluster_3',
    label: 'Cluster 3',
    zone: 'South Orchard',
    station: 'Base-03',
    cropType: 'Cotton',
  },
];

const POLL_INTERVAL_MS = 30_000;
const PREDICTOR_BASE_URL = (import.meta.env.VITE_PREDICTOR_URL || 'http://localhost:8000').replace(/\/+$/, '');
const USE_FAKE_PREDICTOR_DATA = (import.meta.env.VITE_USE_FAKE_PREDICTOR_DATA || 'false').toLowerCase() === 'true';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, places = 1) {
  const p = 10 ** places;
  return Math.round(value * p) / p;
}

function toMillis(timestamp: string) {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatTime(ts: string) {
  return format(new Date(ts), 'MMM d, HH:mm');
}

function average(values: Array<number | null | undefined>, places = 1): number | null {
  const numbers = values.filter((value): value is number => typeof value === 'number');
  if (!numbers.length) return null;
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return round(total / numbers.length, places);
}

function snapshotArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === 'object' && 'value' in value) {
    const wrappedValue = (value as { value?: unknown }).value;
    if (Array.isArray(wrappedValue)) {
      return wrappedValue as T[];
    }
  }

  return [];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let detail = '';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await response.json() as { detail?: unknown };
        if (typeof payload.detail === 'string') {
          detail = payload.detail;
        } else if (payload.detail !== undefined) {
          detail = JSON.stringify(payload.detail);
        }
      } else {
        detail = (await response.text()).trim();
      }
    } catch {
      // Keep base error when response parsing fails.
    }

    throw new Error(
      `Request failed (${response.status}) for ${url}${detail ? `: ${detail}` : ''}`,
    );
  }
  return (await response.json()) as T;
}

async function fetchPredictionForCluster(clusterId: ClusterId): Promise<PredictorPredictionOut> {
  try {
    const all = await fetchJson<PredictorAllPredictionsOut>(
      `${PREDICTOR_BASE_URL}/api/v1/predictions/all`,
    );
    const fromAll = all.predictions.find((row) => row.cluster_id === clusterId);
    if (fromAll) {
      return fromAll;
    }
  } catch {
    // Fallback to single-cluster endpoint for older/backward-incompatible backends.
  }

  return fetchJson<PredictorPredictionOut>(
    `${PREDICTOR_BASE_URL}/api/v1/predictions/${clusterId}`,
  );
}

async function fetchPredictionChartForCluster(clusterId: ClusterId): Promise<PredictorChartOut> {
  return fetchJson<PredictorChartOut>(
    `${PREDICTOR_BASE_URL}/api/v1/predictions/chart/${clusterId}`,
  );
}

/*
 * Legacy synthetic fake-data generation has been intentionally disabled.
 * Fake mode now replays manually exported real API payloads.
 */
function getSnapshotClusterBundle(clusterId: ClusterId): {
  prediction: PredictorPredictionOut;
  chartSplit: PredictorChartOut | null;
} {
  const predictionRows = snapshotArray<PredictorPredictionOut>(
    (PREDICTOR_REAL_SNAPSHOT.predictions_all as { predictions?: unknown } | undefined)?.predictions,
  );
  const prediction = predictionRows.find((row) => row.cluster_id === clusterId);

  if (!prediction) {
    throw new Error(`Snapshot is missing prediction for ${clusterId}.`);
  }

  const chartByCluster = (
    PREDICTOR_REAL_SNAPSHOT as unknown as { chart_by_cluster?: Partial<Record<ClusterId, unknown>> }
  ).chart_by_cluster;
  const chartSplit = chartByCluster?.[clusterId] as PredictorChartOut | undefined;

  return {
    prediction,
    chartSplit: chartSplit ?? null,
  };
}

async function fetchClusterBundle(clusterId: ClusterId): Promise<{
  prediction: PredictorPredictionOut;
  chartSplit: PredictorChartOut | null;
}> {
  if (USE_FAKE_PREDICTOR_DATA) {
    return getSnapshotClusterBundle(clusterId);
  }

  const [prediction, chartSplit] = await Promise.all([
    fetchPredictionForCluster(clusterId),
    fetchPredictionChartForCluster(clusterId).catch(() => null),
  ]);

  return {
    prediction,
    chartSplit,
  };
}

function buildSeriesFromChartSplit(
  chartSplit: PredictorChartOut,
  prediction: PredictorPredictionOut | null,
): ClusterNodeSeries[] {
  const confidencePct = prediction
    ? round(clamp(prediction.confidence * 100, 0, 100), 1)
    : null;

  const trainPoints: PredictionPoint[] = chartSplit.train_history.map((row) => ({
    timestamp: row.timestamp,
    value: typeof row.actual_vwc === 'number' ? row.actual_vwc : null,
    actualValue: null,
    rawMoisture: null,
    predicted: false,
    humidity: null,
    temperature: null,
    rainFlag: null,
    online: true,
    confidence: null,
  }));

  const testPoints: PredictionPoint[] = chartSplit.test_predictions.map((row) => ({
    timestamp: row.timestamp,
    value: typeof row.predicted_vwc_tomorrow === 'number' ? row.predicted_vwc_tomorrow : null,
    actualValue: typeof row.actual_vwc_next_day === 'number' ? row.actual_vwc_next_day : null,
    rawMoisture: null,
    predicted: true,
    humidity: null,
    temperature: null,
    rainFlag: null,
    online: false,
    confidence: confidencePct,
  }));

  const points = [...trainPoints, ...testPoints]
    .sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));

  if (!points.length) {
    return [];
  }

  return [
    {
      id: `${chartSplit.cluster_id}-split`,
      label: 'Model Split',
      color: '#1d6a94',
      points,
    },
  ];
}

function emptyPoint(timestamp: string): PredictionPoint {
  return {
    timestamp,
    value: null,
    actualValue: null,
    rawMoisture: null,
    predicted: false,
    humidity: null,
    temperature: null,
    rainFlag: null,
    online: false,
    confidence: null,
  };
}

export default function PredictionPage() {
  const [activeCluster, setActiveCluster] = useState<ClusterId>('cluster_1');
  const [view, setView] = useState<PredictionView>('graph');
  const [clusterNodes, setClusterNodes] = useState<ClusterNodeSeries[]>([]);
  const [activePrediction, setActivePrediction] = useState<PredictorPredictionOut | null>(null);
  const [activeChartSplit, setActiveChartSplit] = useState<PredictorChartOut | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visibleNodeIds, setVisibleNodeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshData = async (backgroundRefresh: boolean) => {
      if (!backgroundRefresh) setLoading(true);

      try {
        const { prediction, chartSplit } = await fetchClusterBundle(activeCluster);
        if (cancelled) return;

        const hasChartSplitData = Boolean(
          chartSplit
          && chartSplit.train_history.length
          && chartSplit.test_predictions.length,
        );

        if (!hasChartSplitData) {
          const sourceHint = USE_FAKE_PREDICTOR_DATA
            ? `Static snapshot is missing chart_by_cluster data for ${activeCluster}.`
            : `Chart endpoint did not return train/test rows for ${activeCluster}.`;

          throw new Error(`${sourceHint} This view requires /api/v1/predictions/chart/{cluster_id}.`);
        }

        const nextNodes = buildSeriesFromChartSplit(chartSplit as PredictorChartOut, prediction);

        setClusterNodes(nextNodes);
        setActivePrediction(prediction);
        setActiveChartSplit(chartSplit as PredictorChartOut);
        setLoadError(null);
        setLastLoadedAt(new Date().toISOString());

        setVisibleNodeIds((prev) => {
          const allIds = nextNodes.map((node) => node.id);
          if (!allIds.length) return [];

          const preserved = prev.filter((id) => allIds.includes(id));
          return preserved.length ? preserved : allIds;
        });

        setSelectedIndex((prev) => {
          const maxIndex = Math.max(0, (nextNodes[0]?.points.length ?? 1) - 1);
          return Math.min(prev, maxIndex);
        });
      } catch (error) {
        if (cancelled) return;

        const details = error instanceof Error ? error.message : 'Unknown network error.';
        setLoadError(`Unable to load predictor data. ${details}`);

        if (!backgroundRefresh) {
          setClusterNodes([]);
          setActivePrediction(null);
          setActiveChartSplit(null);
          setVisibleNodeIds([]);
          setSelectedIndex(0);
        }
      } finally {
        if (!cancelled && !backgroundRefresh) {
          setLoading(false);
        }
      }
    };

    void refreshData(false);
    const interval = window.setInterval(() => {
      void refreshData(true);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeCluster]);

  const activeMeta = CLUSTERS.find((cluster) => cluster.id === activeCluster) ?? CLUSTERS[0];
  const activeCropType = activePrediction?.crop ?? activeMeta.cropType;
  const usingTrainTestSplit = Boolean(activeChartSplit && clusterNodes.length);
  const visibleNodes = clusterNodes.filter((node) => visibleNodeIds.includes(node.id));
  const renderedNodes = visibleNodes.length ? visibleNodes : clusterNodes;

  const chartData: ClusterChartPoint[] = useMemo(() => {
    if (!clusterNodes.length) return [];

    const predictedStartByNode = new Map(
      clusterNodes.map((node) => [node.id, node.points.findIndex((point) => point.predicted)]),
    );

    return clusterNodes[0].points.map((basePoint, idx) => {
      const row: ClusterChartPoint = {
        timestamp: basePoint.timestamp,
        predicted: basePoint.predicted,
      };

      for (const node of clusterNodes) {
        const point = node.points[idx] ?? emptyPoint(basePoint.timestamp);
        const predictedStartIdx = predictedStartByNode.get(node.id) ?? -1;
        const predictedBridgeStart = predictedStartIdx >= 0
          ? (usingTrainTestSplit ? predictedStartIdx : Math.max(0, predictedStartIdx - 1))
          : -1;

        row[`${node.id}Observed`] = point.predicted ? null : point.value;
        row[`${node.id}Predicted`] = predictedBridgeStart >= 0 && idx >= predictedBridgeStart
          ? point.value
          : null;
        row[`${node.id}Actual`] = predictedStartIdx >= 0 && idx >= predictedStartIdx
          ? point.actualValue
          : null;
      }

      return row;
    });
  }, [clusterNodes, usingTrainTestSplit]);

  const timelineData: TimelinePoint[] = useMemo(() => {
    if (!renderedNodes.length) return [];

    return renderedNodes[0].points.map((point, idx) => {
      const avgValue = average(renderedNodes.map((node) => node.points[idx]?.value), 1);
      return {
        timestamp: point.timestamp,
        predicted: point.predicted,
        avgValue,
      };
    });
  }, [renderedNodes]);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, timelineData.length - 1));
  const selectedTimelinePoint = timelineData[safeSelectedIndex] ?? null;
  const previousTimelinePoint = timelineData[Math.max(0, safeSelectedIndex - 1)] ?? null;
  const averageDelta = (
    selectedTimelinePoint?.avgValue !== null &&
    selectedTimelinePoint?.avgValue !== undefined &&
    previousTimelinePoint?.avgValue !== null &&
    previousTimelinePoint?.avgValue !== undefined
  )
    ? round(selectedTimelinePoint.avgValue - previousTimelinePoint.avgValue, 1)
    : null;

  const baseStationMetrics = (() => {
    if (!renderedNodes.length) {
      return {
        temperature: null as number | null,
        humidity: null as number | null,
        raining: null as boolean | null,
        confidence: null as number | null,
      };
    }

    const selectedPoints = renderedNodes.map((node) => {
      const idx = Math.min(safeSelectedIndex, Math.max(0, node.points.length - 1));
      return node.points[idx] ?? emptyPoint(new Date().toISOString());
    });

    const temperature = average(selectedPoints.map((point) => point.temperature), 1);
    const humidity = average(selectedPoints.map((point) => point.humidity), 1);

    const rainFlags = selectedPoints
      .map((point) => point.rainFlag)
      .filter((value): value is boolean => typeof value === 'boolean');
    const raining = rainFlags.length ? rainFlags.some(Boolean) : null;

    const confidenceFromSeries = average(selectedPoints.map((point) => point.confidence), 1);
    const confidenceFromPrediction = activePrediction
      ? round(clamp(activePrediction.confidence * 100, 0, 100), 1)
      : null;

    return {
      temperature,
      humidity,
      raining,
      confidence: confidenceFromSeries ?? confidenceFromPrediction,
    };
  })();

  const nodeSnapshots: NodeSnapshot[] = clusterNodes.map((node) => {
    const idx = Math.min(safeSelectedIndex, Math.max(0, node.points.length - 1));
    const point = node.points[idx] ?? emptyPoint(selectedTimelinePoint?.timestamp ?? new Date().toISOString());

    return {
      id: node.id,
      label: node.label,
      color: node.color,
      point,
      visible: visibleNodeIds.includes(node.id),
    };
  });

  const observedCount = timelineData.filter((point) => !point.predicted).length;
  const forecastCount = timelineData.length - observedCount;
  const predictedStartIdx = timelineData.findIndex((point) => point.predicted);
  const predictedShadeStartIdx = predictedStartIdx >= 0
    ? (usingTrainTestSplit ? predictedStartIdx : Math.max(0, predictedStartIdx - 1))
    : -1;
  const predictedShadeStartTs = predictedShadeStartIdx >= 0 ? timelineData[predictedShadeStartIdx].timestamp : null;

  const recentSlice = timelineData.slice(-16);
  const recentOffset = timelineData.length - recentSlice.length;

  const handleChartCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || chartData.length === 0) return;

    const relativeX = clamp(event.clientX - bounds.left, 0, bounds.width);
    const ratio = relativeX / bounds.width;
    const computedIdx = Math.round(ratio * (chartData.length - 1));
    setSelectedIndex(computedIdx);
  };

  const toggleNodeVisibility = (nodeId: string) => {
    setVisibleNodeIds((prev) => {
      const isVisible = prev.includes(nodeId);
      if (isVisible && prev.length === 1) return prev;
      if (isVisible) return prev.filter((id) => id !== nodeId);
      return [...prev, nodeId];
    });
  };

  const hasSeriesData = chartData.length > 0;
  const dataSourceLabel = USE_FAKE_PREDICTOR_DATA ? 'Static Snapshot Mode' : PREDICTOR_BASE_URL;
  const chartModeLabel = usingTrainTestSplit ? 'Train/Test Split' : 'Sensor History + Forecast';

  return (
    <div className="prediction-page fade-in">
      <header className="prediction-topbar">
        <div>
          <span className="prediction-kicker mono">AI Forecast</span>
          <h1 className="prediction-title">Moisture Over Time</h1>
          <p className="prediction-subtitle">
            Live series from VWC-Predictor. Toggle nodes on or off to compare overlays across the selected cluster.
          </p>
          <p className={`prediction-data-status ${loadError ? 'error' : ''}`}>
            {loading
              ? 'Loading predictor data...'
              : loadError
                ? loadError
                : `Source: ${dataSourceLabel} | Mode: ${chartModeLabel}${lastLoadedAt ? ` | Updated ${formatTime(lastLoadedAt)}` : ''}`}
          </p>
        </div>

        <div className="prediction-cluster-field">
          <label className="prediction-select-label mono" htmlFor="prediction-cluster-select">
            Cluster
          </label>
          <div className="prediction-select-wrap">
            <select
              id="prediction-cluster-select"
              className="prediction-cluster-select"
              value={activeCluster}
              onChange={(event) => setActiveCluster(event.target.value as ClusterId)}
            >
              {CLUSTERS.map((cluster) => (
                <option key={cluster.id} value={cluster.id}>
                  {`${cluster.label} - ${cluster.zone}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="prediction-content">
        <section className="prediction-chart-panel" aria-label="Moisture trend chart">
          <div className="prediction-chart-head">
            <div className="prediction-chart-meta">
              <span className="prediction-chart-meta-item mono">{activeMeta.station}</span>
              <span className="prediction-chart-meta-item mono">{`${clusterNodes.length} Nodes`}</span>
              <span className="prediction-chart-meta-item mono">{activeCropType}</span>
            </div>

            <div className="prediction-chart-controls">
              {view === 'graph' && (
                <div className="prediction-legend" aria-hidden="true">
                  <span className="prediction-legend-item">
                    <span className="prediction-legend-line observed" />
                    {usingTrainTestSplit ? `Train History (${observedCount})` : `Observed (${observedCount})`}
                  </span>
                  <span className="prediction-legend-item">
                    <span className="prediction-legend-line predicted" />
                    {usingTrainTestSplit ? `Test Predicted (${forecastCount})` : `Predicted (${forecastCount})`}
                  </span>
                  {usingTrainTestSplit && (
                    <span className="prediction-legend-item">
                      <span className="prediction-legend-line actual" />
                      Test Actual ({forecastCount})
                    </span>
                  )}
                </div>
              )}

              <div className="prediction-view-toggle" role="tablist" aria-label="Prediction view">
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'graph'}
                  className={`prediction-view-btn ${view === 'graph' ? 'active' : ''}`}
                  onClick={() => setView('graph')}
                >
                  Graph
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'timeline'}
                  className={`prediction-view-btn ${view === 'timeline' ? 'active' : ''}`}
                  onClick={() => setView('timeline')}
                >
                  Recent Timeline
                </button>
              </div>
            </div>
          </div>

          <div className="prediction-chart-wrap">
            {!hasSeriesData ? (
              <div className="prediction-empty-state">
                {loading ? <div className="spinner" aria-hidden="true" /> : null}
                <p className="prediction-empty-state-title">No sensor series found for this cluster.</p>
                <p className="prediction-empty-state-body">
                  Ensure VWC-Predictor is running and has data for {activeMeta.label.toLowerCase()}.
                </p>
              </div>
            ) : view === 'graph' ? (
              <div className="prediction-chart-graph">
                <div className="prediction-chart-canvas" onClick={handleChartCanvasClick}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 18, left: -12, bottom: 3 }}>
                      <CartesianGrid stroke="var(--gray-100)" strokeDasharray="3 4" vertical={false} />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTime}
                        minTickGap={34}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                      />
                      <YAxis
                        tickFormatter={(value) => `${value}%`}
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                      />

                      {predictedShadeStartTs && (
                        <ReferenceArea
                          x1={predictedShadeStartTs}
                          x2={chartData[chartData.length - 1].timestamp}
                          fill="rgba(139, 105, 20, 0.08)"
                          ifOverflow="extendDomain"
                        />
                      )}

                      {selectedTimelinePoint && (
                        <ReferenceLine
                          x={selectedTimelinePoint.timestamp}
                          stroke="var(--gray-300)"
                          strokeDasharray="4 4"
                          ifOverflow="extendDomain"
                        />
                      )}

                      <Tooltip
                        contentStyle={{
                          borderRadius: 0,
                          border: '1px solid var(--gray-200)',
                          background: 'var(--white)',
                          fontSize: 12,
                        }}
                        labelStyle={{ color: 'var(--gray-500)', fontWeight: 600, marginBottom: 6 }}
                        formatter={(value, name) => {
                          const raw = Array.isArray(value) ? value[0] : value;
                          const numeric = typeof raw === 'number' ? raw : Number(raw ?? Number.NaN);
                          return [Number.isFinite(numeric) ? `${numeric.toFixed(1)}%` : '—', String(name)];
                        }}
                        labelFormatter={(label) => format(new Date(String(label)), 'EEE, MMM d - HH:mm')}
                      />

                      {renderedNodes.map((node) => (
                        <Line
                          key={`${node.id}-observed`}
                          type={usingTrainTestSplit ? 'linear' : 'monotone'}
                          dataKey={`${node.id}Observed`}
                          name={`${node.label} Observed`}
                          stroke={node.color}
                          strokeWidth={2.4}
                          dot={false}
                          activeDot={{ r: 4, fill: node.color, stroke: 'var(--white)', strokeWidth: 1 }}
                          connectNulls={false}
                        />
                      ))}

                      {renderedNodes.map((node) => (
                        <Line
                          key={`${node.id}-predicted`}
                          type={usingTrainTestSplit ? 'linear' : 'monotone'}
                          dataKey={`${node.id}Predicted`}
                          name={`${node.label} Predicted`}
                          stroke={node.color}
                          strokeWidth={2.4}
                          strokeDasharray="7 5"
                          dot={false}
                          activeDot={{ r: 4, fill: node.color, stroke: 'var(--white)', strokeWidth: 1 }}
                          connectNulls={false}
                        />
                      ))}

                      {usingTrainTestSplit && renderedNodes.map((node) => (
                        <Line
                          key={`${node.id}-actual`}
                          type="linear"
                          dataKey={`${node.id}Actual`}
                          name={`${node.label} Actual`}
                          stroke="#2d7a4f"
                          strokeWidth={2.2}
                          strokeDasharray="2 4"
                          dot={false}
                          activeDot={{ r: 4, fill: '#2d7a4f', stroke: 'var(--white)', strokeWidth: 1 }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="prediction-node-toggle-panel">
                  <div className="prediction-node-toggles" aria-label="Node line toggles">
                    {clusterNodes.map((node) => {
                      const isVisible = visibleNodeIds.includes(node.id);
                      return (
                        <button
                          key={node.id}
                          type="button"
                          className={`prediction-node-toggle ${isVisible ? 'active' : 'inactive'}`}
                          onClick={() => toggleNodeVisibility(node.id)}
                          aria-pressed={isVisible}
                        >
                          <span className="prediction-node-toggle-swatch" style={{ background: node.color }} />
                          <span className="prediction-node-toggle-label">{node.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="prediction-chart-timeline">
                <p className="prediction-chart-timeline-title mono">Recent Timeline (Visible Nodes Average)</p>
                <div className="prediction-timeline-list prediction-timeline-list--chart">
                  {recentSlice.map((point, localIdx) => {
                    const absoluteIdx = recentOffset + localIdx;
                    return (
                      <button
                        key={point.timestamp}
                        type="button"
                        className={`prediction-timeline-row ${absoluteIdx === safeSelectedIndex ? 'active' : ''}`}
                        onClick={() => setSelectedIndex(absoluteIdx)}
                      >
                        <span className="prediction-timeline-time mono">{formatTime(point.timestamp)}</span>
                        <span className={`prediction-timeline-kind ${point.predicted ? 'predicted' : 'observed'}`}>
                          {point.predicted ? (usingTrainTestSplit ? 'Test' : 'AI') : (usingTrainTestSplit ? 'Train' : 'Sensor')}
                        </span>
                        <span className="prediction-timeline-value mono">
                          {point.avgValue !== null ? `${point.avgValue.toFixed(1)}%` : '—'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="prediction-side-panel" aria-label="Timestamp details">
          <div className="prediction-side-head">
            <span className="prediction-side-kicker mono">Timestamp Details</span>
            <span className={`prediction-point-tag ${selectedTimelinePoint?.predicted ? 'predicted' : 'observed'}`}>
              {selectedTimelinePoint?.predicted ? 'Predicted' : 'Observed'}
            </span>
          </div>

          <div className="prediction-side-main">
            <p className="prediction-side-time">
              {selectedTimelinePoint
                ? format(new Date(selectedTimelinePoint.timestamp), 'EEE, MMM d - HH:mm')
                : 'No timestamp selected'}
            </p>
            <p className="prediction-side-vwc">
              {selectedTimelinePoint?.avgValue !== null && selectedTimelinePoint?.avgValue !== undefined
                ? `${selectedTimelinePoint.avgValue.toFixed(1)}%`
                : '—'}
            </p>
            <p className="prediction-side-vwc-label">Visible Nodes Average Moisture</p>
            <p className={`prediction-side-delta ${averageDelta === null ? 'neutral' : averageDelta >= 0 ? 'up' : 'down'}`}>
              {averageDelta === null
                ? 'No comparison available'
                : `${averageDelta >= 0 ? '+' : ''}${averageDelta.toFixed(1)}% vs previous point`}
            </p>
          </div>

          <div className="prediction-side-section">
            <p className="prediction-side-section-title mono">Base Station Signals</p>
            <div className="prediction-side-row">
              <span className="prediction-side-row-label mono">Temp</span>
              <span className="prediction-side-row-value">
                {baseStationMetrics.temperature !== null ? `${baseStationMetrics.temperature.toFixed(1)} C` : '—'}
              </span>
            </div>
            <div className="prediction-side-row">
              <span className="prediction-side-row-label mono">Humidity</span>
              <span className="prediction-side-row-value">
                {baseStationMetrics.humidity !== null ? `${baseStationMetrics.humidity.toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="prediction-side-row">
              <span className="prediction-side-row-label mono">Rain</span>
              <span className="prediction-side-row-value">
                {baseStationMetrics.raining === null ? '—' : baseStationMetrics.raining ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="prediction-side-row">
              <span className="prediction-side-row-label mono">Crop</span>
              <span className="prediction-side-row-value">{activeCropType}</span>
            </div>
            <div className="prediction-side-row">
              <span className="prediction-side-row-label mono">Confidence</span>
              <span className="prediction-side-row-value">
                {baseStationMetrics.confidence !== null ? `${baseStationMetrics.confidence.toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="prediction-side-row">
              <span className="prediction-side-row-label mono">Irrigation</span>
              <span className="prediction-side-row-value">
                {activePrediction
                  ? activePrediction.irrigation_recommended ? 'Recommended' : 'Not needed'
                  : '—'}
              </span>
            </div>
          </div>

          <div className="prediction-side-section prediction-side-section--cards">
            <p className="prediction-side-section-title mono">Node Moisture Sensors</p>
            <div className="prediction-node-cards">
              {nodeSnapshots.map((snapshot) => (
                <article
                  key={snapshot.id}
                  className={`prediction-node-card ${snapshot.visible ? '' : 'muted'}`}
                  aria-label={`${snapshot.label} details`}
                >
                  <div className="prediction-node-card-head">
                    <div className="prediction-node-card-title-wrap">
                      <span className="prediction-node-card-dot" style={{ background: snapshot.color }} />
                      <span className="prediction-node-card-title">{snapshot.label}</span>
                    </div>
                    <span className={`prediction-point-tag ${snapshot.point.predicted ? 'predicted' : 'observed'}`}>
                      {snapshot.point.predicted ? 'Pred' : 'Obs'}
                    </span>
                  </div>

                  <p className="prediction-node-card-percent">
                    {snapshot.point.value !== null ? `${snapshot.point.value.toFixed(1)}%` : '—'}
                  </p>
                  <p className="prediction-node-card-percent-subtext">Moisture percentage</p>

                  <div className="prediction-node-card-grid">
                    <span className="prediction-node-card-label mono">Moisture</span>
                    <span className="prediction-node-card-value">
                      {snapshot.point.rawMoisture !== null ? `${snapshot.point.rawMoisture} raw` : '—'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
