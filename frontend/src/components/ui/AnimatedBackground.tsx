"use client";

// Simplified background - no heavy animations
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(92, 158, 255, 0.08) 0%, transparent 50%)',
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 100% 100%, rgba(167, 139, 250, 0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
