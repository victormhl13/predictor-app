export function formatDualKickoffTime(
  kickoff: string,
  options: {
    timeTba?: boolean
  } = {}
) {
  const date = new Date(kickoff)
  const day =
    date.toLocaleDateString(
      "ro-RO",
      {
        day: "2-digit",
        month: "short",
        timeZone:
          "Europe/Amsterdam",
      }
    )

  if (options.timeTba) {
    return `${day}, time TBA`
  }

  const nlTime =
    date.toLocaleTimeString(
      "ro-RO",
      {
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "Europe/Amsterdam",
      }
    )
  const roTime =
    date.toLocaleTimeString(
      "ro-RO",
      {
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "Europe/Bucharest",
      }
    )

  return `${day}, ${nlTime} NL / ${roTime} RO`
}
