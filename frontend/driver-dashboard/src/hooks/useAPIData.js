import { useState, useEffect, useRef } from "react";
import { TICK_MS, HISTORY_LENGTH } from "../constants";

// REAL API DATA HOOK 
// Drop-in replacement for useMockData once backend is running.
//
// To switch over:
//   1. In DriverDashboard.jsx, change the import:
//        import { useMockData as useData } from "./hooks/useMockData";
//      to:
//        import { useAPIData as useData } from "./hooks/useAPIData";
//
//   2. Set the BASE_URL below to server (local or AWS).
//
//   3. The simState param is ignored here (no simulation needed with real data),
//      but keeping the same function signature means DriverDashboard needs no changes.
//
// Expected API response from GET /metrics:
// {
//   "ear":         0.28,       ← float, Eye Aspect Ratio
//   "yaw":         3.4,        ← float, degrees
//   "pitch":       -1.2,       ← float, degrees
//   "face_present": true       ← bool
// }

const BASE_URL = "http://localhost:8000"; // change to server URL

export function useAPIData(_simState) {
  const [metrics, setMetrics]         = useState({ ear: 0, yaw: 0, pitch: 0, facePresent: true });
  const [earHistory, setEarHistory]     = useState([]);
  const [yawHistory, setYawHistory]     = useState([]);
  const [pitchHistory, setPitchHistory] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      tickRef.current += 1;
      const t  = tickRef.current;
      const ts = new Date().toLocaleTimeString();

      try {
        const res  = await fetch(`${BASE_URL}/metrics`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const ear        = data.ear         ?? 0;
        const yaw        = data.yaw         ?? 0;
        const pitch      = data.pitch       ?? 0;
        const facePresent = data.face_present ?? true;

        setConnectionError(null);
        setMetrics({ ear, yaw, pitch, facePresent, tick: t, ts });

        const append = (prev, val) =>
          [...prev, { t, value: val, ts }].slice(-HISTORY_LENGTH);

        setEarHistory(h   => append(h, ear));
        setYawHistory(h   => append(h, yaw));
        setPitchHistory(h => append(h, pitch));

      } catch (err) {
        setConnectionError(err.message);
        // Keep last known metrics on error — don't zero out the charts
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []); // no sim deps — real data ignores sim state

  return { metrics, earHistory, yawHistory, pitchHistory, connectionError };
}