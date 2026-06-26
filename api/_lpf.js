const LPF_BASE_URL = "https://lpf.ro"

const MONTHS = {
  ian: 1,
  ianuarie: 1,
  feb: 2,
  februarie: 2,
  mar: 3,
  martie: 3,
  apr: 4,
  aprilie: 4,
  mai: 5,
  iun: 6,
  iunie: 6,
  iul: 7,
  iulie: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  septembrie: 9,
  oct: 10,
  octombrie: 10,
  nov: 11,
  noiembrie: 11,
  dec: 12,
  decembrie: 12,
}

function decodeHtml(value = "") {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(
      /&#(\d+);/g,
      (_, code) =>
        String.fromCodePoint(Number(code))
    )
}

function text(value = "") {
  return decodeHtml(
    value.replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
}

function attribute(
  html,
  attributeName
) {
  const match = html.match(
    new RegExp(
      `${attributeName}=["']([^"']+)["']`,
      "i"
    )
  )
  return match
    ? decodeHtml(match[1])
    : null
}

function bucharestOffsetMinutes(date) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Europe/Bucharest",
        timeZoneName:
          "shortOffset",
      }
    ).formatToParts(date)
  const offset =
    parts.find(
      (part) =>
        part.type ===
        "timeZoneName"
    )?.value || "GMT+2"
  const match = offset.match(
    /GMT([+-])(\d{1,2})(?::(\d{2}))?/
  )
  if (!match) return 120
  const minutes =
    Number(match[2]) * 60 +
    Number(match[3] || 0)
  return match[1] === "-"
    ? -minutes
    : minutes
}

function localDateToIso(
  year,
  month,
  day,
  hour,
  minute
) {
  const utcGuess = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute
  )
  const offset =
    bucharestOffsetMinutes(
      new Date(utcGuess)
    )
  return new Date(
    utcGuess - offset * 60_000
  ).toISOString()
}

export function parseRomanianDate(
  value
) {
  const normalized = text(value)
    .toLocaleLowerCase("ro-RO")
    .replace(/\./g, "")
  const match = normalized.match(
    /(\d{1,2})\s+([a-zăâîșşțţ]+)\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/i
  )
  if (!match) return null

  const month =
    MONTHS[match[2]]
  if (!month) return null

  const hour = match[4]
    ? Number(match[4])
    : 12
  const minute = match[5]
    ? Number(match[5])
    : 0

  return localDateToIso(
    Number(match[3]),
    month,
    Number(match[1]),
    hour,
    minute
  )
}

function hasKnownKickoffTime(
  value
) {
  return /\b\d{1,2}:\d{2}\b/.test(
    text(value)
  )
}

export function parseSeason(html) {
  const match = text(html).match(
    /SEZONUL\s+(\d{4})\s*[–—-]\s*(\d{4})/i
  )
  if (!match) return null
  return {
    year: Number(match[1]),
    endYear: Number(match[2]),
    label: `${match[1]}–${match[2]}`,
    current: true,
  }
}

export function parsePlayoffEdition(
  html
) {
  const playoff =
    html.match(
      /id=["']playoff["'][\s\S]*?(?:class=["'][^"']*ajax_etapa_playoff[^"']*["'][^>]*|class=["'][^"']*ajax_etapa_playoff[^"']*["'][^>]*)editie=["'](\d+)["']/i
    ) ||
    html.match(
      /class=["'][^"']*ajax_etapa_playoff[^"']*["'][^>]*editie=["'](\d+)["']/i
    )
  return playoff
    ? Number(playoff[1])
    : null
}

function generatedFixtureId(
  phase,
  round,
  index
) {
  if (!round) return null
  const phaseCode =
    phase === "playoff" ? 2 : 1
  return -(
    9_000_000 +
    phaseCode * 100_000 +
    round * 100 +
    index +
    1
  )
}

function decodeGeneratedFixtureId(
  fixtureId
) {
  const value = Math.abs(fixtureId)
  if (value < 9_000_000) {
    return null
  }

  const encoded =
    value - 9_000_000
  const phaseCode = Math.floor(
    encoded / 100_000
  )
  const rest =
    encoded - phaseCode * 100_000
  const round = Math.floor(
    rest / 100
  )
  const index = rest % 100

  return {
    phase:
      phaseCode === 2
        ? "playoff"
        : "regular",
    round,
    index,
  }
}

function teamFromRow(
  row,
  className
) {
  const block = row.match(
    new RegExp(
      `<div[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>\\s*<\\/a>|<div[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`,
      "i"
    )
  )
  if (!block) return null
  const html = block[0]
  return (
    attribute(html, "title") ||
    text(block[1] || block[2])
  )
}

function logoFromRow(
  row,
  className
) {
  const block = row.match(
    new RegExp(
      `<div[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`,
      "i"
    )
  )
  if (!block) return null
  const path =
    attribute(block[1], "src") ||
    attribute(
      block[1],
      "data-src"
    )
  if (!path) return null
  return new URL(
    path,
    `${LPF_BASE_URL}/`
  ).toString()
}

function scoresFromRow(row) {
  const scores = Array.from(
    row.matchAll(
      /class=["'][^"']*scor-goluri[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
    )
  )
    .slice(0, 2)
    .map((match) =>
      Number(text(match[1]))
    )
  return {
    homeScore:
      Number.isInteger(scores[0])
        ? scores[0]
        : null,
    awayScore:
      Number.isInteger(scores[1])
        ? scores[1]
        : null,
  }
}

export function parseRound(
  html,
  fallbackRound = null,
  phase = "regular"
) {
  return Array.from(
    html.matchAll(
      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
    )
  )
    .map((match) => match[0])
    .filter(
      (row) =>
        row.includes(
          "echipa-etapa-1"
        ) &&
        row.includes(
          "echipa-etapa-2"
        )
    )
    .map((row, index) => {
      const dateCell =
        row.match(
          /<td[^>]*class=["'][^"']*etapa-meci-data[^"']*hiddenMobile[^"']*["'][^>]*>([\s\S]*?)<\/td>/i
        )
      const stats =
        row.match(
          /href=["'][^"']*statistici\/(\d+)["']/i
        )
      const kickoff =
        dateCell
          ? parseRomanianDate(
              dateCell[1]
            )
          : null
      const homeTeam =
        teamFromRow(
          row,
          "echipa-etapa-1"
        )
      const awayTeam =
        teamFromRow(
          row,
          "echipa-etapa-2"
        )
      const statsId = stats
        ? Number(stats[1])
        : null
      const scores =
        scoresFromRow(row)

      return {
        id:
          Number.isInteger(statsId)
            ? -statsId
            : generatedFixtureId(
                phase,
                fallbackRound,
                index
              ),
        kickoff,
        homeTeam,
        awayTeam,
        homeLogo: logoFromRow(
          row,
          "echipa1-logo-s"
        ),
        awayLogo: logoFromRow(
          row,
          "echipa2-logo-s"
        ),
        kickoffTimeTba: dateCell
          ? !hasKnownKickoffTime(
              dateCell[1]
            )
          : false,
        ...scores,
        source: "LPF",
      }
    })
    .filter(
      (fixture) =>
        Number.isInteger(fixture.id) &&
        fixture.kickoff &&
        fixture.homeTeam &&
        fixture.awayTeam
    )
    .sort(
      (a, b) =>
        new Date(a.kickoff).getTime() -
        new Date(b.kickoff).getTime()
    )
}

export async function fetchLpfPage(
  path
) {
  const response = await fetch(
    new URL(path, LPF_BASE_URL),
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml",
        "user-agent":
          "GoalPredict/1.0 (private football predictions app)",
      },
    }
  )
  if (!response.ok) {
    throw new Error(
      `LPF returned ${response.status}`
    )
  }
  return response.text()
}

export async function fetchLpfResult(
  fixtureId
) {
  const generated =
    decodeGeneratedFixtureId(
      fixtureId
    )

  if (generated) {
    if (
      generated.phase ===
      "playoff"
    ) {
      return {
        id: fixtureId,
        status: "NS",
        homeScore: null,
        awayScore: null,
        kickoff: null,
        homeTeam: null,
        awayTeam: null,
        homeLogo: null,
        awayLogo: null,
        kickoffTimeTba: false,
      }
    }

    const roundHtml =
      await fetchLpfPage(
        `/etape-liga-1/${generated.round}`
      )
    const fixture = parseRound(
      roundHtml,
      generated.round,
      generated.phase
    ).find(
      (item) =>
        item.id === fixtureId
    )

    if (!fixture) {
      return {
        id: fixtureId,
        status: "NS",
        homeScore: null,
        awayScore: null,
        kickoff: null,
        homeTeam: null,
        awayTeam: null,
        homeLogo: null,
        awayLogo: null,
        kickoffTimeTba: false,
      }
    }

    const isFinal =
      fixture.homeScore !== null &&
      fixture.awayScore !== null &&
      Date.now() -
        new Date(
          fixture.kickoff
        ).getTime() >
        135 * 60_000

    return {
      ...fixture,
      status: isFinal
        ? "FT"
        : "NS",
    }
  }

  const html = await fetchLpfPage(
    `/statistici/${Math.abs(
      fixtureId
    )}`
  )
  const score = html.match(
    /class=["'][^"']*scor_mc[^"']*["'][^>]*>\s*(\d+)\s*:\s*(\d+)\s*</i
  )
  const date = html.match(
    /class=["'][^"']*homepage-etapa-footer[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i
  )
  const kickoff = date
    ? parseRomanianDate(date[1])
    : null
  const kickoffTimeTba = date
    ? !hasKnownKickoffTime(date[1])
    : false
  const pageTitle = text(
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/i
    )?.[1] || ""
  )
  const titleTeams =
    pageTitle.match(
      /^(.*?)\s+-\s+(.*?)\s+-\s+Etapa\b/i
    )
  const scoreRow =
    html.match(
      /<tr[^>]*>[\s\S]*?class=["'][^"']*scor_mc[^"']*["'][\s\S]*?<\/tr>/i
    )?.[0] || ""
  const logoPaths = Array.from(
    scoreRow.matchAll(
      /<img[^>]+src=["']([^"']+)["']/gi
    )
  )
    .slice(0, 2)
    .map((match) =>
      new URL(
        match[1],
        `${LPF_BASE_URL}/`
      ).toString()
    )
  const homeTeam =
    titleTeams?.[1]?.trim() || null
  const awayTeam =
    titleTeams?.[2]?.trim() || null
  const details = {
    kickoff,
    homeTeam,
    awayTeam,
    homeLogo:
      logoPaths[0] || null,
    awayLogo:
      logoPaths[1] || null,
    kickoffTimeTba,
  }

  if (!score || !kickoff) {
    return {
      id: fixtureId,
      status: "NS",
      homeScore: null,
      awayScore: null,
      ...details,
    }
  }

  const safelyFinished =
    Date.now() -
      new Date(kickoff).getTime() >
    135 * 60_000

  return {
    id: fixtureId,
    status: safelyFinished
      ? "FT"
      : "LIVE",
    homeScore: Number(score[1]),
    awayScore: Number(score[2]),
    ...details,
  }
}
