import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BASE_URL = "http://localhost:8000";

// TRENDS PANEL 
// Fetches the last 7 days of detection events from Firestore via GET /trends
// and displays a bar chart of drowsy vs distraction counts per day.

export function TrendsPanel() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchTrends = async () => {
    try {
      const res = await fetch(`${BASE_URL}/trends`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.days ?? []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount, then refresh every 60 seconds
  useEffect(() => {
    fetchTrends();
    const interval = setInterval(fetchTrends, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      border:       "1px solid #1e293b",
      borderRadius: 6,
      padding:      "14px 16px",
      background:   "#0f172a",
    }}>
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        marginBottom:   14,
      }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em" }}>
          7-DAY BEHAVIOR TRENDS
        </div>
        <button
          onClick={fetchTrends}
          style={{
            fontSize:     10,
            color:        "#475569",
            background:   "none",
            border:       "1px solid #1e293b",
            borderRadius: 3,
            padding:      "3px 8px",
            cursor:       "pointer",
            fontFamily:   "inherit",
          }}
        >
          REFRESH
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "20px 0" }}>
          Loading trends...
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "#ef4444", textAlign: "center", padding: "20px 0" }}>
          {error === "Firestore not connected"
            ? "Firestore not connected — check serviceAccountKey.json"
            : `Error: ${error}`}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "20px 0" }}>
          No events recorded yet — data will appear here after detections occur
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} />
            <YAxis tick={{ fill: "#334155", fontSize: 9 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background:   "#0f172a",
                border:       "1px solid #1e293b",
                borderRadius: 4,
                fontSize:     11,
              }}
              labelStyle={{ color: "#475569" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#475569" }}
            />
            <Bar dataKey="drowsy"     name="Drowsy"      fill="#ef4444" radius={[2,2,0,0]} />
            <Bar dataKey="distracted" name="Distracted"  fill="#f97316" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}