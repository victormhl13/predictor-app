function SkeletonList({
  rows = 3,
}: {
  rows?: number
}) {
  return (
    <div
      className="surface"
      style={{
        padding: "12px",
        display: "grid",
        gap: "10px",
      }}
    >
      {Array.from({
        length: rows,
      }).map((_, index) => (
        <div
          key={index}
          style={{
            height: "48px",
            borderRadius: "13px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.035), rgba(255,255,255,0.085), rgba(255,255,255,0.035))",
            backgroundSize:
              "200% 100%",
            animation:
              "skeleton-shimmer 1.4s ease infinite",
          }}
        />
      ))}
    </div>
  )
}

export default SkeletonList
