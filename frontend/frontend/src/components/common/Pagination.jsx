function buildPageNumbers(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index)
  }

  const pages = new Set([0, totalPages - 1, page, page - 1, page + 1])

  if (page <= 2) {
    pages.add(1)
    pages.add(2)
    pages.add(3)
  }

  if (page >= totalPages - 3) {
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
    pages.add(totalPages - 4)
  }

  return [...pages]
    .filter((value) => value >= 0 && value < totalPages)
    .sort((a, b) => a - b)
}

export default function Pagination({
  page = 0,
  totalPages = 0,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null

  const pageNumbers = buildPageNumbers(page, totalPages)

  const movePage = (nextPage) => {
    if (nextPage < 0 || nextPage > totalPages - 1) return
    onPageChange(nextPage)
  }

  return (
    <div className={`pagination-bar ${className}`.trim()}>
      <button
        type="button"
        className="pagination-btn"
        onClick={() => movePage(0)}
        disabled={page === 0}
      >
        처음
      </button>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => movePage(page - 1)}
        disabled={page === 0}
      >
        이전
      </button>

      <div className="pagination-pages">
        {pageNumbers.map((pageNumber, index) => {
          const prev = pageNumbers[index - 1]
          const showEllipsis = index > 0 && pageNumber - prev > 1

          return (
            <div key={pageNumber} className="pagination-page-wrap">
              {showEllipsis ? <span className="pagination-ellipsis">...</span> : null}

              <button
                type="button"
                className={`pagination-btn ${page === pageNumber ? 'is-active' : ''}`}
                onClick={() => movePage(pageNumber)}
              >
                {pageNumber + 1}
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => movePage(page + 1)}
        disabled={page >= totalPages - 1}
      >
        다음
      </button>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => movePage(totalPages - 1)}
        disabled={page >= totalPages - 1}
      >
        마지막
      </button>

      <span className="pagination-summary">
        {page + 1} / {totalPages}
      </span>
    </div>
  )
}