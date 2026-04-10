import logo from '../../assets/want-logo.png'

export default function AppLogo({
  title = 'want',
  subtitle = '운송 운영 플랫폼',
  className = '',
  compact = false,
  hideText = false,
  hideTitle = false,
}) {
  const wrapperClassName = [
    'app-logo',
    compact ? 'app-logo--compact' : '',
    hideText ? 'app-logo--imageOnly' : '',
    hideTitle ? 'app-logo--subtitleOnly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClassName} data-logo-tone="adaptive">
      <span className="app-logo__mark" aria-hidden="true">
        <img src={logo} alt={`${title || 'want'} logo`} className="app-logo__image" />
      </span>
      {!hideText && (title || subtitle) ? (
        <span className="app-logo__text">
          {!hideTitle && !!title && <strong>{title}</strong>}
          {!!subtitle && <small>{subtitle}</small>}
        </span>
      ) : null}
    </div>
  )
}
