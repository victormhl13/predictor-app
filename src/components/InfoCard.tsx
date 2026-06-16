type InfoCardProps = {
  title: string
  value: string
}

function InfoCard({ title, value }: InfoCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#1E1E1E",

        borderRadius: "16px",

        padding: "20px",

        marginBottom: "16px",

        border: "1px solid #2A2A2A",
      }}
    >
      <h3
        style={{
          marginTop: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "18px",
          marginBottom: 0,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default InfoCard