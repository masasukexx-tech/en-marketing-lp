"use client";

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
      {label && <p style={{ marginBottom: 4, fontSize: "0.9em", opacity: 0.85 }}>{label}</p>}
      <div style={{ width: "100%", height: 10, background: "#333", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: "#4caf50",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <p style={{ marginTop: 4, fontSize: "0.85em", opacity: 0.7 }}>{Math.round(clamped)}%</p>
    </div>
  );
}
