import PageHeader from "../components/PageHeader"

const rules = [
  {
    title: "Exact score",
    text: "3 points when both team scores are predicted exactly.",
  },
  {
    title: "Correct outcome",
    text: "1 point for predicting the correct winner or a draw without the exact score.",
  },
  {
    title: "Prediction deadline",
    text: "Predictions lock exactly at the official kickoff time. If LPF changes the kickoff, the new time is used automatically.",
  },
  {
    title: "Rescheduled matches",
    text: "A rescheduled badge appears after LPF changes the date or time. Existing predictions remain saved and unlock again if the new kickoff is in the future.",
  },
  {
    title: "Results",
    text: "Final scores are synchronized from LPF. A matchday closes automatically when every match has a final result.",
  },
]

function Rules() {
  return (
    <div className="page">
      <PageHeader
        title="Rules"
        subtitle="How GoalPredict scoring and deadlines work."
      />
      <div
        className="surface"
        style={{
          overflow: "hidden",
        }}
      >
        {rules.map((rule) => (
          <div
            key={rule.title}
            className="compact-row"
            style={{
              display: "block",
              padding: "13px",
            }}
          >
            <strong
              style={{
                fontSize: "12px",
              }}
            >
              {rule.title}
            </strong>
            <p
              style={{
                margin: "4px 0 0",
                color: "#9CA3AF",
                fontSize: "10px",
                lineHeight: 1.5,
              }}
            >
              {rule.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Rules
