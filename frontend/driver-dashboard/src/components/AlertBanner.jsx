import { STATUS } from "../constants";

// ALERT BANNER 
// Full-width colored strip that shows the current alert message.
// Hidden when alertLevel is "safe".

const ICONS = {
  warning:  "●",
  alert:    "▲",
  critical: "⚠",
};

export function AlertBanner({ alertLevel, alertMessage }) {
  if (alertLevel === "safe" || !alertMessage) return null;

  const st = STATUS[alertLevel];

  return (
    <div style={{
      border:     `1px solid ${st.color}88`,
      borderLeft: `3px solid ${st.color}`,
      borderRadius: 4,
      padding:    "10px 16px",
      marginBottom: 20,
      background: st.bg,
      color:      st.color,
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      fontSize:   13,
      display:    "flex",
      alignItems: "center",
      gap:        10,
      animation:  "slideIn 0.2s ease",
    }}>
      <span style={{ fontSize: 16 }}>{ICONS[alertLevel] ?? "●"}</span>
      {alertMessage.toUpperCase()}
    </div>
  );
}