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
      <div className="page-header-copy">
        <h2 className="page-title">
          {title}
        </h2>
        {subtitle && (
          <p className="page-subtitle">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="page-header-action">
          {action}
        </div>
      )}
    </header>
  )
}

export default PageHeader
