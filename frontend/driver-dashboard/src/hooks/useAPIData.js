import { useState, useEffect, useRef } from "react";
import { TICK_MS, HISTORY_LENGTH } from "../constants";

const BASE_URL = "http://localhost:8000";

export function useAPIData() {
  const [metrics, setMetrics]           = useState({ ear: 0, yaw: 0, pitch: 0, facePresent: true });
  const [earHistory, setEarHistory]     = useState([]);
  const [yawHistory, setYawHistory]     = useState([]);
  const [pitchHistory, setPitchHistory] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [alertLog, setAlertLog]         = useState([]); 
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      tickRef.current += 1;
      const t  = tickRef.current;
      const ts = new Date().toLocaleTimeString();

      try {
        // fetch both endpoints in parallel
        const [metricsRes, alertsRes] = await Promise.all([
          fetch(`${BASE_URL}/metrics`),
          fetch(`${BASE_URL}/alerts`),
        ]);

        if (!metricsRes.ok) throw new Error(`HTTP ${metricsRes.status}`);
        const data   = await metricsRes.json();
        const alerts = alertsRes.ok ? await alertsRes.json() : [];

        const ear         = data.ear          ?? 0;
        const yaw         = data.yaw          ?? 0;
        const pitch       = data.pitch        ?? 0;
        const facePresent = data.face_present ?? true;
        const perclos     = data.perclos      ?? 0;
        const blinkCount  = data.blink_count  ?? 0;
        const status      = data.status       ?? "ALERT";

        setConnectionError(null);
        setMetrics({ ear, yaw, pitch, facePresent, perclos, blinkCount, status, tick: t, ts });
        setAlertLog(alerts); 

        const append = (prev, val) =>
          [...prev, { t, value: val, ts }].slice(-HISTORY_LENGTH);

        setEarHistory(h   => append(h, ear));
        setYawHistory(h   => append(h, yaw));
        setPitchHistory(h => append(h, pitch));

      } catch (err) {
        setConnectionError(err.message);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return { metrics, earHistory, yawHistory, pitchHistory, connectionError, alertLog };
}