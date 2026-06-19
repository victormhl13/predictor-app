type Props = {
  value: number | ""
  onChange: (value: number) => void
  compact?: boolean
}

function ScoreStepper({
  value,
  onChange,
  compact = false,
}: Props) {
  const empty = value === ""
  const score = empty ? 0 : value
  const buttonSize =
    compact ? 32 : 40

  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        gap: compact ? "6px" : "9px",
      }}
    >
      <div
        style={{
          minWidth:
            compact ? "42px" : "56px",
          height:
            compact ? "36px" : "46px",
          display: "grid",
          placeItems: "center",
          border:
            "1px solid rgba(255,255,255,0.11)",
          borderRadius:
            compact ? "11px" : "14px",
          background:
            "rgba(255,255,255,0.055)",
          fontSize:
            compact ? "17px" : "21px",
          fontWeight: 850,
        }}
      >
        {empty ? "–" : score}
      </div>

      <div
        style={{
          display: "flex",
          gap: compact ? "6px" : "9px",
        }}
      >
        <button
          type="button"
          aria-label="Decrease score"
          onClick={() =>
            onChange(
              empty
                ? 0
                : Math.max(
                    0,
                    score - 1
                  )
            )
          }
          className="glass-button"
          style={{
            width: `${buttonSize}px`,
            minHeight: `${buttonSize}px`,
            padding: 0,
            opacity:
              !empty &&
              score === 0
                ? 0.35
                : 1,
            fontSize: "19px",
          }}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Increase score"
          onClick={() =>
            onChange(
              empty ? 1 : score + 1
            )
          }
          className="primary-button"
          style={{
            width: `${buttonSize}px`,
            minHeight: `${buttonSize}px`,
            padding: 0,
            fontSize: "19px",
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default ScoreStepper
