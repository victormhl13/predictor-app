type InfoCardProps = {
  title: string

  value: string
}

function InfoCard({
  title,

  value,
}: InfoCardProps) {
  return (
    <div
      style={{
        background:
          "rgba(255,255,255,0.05)",

        border:
          "1px solid rgba(255,255,255,0.08)",

        borderRadius:
          "20px",

        padding:
          "18px 20px",

        marginBottom:
          "12px",

        backdropFilter:
          "blur(10px)",

        WebkitBackdropFilter:
          "blur(10px)",

        boxShadow:
          "0 6px 18px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          fontSize:
            "12px",

          fontWeight:
            600,

          color:
            "#9CA3AF",

          letterSpacing:
            "0.6px",

          textTransform:
            "uppercase",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:
            "8px",

          fontSize:
            "20px",

          fontWeight:
            700,

          color:
            "#FFFFFF",

          lineHeight:
            "1.25",
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default InfoCard