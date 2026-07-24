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
    text: "Predictions lock exactly at the official kickoff time. Kickoff times are shown in Romanian time.",
  },
  {
    title: "Rescheduled matches",
    text: "A rescheduled badge appears after LPF changes the date or time. Existing predictions remain saved and unlock again if the new kickoff is in the future.",
  },
  {
    title: "Results",
    text: "After matches finish, final scores are synchronized from LPF. If sync is not available, an admin can enter the final score manually after kickoff.",
  },
  {
    title: "Ranking",
    text: "Ranking updates automatically only for matches that have both a final score and saved predictions. Closing a matchday is manual and does not change points.",
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
