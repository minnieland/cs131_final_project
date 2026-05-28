import { useState, useEffect, useRef } from "react";

// Data Source
import { useAPIData as useData } from "./hooks/useAPIData";

// Hooks
// import { useAlertLogic } from "./hooks/useAlertLogic";
import { useAudioAlerts } from "./hooks/useAudioAlerts";

// Components
import { MetricCard } from "./components/MetricCard";
import { ChartCard } from "./components/ChartCard";
import { AlertBanner } from "./components/AlertBanner";
import { AlertLog } from "./components/AlertLog";
import { SessionStats } from "./components/SessionStats";
import { TrendsPanel } from "./components/TrendsPanel";

// Constants
import { STATUS, THRESHOLDS, CHART_CONFIGS, ALERT_SOUND_INTERVAL } from "./constants";

// DASHBOARD
export default function DriverDashboard() {

    // Live Data (metrics + chart histories)
    const { metrics, earHistory, yawHistory, pitchHistory, alertLog } = useData();

    // Alert Classification derived from metrics
    // const { alertLevel, alertMessage, alertLog, sessionStats } = useAlertLogic(metrics);
    const backendStatus = metrics.status ?? "ALERT";

    let alertLevel = "safe";
    let alertMessage = "";

    switch (backendStatus) {
      case "DROWSY":
        alertLevel = "critical";
        alertMessage = "Driver drowsiness detected";
        break;

      case "DISTRACTED":
        alertLevel = "alert";
        alertMessage = "Driver distraction detected";
        break;
      
      case "WARNING":
        alertLevel = "warning";
        alertMessage = "Head movement detected"
        break;

      case "NO_FACE":
        alertLevel = "critical";
        alertMessage = "No driver detected";
        break;

      default:
        alertLevel = "safe";
        alertMessage = "";
    }

    const sessionStats = {
      drowsyEvents:   alertLog.filter(e => e.level === "critical").length,
      distractEvents: alertLog.filter(e => e.level === "alert").length,
      sessionStart:   Date.now(),
    };

    // Audio
    const playAlert = useAudioAlerts();
    const tickRef = useRef(0);
    const [flashActive, setFlashActive] = useState(false);

    // Flash overlay + throttled audio whenever alert level changes
    useEffect(() => {
        if (alertLevel === "safe") return;

        tickRef.current += 1;
        const t = tickRef.current;

        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 300);

        const interval = ALERT_SOUND_INTERVAL[alertLevel] ?? 10;
        if (t % interval === 0) playAlert(alertLevel);
    }, [metrics.tick, alertLevel, playAlert]);

    const st = STATUS[alertLevel];

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0a0a",
      color:      "#e2e8f0",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      position:   "relative",
      overflow:   "hidden",
    }}>
      {/* Scan-line texture */}
      <div style={{
        position:        "fixed",
        inset:           0,
        pointerEvents:   "none",
        zIndex:          0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
      }}/>
 
      {/* Alert flash overlay */}
      {flashActive && alertLevel !== "safe" && (
        <div style={{
          position:   "fixed",
          inset:      0,
          zIndex:     99,
          pointerEvents: "none",
          background: st.color + "18",
          animation:  "flashPulse 0.3s ease-out",
        }}/>
      )}
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        @keyframes flashPulse { from { opacity:1 } to { opacity:0 } }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn    { from{transform:translateY(-8px);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar       { width: 4px; background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
 
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
 
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#f8fafc" }}>
              DRIVER MONITOR
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2, letterSpacing: "0.08em" }}>
              EDGE SYSTEM · JETSON ORIN NANO · CS 131
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Face presence pill */}
            <div style={{
              display:    "flex",
              alignItems: "center",
              gap:        6,
              border:     `1px solid ${metrics.facePresent ? "#22c55e44" : "#ef444444"}`,
              borderRadius: 4,
              padding:    "5px 12px",
              fontSize:   11,
              color:      metrics.facePresent ? "#22c55e" : "#ef4444",
              background: metrics.facePresent ? "#052e1644" : "#1c000044",
            }}>
              <div style={{
                width:        6,
                height:       6,
                borderRadius: "50%",
                background:   metrics.facePresent ? "#22c55e" : "#ef4444",
                animation:    "blink 1.2s infinite",
              }}/>
              {metrics.facePresent ? "FACE DETECTED" : "NO FACE"}
            </div>
            {/* Alert level badge */}
            <div style={{
              border:       `1px solid ${st.color}66`,
              borderRadius: 4,
              padding:      "5px 14px",
              fontSize:     12,
              fontWeight:   500,
              color:        st.color,
              background:   st.bg,
              letterSpacing: "0.1em",
              animation:    alertLevel !== "safe" ? "blink 0.8s infinite" : "none",
            }}>
              {st.label}
            </div>
          </div>
        </div>
 
        {/* Alert banner */}
        <AlertBanner alertLevel={alertLevel} alertMessage={alertMessage} />
 
        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <MetricCard
            label="EAR — eye aspect ratio"
            value={metrics.ear.toFixed(3)}
            sub={metrics.ear < THRESHOLDS.EAR ? "BELOW THRESHOLD" : "NORMAL"}
            subColor={metrics.ear < THRESHOLDS.EAR ? "#ef4444" : "#22c55e"}
            danger={metrics.ear < THRESHOLDS.EAR}
            note={`Drowsy if < ${THRESHOLDS.EAR} for 2s+`}
          />
          <MetricCard
            label="YAW — head rotation"
            value={Math.abs(metrics.yaw).toFixed(1) + "°"}
            sub={Math.abs(metrics.yaw) > THRESHOLDS.YAW ? "LOOKING AWAY" : "CENTERED"}
            subColor={Math.abs(metrics.yaw) > THRESHOLDS.YAW ? "#f97316" : "#22c55e"}
            danger={Math.abs(metrics.yaw) > THRESHOLDS.YAW}
            note={`Distracted if > ${THRESHOLDS.YAW}° for 1.5s+`}
          />
          <MetricCard
            label="PITCH — head tilt down"
            value={metrics.pitch.toFixed(1) + "°"}
            sub={metrics.pitch > THRESHOLDS.PITCH ? "LOOKING DOWN" : "LEVEL"}
            subColor={metrics.pitch > THRESHOLDS.PITCH ? "#f97316" : "#22c55e"}
            danger={metrics.pitch > THRESHOLDS.PITCH}
            note={`Phone-check if > ${THRESHOLDS.PITCH}° for 1.5s+`}
          />
        </div>
 
        {/* Charts + session stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 220px", gap: 12, marginBottom: 12 }}>
          <ChartCard data={earHistory}   {...CHART_CONFIGS.ear} />
          <ChartCard data={yawHistory}   {...CHART_CONFIGS.yaw} />
          <SessionStats alertLevel={alertLevel} sessionStats={sessionStats} />
        </div>
 
        {/* Pitch chart + alert log */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <ChartCard data={pitchHistory} {...CHART_CONFIGS.pitch} />
          <AlertLog alertLog={alertLog} />
        </div>

        {/* Trends panel */}
        <div style={{ marginBottom: 12 }}>
          <TrendsPanel />
        </div>
      </div>
    </div>
  );
}