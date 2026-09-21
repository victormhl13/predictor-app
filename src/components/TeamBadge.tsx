import { useState } from "react"

type Props = {
  name: string
  logo?: string | null
  size?: number
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function TeamBadge({
  name,
  logo,
  size = 34,
}: Props) {
  const [imageFailed, setImageFailed] =
    useState(false)

  const sharedStyle = {
    width: `${size}px`,
    height: `${size}px`,
    flex: `0 0 ${size}px`,
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.18)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.045))",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px rgba(0,0,0,0.24)",
  } as const

  if (logo && !imageFailed) {
    return (
      <img
        className="team-badge"
        src={logo}
        alt=""
        onError={() =>
          setImageFailed(true)
        }
        style={{
          ...sharedStyle,
          objectFit: "contain",
          padding: "4px",
        }}
      />
    )
  }

  return (
    <div
      className="team-badge"
      aria-label={`${name} badge`}
      style={{
        ...sharedStyle,
        display: "grid",
        placeItems: "center",
        color: "#DDE3EA",
        fontSize:
          size <= 30 ? "8px" : "9px",
        fontWeight: 800,
        letterSpacing: "0.2px",
      }}
    >
      {getInitials(name)}
    </div>
  )
}

export default TeamBadge
