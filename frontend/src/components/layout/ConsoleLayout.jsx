export default function ConsoleLayout({ shellClassName = '', sidebar, topbar, message, children }) {
  return (
    <div className={`console-shell ${shellClassName}`.trim()}>
      {sidebar}
      <main className="console-main">
        {topbar}
        {!!message && <div className="alert-info slim">{message}</div>}
        {children}
      </main>
    </div>
  )
}
