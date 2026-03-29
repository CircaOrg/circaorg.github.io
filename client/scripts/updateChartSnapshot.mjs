#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.PREDICTOR_BASE_URL || 'http://127.0.0.1:8010').replace(/\/+$/, '');
const clusters = ['cluster_1', 'cluster_2', 'cluster_3'];
const snapshotPath = path.resolve('src/lib/predictorRealSnapshot.ts');

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed (${response.status}) for ${url}${detail ? `: ${detail}` : ''}`);
  }
  return response.json();
}

function replaceChartByCluster(source, chartByCluster) {
  const marker = '"chart_by_cluster":';
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('chart_by_cluster key not found in predictorRealSnapshot.ts');
  }

  const objectStart = source.indexOf('{', markerIndex);
  if (objectStart < 0) {
    throw new Error('chart_by_cluster object start not found');
  }

  let depth = 0;
  let objectEnd = -1;
  for (let idx = objectStart; idx < source.length; idx += 1) {
    const ch = source[idx];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        objectEnd = idx;
        break;
      }
    }
  }

  if (objectEnd < 0) {
    throw new Error('chart_by_cluster object end not found');
  }

  const replacement = `"chart_by_cluster":  ${JSON.stringify(chartByCluster, null, 4)}`;
  return source.slice(0, markerIndex) + replacement + source.slice(objectEnd + 1);
}

async function main() {
  const chartByCluster = {};
  for (const clusterId of clusters) {
    const url = `${baseUrl}/api/v1/predictions/chart/${clusterId}`;
    chartByCluster[clusterId] = await fetchJson(url);
  }

  const source = await fs.readFile(snapshotPath, 'utf8');
  const updated = replaceChartByCluster(source, chartByCluster);
  await fs.writeFile(snapshotPath, updated, 'utf8');

  console.log(`Updated chart_by_cluster in ${snapshotPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
