import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DriverDashboard from "./DriverDashboard";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DriverDashboard />
  </StrictMode>
);