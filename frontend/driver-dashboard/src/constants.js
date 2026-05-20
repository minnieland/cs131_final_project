// Detection Thresholds

export const THRESHOLDS = {
    EAR: 0.20,      // Eye Aspect Ratio - drowsy if below this for EAR_DURATION ticks
    YAW: 25,        // degrees - distracted if yaw exceeds this
    PITCH: 20,      // degrees - phone-check if pitch exceeds this

    // How many 500ms ticks before escalating alert level
    DROWSY_WARNING_TICKS: 3,        // 1.5s -> warning
    DROWSY_ALERT_TICKS: 6,          // 3s -> alert
    DISTRACT_WARNING_TICKS: 2,      // 1s -> warning
    DISTRACT_ALERT_TICKS: 4,        // 2s -> alert
};

// Alert Level Styles
// Used by any component that needs to color-code by alert level.
export const STATUS = {
  safe:     { label: "SAFE",     color: "#22c55e", bg: "#052e16" },
  warning:  { label: "WARNING",  color: "#facc15", bg: "#1c1700" },
  alert:    { label: "ALERT",    color: "#f97316", bg: "#1c0a00" },
  critical: { label: "CRITICAL", color: "#ef4444", bg: "#1c0000" },
};

// Audio Alert Configs
// freq = Hz tone, duration = seconds per pulse, pulses = how many beeps
export const ALERT_SOUNDS = {
  warning:  { freq: 880,  duration: 0.18, pulses: 1 },
  alert:    { freq: 1050, duration: 0.22, pulses: 2 },
  critical: { freq: 1300, duration: 0.28, pulses: 4 },
};

// How often (in ticks) to repeat audio for each level
export const ALERT_SOUND_INTERVAL = {
  warning:  10, // every 5s
  alert:     6, // every 3s
  critical:  4, // every 2s
};

// Chart Configs
// Used by ChartCard - one entry per metric
export const CHART_CONFIGS = {
  ear: {
    title:       "EAR — eye aspect ratio",
    color:       "#60a5fa",
    dangerColor: "#ef4444",
    refLine:     0.20,
    refLabel:    "Drowsy threshold",
    domain:      [0, 0.5],
    invertDanger: true, // danger = BELOW the line (eyes closed)
  },
  yaw: {
    title:       "Head yaw",
    color:       "#a78bfa",
    dangerColor: "#f97316",
    refLine:     25,
    refLabel:    "Distraction threshold",
    domain:      [-60, 60],
    invertDanger: false,
  },
  pitch: {
    title:       "Head pitch",
    color:       "#34d399",
    dangerColor: "#f97316",
    refLine:     20,
    refLabel:    "Phone-check threshold",
    domain:      [-20, 60],
    invertDanger: false,
  },
};
 
// How many data points to keep in each chart's history array
export const HISTORY_LENGTH = 40;
 
// Polling interval in ms (used by both mock and real data hooks)
export const TICK_MS = 500;
