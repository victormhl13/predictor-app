import {
  useEffect,
  useState,
} from "react"

function formatRemaining(
  target: string
) {
  const difference =
    new Date(target).getTime() -
    Date.now()

  if (difference <= 0) {
    return "Locked"
  }

  const minutes = Math.floor(
    difference / 60000
  )
  const days = Math.floor(
    minutes / 1440
  )
  const hours = Math.floor(
    (minutes % 1440) / 60
  )
  const remainingMinutes =
    minutes % 60

  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }
  return `${Math.max(
    1,
    remainingMinutes
  )}m`
}

function Countdown({
  kickoff,
}: {
  kickoff: string
}) {
  const [text, setText] =
    useState(() =>
      formatRemaining(kickoff)
    )

  useEffect(() => {
    const interval =
      window.setInterval(
        () =>
          setText(
            formatRemaining(
              kickoff
            )
          ),
        30000
      )

    return () =>
      window.clearInterval(
        interval
      )
  }, [kickoff])

  return (
    <span
      style={{
        color:
          text === "Locked"
            ? "#FF8585"
            : "#9CF989",
        fontSize: "8px",
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  )
}

export default Countdown
