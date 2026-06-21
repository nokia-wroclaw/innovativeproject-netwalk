import { useEffect, useState } from "react";
import Heatmap from "../components/Heatmap";
import KPICard from "../components/KPICard";
import Metric from "../components/Metric";
import PhoneList from "../components/PhoneList";
import RecentSessions from "../components/RecentSessions";
import "./Phones.css";

const API_URL = "/api";

const EMPTY_KPI = {
  rsrp: { min: 0, max: 0, avg: 0 },
  rsrq: { min: 0, max: 0, avg: 0 },
  sinr: { min: 0, max: 0, avg: 0 },
  dl_throughput_mbps: { min: 0, max: 0, avg: 0 },
  ul_throughput_mbps: { min: 0, max: 0, avg: 0 },
};

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(`${API_URL}${path}`);
    if (!response.ok) throw new Error(`API error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function formatValue(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(digits);
  return value;
}

export default function Phones() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [phoneLteKpi, setPhoneLteKpi] = useState(EMPTY_KPI);
  const [phoneFiveGKpi, setPhoneFiveGKpi] = useState(EMPTY_KPI);
  const [lastMeasurement, setLastMeasurement] = useState(null);

useEffect(() => {
  async function loadLastMeasurement() {
    if (!selectedDevice?.android_id) {
      setLastMeasurement(null);
      return;
    }

    let data;
    if (selectedSession?.session_id) {
      const measurements = await fetchJson(
        `/measurements/filtered?android_id=${selectedDevice.android_id}&session_id=${selectedSession.session_id}&limit=1`,
        null
      );
      data = measurements?.[0] || null;
    } else {
      data = await fetchJson(
        `/devices/${selectedDevice.android_id}/last-measurement`,
        null
      );
    }

    setLastMeasurement(data);
  }

  loadLastMeasurement();
}, [selectedDevice, selectedSession]);

useEffect(() => {
  async function loadDevices() {
    const data = await fetchJson("/devices", []);
    setDevices(data || []);
    setSelectedDevice(data?.[0] || null);
  }

  loadDevices();
}, []);

useEffect(() => {
  async function loadSessions() {
    if (!selectedDevice?.android_id) {
      setSessions([]);
      setSelectedSession(null);
      return;
    }

    const deviceSessions = await fetchJson(
      `/devices/${selectedDevice.android_id}/sessions?limit=100`,
      []
    );

    setSessions(deviceSessions || []);
    setSelectedSession(null);
  }

  loadSessions();
}, [selectedDevice]);

useEffect(() => {
  async function loadPhoneKpi() {
    if (!selectedDevice?.android_id) {
      setPhoneLteKpi(EMPTY_KPI);
      setPhoneFiveGKpi(EMPTY_KPI);
      return;
    }

    const baseParams = new URLSearchParams({
      android_id: selectedDevice.android_id,
    });

    if (selectedSession?.session_id) {
      baseParams.append("session_id", selectedSession.session_id);
    }

    const lteParams = new URLSearchParams(baseParams);
    lteParams.append("network_type", "LTE");

    const fiveGParams = new URLSearchParams(baseParams);
    fiveGParams.append("network_type", "5G");

    const lteKpi = await fetchJson(
      `/analysis/kpi?${lteParams.toString()}`,
      EMPTY_KPI
    );

    const fiveGKpi = await fetchJson(
      `/analysis/kpi?${fiveGParams.toString()}`,
      EMPTY_KPI
    );

    setPhoneLteKpi(lteKpi || EMPTY_KPI);
    setPhoneFiveGKpi(fiveGKpi || EMPTY_KPI);
  }

  loadPhoneKpi();
}, [selectedDevice, selectedSession]);

  return (
    <main className="page">
      <header className="topbar">
        <h1>Telefony</h1>
      </header>

      <div className="phones-layout">
        <PhoneList devices={devices} selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice} />

        <section className="card phone-detail">
          <div className="phone-title">
            <div>
              <h2>{selectedDevice ? selectedDevice.android_id : "Brak telefonu"}</h2>
              <p>
                Pomiary: {selectedDevice?.measurement_count || 0} | Sesje: {selectedDevice?.session_count || 0}
              </p>
            </div>
          </div>

          <RecentSessions sessions={sessions} selectedSession={selectedSession} setSelectedSession={setSelectedSession} />
          <div className="phone-title">
            <p> Sesja: {selectedSession?.session_id || "Ostatnia sesja"}</p>
          </div>  
          <div className="summary-row">
            <Metric label="Bateria (%)" value={lastMeasurement?.battery_level}/>
            <Metric label="Temperatura baterii (°C)" value={lastMeasurement?.battery_temp}/>
            <Metric label="CPU (%)" value={lastMeasurement?.host_cpu}/>
          </div>

          <div className="phone-main-grid">
            <section className="phone-map-panel">
              <Heatmap
                title="Mapa pomiarów"
                androidId={selectedDevice?.android_id}
                sessionId={selectedSession?.session_id}
              />
            </section>  
          </div>

          <div className="phone-kpi-row">
            <section className="phone-kpi-panel">
              <h2>KPI</h2>
              <KPICard title="LTE" color="#09c452" kpi={phoneLteKpi} />
              <KPICard title="5G" color="#8b5cf6" kpi={phoneFiveGKpi} />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
