// GridGuard Console Logic
const API_BASE = '/api/v1';
let currentSelectedAssetId = 'TX-MUM-1042';
let allAssetsData = [];

// Tab Navigation
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  const activeBtn = document.getElementById(`tab-nav-${tabId}`);
  const activeContent = document.getElementById(`tab-content-${tabId}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');

  if (tabId === 'alerts') {
    loadAlerts();
    loadAuditTrail();
  } else if (tabId === 'observability') {
    loadObservability();
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'critical' ? '🚨' : type === 'warning' ? '⚠️' : '⚡';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Initial Data Fetch
async function initDashboard() {
  await Promise.all([
    loadHealth(),
    loadAssets(),
    loadMetrics(),
    loadAlerts(),
  ]);

  // Pre-select benchmark asset TX-MUM-1042
  selectAsset('TX-MUM-1042');
}

// Fetch Service Health & Runtime Mode
async function loadHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      const modeVal = document.getElementById('runtime-mode-val');
      if (modeVal) {
        modeVal.textContent = data.model_provider_mode.toUpperCase();
      }
    }
  } catch (err) {
    console.error('Failed to fetch health:', err);
  }
}

// Fetch Metrics & Update Tickers
async function loadMetrics() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (res.ok) {
      const data = await res.json();
      document.getElementById('ticker-p95').textContent = `${data.ml.inference_latency_ms.p95} ms`;
      document.getElementById('ticker-fallback').textContent = `${(data.ml.fallback_rate * 100).toFixed(1)} %`;
    }
  } catch (err) {
    console.error('Failed to fetch metrics:', err);
  }
}

// Load and Render Asset Fleet
async function loadAssets() {
  try {
    const res = await fetch(`${API_BASE}/assets?limit=50`);
    if (!res.ok) return;
    allAssetsData = await res.json();
    renderAssetTable(allAssetsData);
    document.getElementById('ticker-assets-count').textContent = `${allAssetsData.length} Active`;
  } catch (err) {
    console.error('Failed to load assets:', err);
  }
}

function renderAssetTable(assets) {
  const tbody = document.getElementById('asset-table-body');
  tbody.innerHTML = '';

  assets.forEach(item => {
    const asset = item.asset;
    const tr = document.createElement('tr');
    tr.id = `row-${asset.asset_id}`;
    if (asset.asset_id === currentSelectedAssetId) tr.classList.add('selected');

    tr.onclick = () => selectAsset(asset.asset_id);

    tr.innerHTML = `
      <td><strong>${asset.asset_id}</strong></td>
      <td>${asset.feeder_id}</td>
      <td style="font-family: var(--font-mono); font-weight: 700;">${item.risk_score.toFixed(2)}</td>
      <td><span class="severity-pill ${item.severity}">${item.severity}</span></td>
      <td><span class="route-pill ${item.model_route}">${item.model_route}</span></td>
      <td style="font-family: var(--font-mono);">${(item.sensor_health * 100).toFixed(0)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function applyAssetFilters() {
  const feeder = document.getElementById('filter-feeder').value;
  const severity = document.getElementById('filter-severity').value;

  const filtered = allAssetsData.filter(item => {
    const matchFeeder = !feeder || item.asset.feeder_id === feeder;
    const matchSeverity = !severity || item.severity === severity;
    return matchFeeder && matchSeverity;
  });

  renderAssetTable(filtered);
}

// Select Single Asset and Populate Inspection Panel
async function selectAsset(assetId) {
  currentSelectedAssetId = assetId;

  // Highlight table row
  document.querySelectorAll('#asset-table-body tr').forEach(r => r.classList.remove('selected'));
  const row = document.getElementById(`row-${assetId}`);
  if (row) row.classList.add('selected');

  try {
    const res = await fetch(`${API_BASE}/assets/${assetId}`);
    if (!res.ok) return;
    const data = await res.json();
    populateDetailPanel(data);
  } catch (err) {
    console.error('Failed to fetch asset detail:', err);
  }
}

function populateDetailPanel(data) {
  const asset = data.asset;
  const pred = data.latest_prediction;
  const tel = data.latest_telemetry?.observations;

  document.getElementById('detail-asset-id').textContent = asset.asset_id;
  document.getElementById('detail-asset-feeder').textContent = 
    `Substation ${asset.location.substation} • Feeder ${asset.feeder_id} • Rated ${asset.rated_capacity_kva} kVA`;

  const riskScore = pred ? pred.risk_score : 0.0;
  const severity = pred ? pred.severity : 'normal';

  const scoreEl = document.getElementById('detail-risk-score');
  scoreEl.textContent = riskScore.toFixed(2);
  scoreEl.className = `risk-score-display ${severity}`;

  const pillEl = document.getElementById('detail-severity-pill');
  pillEl.textContent = severity.toUpperCase();
  pillEl.className = `severity-pill ${severity}`;

  // Metrics
  if (pred) {
    document.getElementById('detail-window').textContent = 
      `${pred.failure_window_hours.low} - ${pred.failure_window_hours.high} hrs`;
    document.getElementById('detail-confidence').textContent = `${(pred.confidence * 100).toFixed(0)}%`;
  }
  document.getElementById('detail-customers').textContent = asset.connected_customers.toLocaleString();

  if (tel) {
    document.getElementById('detail-winding-temp').textContent = `${tel.winding_temperature_c.toFixed(1)} °C`;
    document.getElementById('detail-load-factor').textContent = `${tel.load_factor.toFixed(2)}x rated`;
  }
  document.getElementById('detail-maint-overdue').textContent = `${asset.maintenance_overdue_days} days`;

  // TreeSHAP Factors
  const factorsList = document.getElementById('detail-factors-list');
  factorsList.innerHTML = '';
  const factors = pred?.contributing_factors || [];

  if (factors.length === 0) {
    factorsList.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-dim);">No significant risk drivers identified.</div>';
  } else {
    factors.forEach(f => {
      const pct = Math.round(f.impact * 100);
      const div = document.createElement('div');
      div.className = 'factor-item';
      div.innerHTML = `
        <div class="factor-meta">
          <span>${f.feature.replace(/_/g, ' ')} (${f.direction.toUpperCase()})</span>
          <span style="font-family: var(--font-mono); font-weight: 700;">+${pct}% impact</span>
        </div>
        <div class="factor-bar-bg">
          <div class="factor-bar-fill" style="width: ${Math.min(100, pct)}%;"></div>
        </div>
      `;
      factorsList.appendChild(div);
    });
  }

  // Operator Action Box
  const actionBox = document.getElementById('detail-action-box');
  const actionText = document.getElementById('detail-action-text');
  if (pred) {
    actionText.textContent = pred.recommended_action;
    actionBox.className = `action-box ${pred.route === 'safety-fallback' ? 'fallback' : severity}`;
  }
}

// Rescore Selected Asset via API
async function rescoreSelectedAsset() {
  if (!currentSelectedAssetId) return;
  try {
    const res = await fetch(`${API_BASE}/assets/${currentSelectedAssetId}/risk`, { method: 'POST' });
    if (res.ok) {
      const pred = await res.json();
      showToast(`Scored ${currentSelectedAssetId}: Risk ${pred.risk_score.toFixed(2)} (${pred.route})`, 'info');
      await selectAsset(currentSelectedAssetId);
      await loadAssets();
      await loadMetrics();
    }
  } catch (err) {
    showToast(`Failed to score asset: ${err}`, 'critical');
  }
}

// Inject Sensor Degradation to Trigger Safety Fallback Live
async function simulateSensorFault() {
  if (!currentSelectedAssetId) return;
  try {
    const payload = {
      observations: {
        load_factor: 0.95,
        winding_temperature_c: 106.0,
        ambient_temperature_c: 35.0,
        voltage_variance: 0.08,
        current_variance: 0.12,
        power_factor: 0.82
      },
      sensor_health: 0.35 // Causes fallback gate trip (< 0.75)
    };
    const res = await fetch(`${API_BASE}/assets/${currentSelectedAssetId}/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const pred = await res.json();
      showToast(`SAFETY FALLBACK ACTIVATED on ${currentSelectedAssetId} (Route: ${pred.route})`, 'warning');
      await selectAsset(currentSelectedAssetId);
      await loadAssets();
      await loadMetrics();
    }
  } catch (err) {
    showToast(`Fault injection failed: ${err}`, 'critical');
  }
}

// Run Anomaly Detection on Selected Asset
async function detectAnomalySelectedAsset() {
  if (!currentSelectedAssetId) return;
  try {
    const res = await fetch(`${API_BASE}/anomalies/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: currentSelectedAssetId })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.is_anomaly) {
        showToast(`ANOMALY DETECTED: ${result.anomaly_type} (Score: ${result.anomaly_score.toFixed(2)})`, 'warning');
      } else {
        showToast(`Telemetry Normal: No anomalies detected on ${currentSelectedAssetId}`, 'info');
      }
    }
  } catch (err) {
    showToast(`Anomaly detection error: ${err}`, 'critical');
  }
}

// Counterfactual Simulation
async function runSimulation() {
  const sourceAsset = document.getElementById('sim-source-asset').value;
  const targetFeeder = document.getElementById('sim-target-feeder').value;
  const percent = parseFloat(document.getElementById('sim-percent').value);
  const duration = parseFloat(document.getElementById('sim-duration').value);

  try {
    const res = await fetch(`${API_BASE}/simulations/load-redistribution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_asset_id: sourceAsset,
        target_feeder_id: targetFeeder,
        redistribution_percent: percent,
        duration_hours: duration
      })
    });

    if (res.ok) {
      const sim = await res.json();
      const r = sim.result;

      document.getElementById('sim-risk-before').textContent = r.source_failure_risk_before.toFixed(2);
      document.getElementById('sim-risk-after').textContent = r.source_failure_risk_after.toFixed(2);
      document.getElementById('sim-target-risk').textContent = r.target_overload_risk.toFixed(2);
      document.getElementById('sim-customers-protected').textContent = r.customers_protected_estimate.toLocaleString();
      document.getElementById('sim-energy-loss').textContent = `${r.estimated_energy_loss_kwh} kWh`;

      const badge = document.getElementById('sim-status-badge');
      badge.textContent = r.status.replace(/_/g, ' ').toUpperCase();
      badge.className = `severity-pill ${r.status === 'advisable_with_review' ? 'normal' : 'critical'}`;

      const clist = document.getElementById('sim-constraints-list');
      clist.innerHTML = '';
      r.constraints.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        clist.appendChild(li);
      });

      showToast(`Simulation complete: Risk relieved to ${r.source_failure_risk_after.toFixed(2)}`, 'info');
    }
  } catch (err) {
    showToast(`Simulation failed: ${err}`, 'critical');
  }
}

// Alerts & Audit
async function loadAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) return;
    const alerts = await res.json();
    const unack = alerts.filter(a => !a.acknowledged);
    document.getElementById('unack-alert-count').textContent = unack.length;

    const tbody = document.getElementById('alerts-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      alerts.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${a.alert_id}</code></td>
          <td>${a.asset_id || '--'}</td>
          <td>${a.alert_type}</td>
          <td><span class="severity-pill ${a.severity}">${a.severity}</span></td>
          <td>${a.description}</td>
          <td>${new Date(a.created_at).toLocaleTimeString()}</td>
          <td>
            ${a.acknowledged 
              ? `<span style="color: var(--color-normal); font-size: 0.75rem;">✓ Acked</span>` 
              : `<button class="btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="acknowledgeAlert('${a.alert_id}')">Acknowledge</button>`}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Failed to load alerts:', err);
  }
}

async function acknowledgeAlert(alertId) {
  try {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, { method: 'POST' });
    if (res.ok) {
      showToast(`Alert ${alertId} acknowledged`, 'info');
      await loadAlerts();
      await loadAuditTrail();
    }
  } catch (err) {
    showToast(`Failed to ack alert: ${err}`, 'critical');
  }
}

async function loadAuditTrail() {
  try {
    const res = await fetch(`${API_BASE}/audit?limit=25`, {
      headers: { 'X-User-Role': 'auditor' }
    });
    if (!res.ok) return;
    const events = await res.json();
    const tbody = document.getElementById('audit-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      events.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${e.audit_id}</code></td>
          <td>${e.event_type}</td>
          <td>${e.user_id} (${e.user_role})</td>
          <td>${e.asset_id || '--'}</td>
          <td><code>${e.input_hash ? e.input_hash.substring(0, 10) + '...' : '--'}</code></td>
          <td>${e.route || e.payload_summary?.status || '--'}</td>
          <td>${new Date(e.timestamp).toLocaleTimeString()}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Failed to load audit trail:', err);
  }
}

// Observability View
async function loadObservability() {
  try {
    const [mRes, modRes] = await Promise.all([
      fetch(`${API_BASE}/metrics`),
      fetch(`${API_BASE}/model`)
    ]);

    if (mRes.ok) {
      const data = await mRes.json();
      document.getElementById('obs-pred-count').textContent = data.ml.prediction_count;
      document.getElementById('obs-drift').textContent = data.ml.feature_drift_index;

      const rList = document.getElementById('obs-routes-list');
      rList.innerHTML = '';
      Object.entries(data.ml.route_distribution).forEach(([route, count]) => {
        const div = document.createElement('div');
        div.className = 'factor-item';
        const total = Math.max(1, data.ml.prediction_count);
        const pct = Math.round((count / total) * 100);
        div.innerHTML = `
          <div class="factor-meta">
            <span><code>${route}</code></span>
            <span>${count} calls (${pct}%)</span>
          </div>
          <div class="factor-bar-bg">
            <div class="factor-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        rList.appendChild(div);
      });
    }

    if (modRes.ok) {
      const mod = await modRes.json();
      document.getElementById('model-manifest-viewer').textContent = JSON.stringify(mod, null, 2);
    }
  } catch (err) {
    console.error('Failed to load observability data:', err);
  }
}

// Start on DOM ready
document.addEventListener('DOMContentLoaded', initDashboard);
