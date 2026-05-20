import { useState, useEffect, useRef } from "react";
import { TICK_MS, HISTORY_LENGTH } from "../constants";

// Mock Data Generators
// Produce plausible-looking sensor values for frontend
// Once face detection and EAR/hose pose are ready,
// delete this file and switch to useAPIData.js instead

function fakeEAR(drowsy) {
    return drowsy
      ? +(Math.random() * 0.10 + 0.12).toFixed(3)  // 0.12–0.22 when drowsy
      : +(Math.random() * 0.08 + 0.28).toFixed(3); // 0.28–0.36 when alert
}
 
function fakeYaw(distracted) {
  return distracted
    ? +(Math.random() * 30 + 25).toFixed(1)  // 25–55° when distracted
    : +(Math.random() * 10 - 5).toFixed(1);  // -5–5° when centered
}
 
function fakePitch(lookingDown) {
  return lookingDown
    ? +(Math.random() * 20 + 20).toFixed(1)  // 20–40° when looking at phone
    : +(Math.random() * 8  - 4).toFixed(1);  // -4–4° when level
}

// Hook
export function useMockData(simState) {
  const { drowsy, lookAway, lookDown, facePresent } = simState;
 
  const [metrics, setMetrics]       = useState({ ear: 0.31, yaw: 0, pitch: 0 });
  const [earHistory, setEarHistory]   = useState([]);
  const [yawHistory, setYawHistory]   = useState([]);
  const [pitchHistory, setPitchHistory] = useState([]);
  const tickRef = useRef(0);
 
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t  = tickRef.current;
      const ts = new Date().toLocaleTimeString();
 
      const ear   = facePresent ? fakeEAR(drowsy)    : 0;
      const yaw   = facePresent ? fakeYaw(lookAway)  : 0;
      const pitch = facePresent ? fakePitch(lookDown) : 0;
 
      setMetrics({ ear, yaw, pitch, facePresent, tick: t, ts });
 
      const append = (prev, val) =>
        [...prev, { t, value: val, ts }].slice(-HISTORY_LENGTH);
 
      setEarHistory(h   => append(h, ear));
      setYawHistory(h   => append(h, yaw));
      setPitchHistory(h => append(h, pitch));
    }, TICK_MS);
 
    return () => clearInterval(interval);
  }, [drowsy, lookAway, lookDown, facePresent]);
 
  return { metrics, earHistory, yawHistory, pitchHistory };
}