import { useEffect, useState } from "react";
import Heatmap from "../components/Heatmap";
import KPICard from "../components/KPICard";
import LastSession from "../components/LastSession";
import "./Dashboard.css";

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

export default function Dashboard() {
  const [lteKpi, setLteKpi] = useState(EMPTY_KPI);
  const [fiveGKpi, setFiveGKpi] = useState(EMPTY_KPI);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const [cpuFilter, setCpuFilter] = useState("all");
  const [cpuThreshold, setCpuThreshold] = useState(50);

  useEffect(() => {
    async function loadDashboard() {
      const lteParams = new URLSearchParams({
        network_type: "LTE",
        cpu_filter: cpuFilter,
        cpu_threshold: String(cpuThreshold),
      });

      const fiveGParams = new URLSearchParams({
        network_type: "5G",
        cpu_filter: cpuFilter,
        cpu_threshold: String(cpuThreshold),
      });

      const lte = await fetchJson(
        `/analysis/kpi?${lteParams.toString()}`,
        EMPTY_KPI
      );

      const fiveG = await fetchJson(
        `/analysis/kpi?${fiveGParams.toString()}`,
        EMPTY_KPI
      );

      const last = await fetchJson("/analysis/last-measurement", null);

      setLteKpi(lte || EMPTY_KPI);
      setFiveGKpi(fiveG || EMPTY_KPI);
      setLastMeasurement(last);
    }

    loadDashboard();
  }, [cpuFilter, cpuThreshold]);

  return (
    <main className="page">
      <header className="topbar">
        <h1>Dashboard</h1>
      </header>

      <div className="dashboard-grid">
        <section className="card dashboard-map-panel">
          <Heatmap
            cpuFilter={cpuFilter}
            cpuThreshold={cpuThreshold}
            setCpuFilter={setCpuFilter}
            setCpuThreshold={setCpuThreshold}
          />

          <LastSession lastMeasurement={lastMeasurement} />
        </section>

        <section className="card dashboard-kpi-panel">
          <h2>KPI</h2>
          <KPICard title="LTE" color="#09c452" kpi={lteKpi} />
          <KPICard title="5G" color="#8b5cf6" kpi={fiveGKpi} />
        </section>
      </div>
    </main>
  );
}