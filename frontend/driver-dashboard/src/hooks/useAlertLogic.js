import { useState, useEffect, useRef } from "react";
import { THRESHOLDS } from "../constants";

// ALERT LOGIC HOOK
// Consumes raw metric values and produces alert level + message.
// This mirrors the logic in detection code, but on the frontend
// so the UI can react immediately without waiting for a backend round-trip.
//
// When GET /alerts endpoint is ready, you can optionally replace this
// with a fetch call instead — but keeping it here means alerts still work
// if the network is slow or the backend is down.

export function useAlertLogic(metrics) {
  const { ear, yaw, pitch, facePresent, tick } = metrics;

  const [alertLevel,   setAlertLevel]   = useState("safe");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertLog,     setAlertLog]     = useState([]);
  const [sessionStats, setSessionStats] = useState({
    drowsyEvents: 0,
    distractEvents: 0,
    sessionStart: Date.now(),
  });

  const drowsyTicks   = useRef(0);
  const distractTicks = useRef(0);

  useEffect(() => {
    if (tick === undefined) return;

    let level = "safe";
    let msg   = "";

    // Face presence check
    if (!facePresent) {
      level = "critical";
      msg   = "No face detected — driver may be absent";
      drowsyTicks.current   = 0;
      distractTicks.current = 0;
    }

    // Drowsiness check (EAR below threshold)
    else if (ear < THRESHOLDS.EAR) {
      drowsyTicks.current += 1;

      if (drowsyTicks.current >= THRESHOLDS.DROWSY_ALERT_TICKS) {
        level = "critical";
        msg   = "Driver asleep — eyes closed for 3+ seconds";
      } else if (drowsyTicks.current >= THRESHOLDS.DROWSY_WARNING_TICKS) {
        level = "alert";
        msg   = "Drowsiness detected — eyes closing";
      } else {
        level = "warning";
        msg   = "Eyes closing";
      }
    } else {
      drowsyTicks.current = 0;
    }

    // Distraction check (head yaw or pitch out of range)
    if (facePresent && (Math.abs(yaw) > THRESHOLDS.YAW || pitch > THRESHOLDS.PITCH)) {
      distractTicks.current += 1;

      if (distractTicks.current >= THRESHOLDS.DISTRACT_ALERT_TICKS) {
        // Don't downgrade if already at a higher severity
        if (level === "safe" || level === "warning") level = "alert";
        msg = pitch > THRESHOLDS.PITCH
          ? "Looking at phone — head tilted down"
          : "Driver looking away from road";

      } else if (distractTicks.current >= THRESHOLDS.DISTRACT_WARNING_TICKS && level === "safe") {
        level = "warning";
        msg   = "Head movement detected";
      }
    } else {
      distractTicks.current = 0;
    }

    setAlertLevel(level);
    setAlertMessage(msg);

    // Alert log (deduplicate consecutive identical messages)
    if (msg) {
      setAlertLog(prev => {
        if (prev[0]?.message === msg) return prev;

        setSessionStats(s => ({
          ...s,
          drowsyEvents:   s.drowsyEvents   + (ear < THRESHOLDS.EAR ? 1 : 0),
          distractEvents: s.distractEvents + (Math.abs(yaw) > THRESHOLDS.YAW || pitch > THRESHOLDS.PITCH ? 1 : 0),
        }));

        const entry = {
          id:      tick,
          level,
          message: msg,
          time:    new Date().toLocaleTimeString(),
        };
        return [entry, ...prev].slice(0, 50);
      });
    }

  }, [tick, ear, yaw, pitch, facePresent]);

  return { alertLevel, alertMessage, alertLog, sessionStats };
}