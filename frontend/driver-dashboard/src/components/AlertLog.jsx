import { STATUS } from "../constants";

// ALERT LOG 
// Scrollable list of alert events with timestamp and severity dot.
// alertLog entries: { id, level, message, time }

export function AlertLog({ alertLog }) {
  return (
    <div style={{ border: "1px solid #1e293b", borderRadius: 6, background: "#0f172a", overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em" }}>ALERT LOG</div>
        <div style={{ fontSize: 10, color: "#334155" }}>{alertLog.length} events</div>
      </div>

      <div style={{ maxHeight: 180, overflowY: "auto", padding: "6px 0" }}>
        {alertLog.length === 0 && (
          <div style={{ padding: "20px 14px", color: "#334155", fontSize: 11, textAlign: "center" }}>
            No alerts yet
          </div>
        )}
        {alertLog.map(entry => (
          <div key={entry.id} style={{
            padding:      "6px 14px",
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            borderBottom: "1px solid #0f172a",
            animation:    "slideIn 0.2s ease",
          }}>
            <div style={{
              width:        6,
              height:       6,
              borderRadius: "50%",
              flexShrink:   0,
              background:   STATUS[entry.level]?.color ?? "#888",
            }}/>
            <div style={{ flex: 1, fontSize: 11, color: "#94a3b8" }}>{entry.message}</div>
            <div style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>{entry.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}