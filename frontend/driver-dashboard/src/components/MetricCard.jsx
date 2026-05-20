// Metric Card
// Shows a single live metric value (EAR, yaw, or pitch) with a status label.

export function MetricCard({ label, value, sub, subColor, danger, note }) {
  return (
    <div style={{
      border: `1px solid ${danger ? "#ef444444" : "#1e293b"}`,
      borderRadius: 6,
      padding: "14px 16px",
      background: "#0f172a",
      transition: "border-color 0.3s",
    }}>
      <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 32,
        fontWeight: 800,
        color: danger ? "#ef4444" : "#f8fafc",
        lineHeight: 1,
        marginBottom: 6,
        transition: "color 0.3s",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: subColor, fontWeight: 500, letterSpacing: "0.06em" }}>
        {sub}
      </div>
      <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>
        {note}
      </div>
    </div>
  );
}