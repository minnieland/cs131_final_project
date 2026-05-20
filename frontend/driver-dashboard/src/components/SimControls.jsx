// ─── SIMULATION CONTROLS ──────────────────────────────────────────────────────
// Dev-only panel for triggering alert states without real sensor data.
// Remove this component (and its import in DriverDashboard.jsx) once
// the system is connected to real detection output.
//
// simState  = { drowsy, lookAway, lookDown, facePresent }
// setSimState = setter for the above

function SimBtn({ label, active, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor:      "pointer",
        border:      `1px solid ${active ? color : "#333"}`,
        background:  active ? bg : "#111",
        color:       active ? color : "#888",
        padding:     "6px 14px",
        borderRadius: 4,
        fontFamily:  "inherit",
        fontSize:    11,
        transition:  "all 0.15s",
      }}
    >
      {active ? "■ " : "○ "}{label}
    </button>
  );
}

export function SimControls({ simState, setSimState }) {
  const toggle = key => setSimState(s => ({ ...s, [key]: !s[key] }));

  return (
    <div style={{ border: "1px solid #1e293b", borderRadius: 6, padding: "12px 16px", background: "#0a0a0a" }}>
      <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 10 }}>
        SIMULATION CONTROLS — remove when connected to real detection pipeline
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <SimBtn
          label="Simulate drowsiness"
          active={simState.drowsy}
          color="#ef4444" bg="#1c000044"
          onClick={() => toggle("drowsy")}
        />
        <SimBtn
          label="Simulate look-away"
          active={simState.lookAway}
          color="#f97316" bg="#1c0a0044"
          onClick={() => toggle("lookAway")}
        />
        <SimBtn
          label="Simulate phone-check"
          active={simState.lookDown}
          color="#f97316" bg="#1c0a0044"
          onClick={() => toggle("lookDown")}
        />
        <SimBtn
          label={simState.facePresent ? "Remove face" : "Add face"}
          active={!simState.facePresent}
          color="#facc15" bg="#1c170044"
          onClick={() => toggle("facePresent")}
        />
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#334155" }}>
          → switch to useAPIData when backend is ready
        </div>
      </div>
    </div>
  );
}