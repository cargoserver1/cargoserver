export default function PublicSectionLoading({ text = '로딩 중입니다...' }) {
  return (
    <div className="public-section-loading" role="status" aria-live="polite">
      <div className="public-section-loading__spinner" />
      <strong>{text}</strong>
      <p>데이터를 불러오는 동안 잠시만 기다려주세요.</p>
    </div>
  )
}
