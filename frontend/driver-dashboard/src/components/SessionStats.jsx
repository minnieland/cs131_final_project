import { STATUS, THRESHOLDS } from "../constants";

// SESSION STATS
// Shows session duration, event counts, current alert state, and threshold reference.

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
      <span style={{ fontSize: 11, color: "#475569" }}>{label}</span>
      <span style={{ fontSize: 11, color: color || "#94a3b8", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function SessionStats({ alertLevel, sessionStats }) {
  const st = STATUS[alertLevel];
  const sessionMins = Math.floor((Date.now() - sessionStats.sessionStart) / 60000);

  return (
    <div style={{ border: "1px solid #1e293b", borderRadius: 6, padding: "14px 16px", background: "#0f172a" }}>
      <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 14 }}>
        SESSION STATS
      </div>

      <StatRow label="Duration"        value={`${sessionMins}m`} />
      <StatRow label="Drowsy events"   value={sessionStats.drowsyEvents}   color="#ef4444" />
      <StatRow label="Distract events" value={sessionStats.distractEvents} color="#f97316" />
      <StatRow label="Current state"   value={st.label}                    color={st.color} />

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1e293b" }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>
          THRESHOLDS
        </div>
        <StatRow label="EAR"   value={`< ${THRESHOLDS.EAR}`} />
        <StatRow label="Yaw"   value={`> ${THRESHOLDS.YAW}°`} />
        <StatRow label="Pitch" value={`> ${THRESHOLDS.PITCH}°`} />
      </div>
    </div>
  );
}