type Props = {
  home: number
  away: number
  onChange: (
    side: "home" | "away",
    value: number
  ) => void
}

function ScoreRow({
  label,
  side,
  score,
  onChange,
}: {
  label: string
  side: "home" | "away"
  score: number
  onChange: Props["onChange"]
}) {
  return (
    <div className="score-pair-row">
      <span className="score-pair-label">
        {label}
      </span>
      <div className="score-pair-controls">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()} score`}
          disabled={score === 0}
          onClick={() =>
            onChange(
              side,
              Math.max(0, score - 1)
            )
          }
          className="score-pair-button score-pair-minus"
        >
          −
        </button>
        <strong className="score-pair-value">
          {score}
        </strong>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()} score`}
          onClick={() =>
            onChange(
              side,
              score + 1
            )
          }
          className="score-pair-button score-pair-plus"
        >
          +
        </button>
      </div>
    </div>
  )
}

function ScorePairControl({
  home,
  away,
  onChange,
}: Props) {
  return (
    <div className="score-pair">
      <ScoreRow
        label="Home"
        side="home"
        score={home}
        onChange={onChange}
      />
      <ScoreRow
        label="Away"
        side="away"
        score={away}
        onChange={onChange}
      />
    </div>
  )
}

export default ScorePairControl
