type Props = {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

function PageHeader({
  title,
  subtitle,
  action,
}: Props) {
  return (
    <header className="page-header">
      <div>
        <h2 className="page-title">
          {title}
        </h2>
        {subtitle && (
          <p className="page-subtitle">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  )
}

export default PageHeader
