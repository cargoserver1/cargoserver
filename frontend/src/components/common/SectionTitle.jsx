export default function SectionTitle({ eyebrow, title, desc, action }) {
  return (
    <div className="section-title-row">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {desc && <p className="section-desc">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
