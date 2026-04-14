import { useEffect, useMemo, useState } from 'react'

export default function useClientPagination(items = [], pageSize = 10) {
  const [page, setPage] = useState(0)

  const totalPages = items.length === 0 ? 0 : Math.ceil(items.length / pageSize)

  useEffect(() => {
    setPage((prev) => {
      if (totalPages === 0) return 0
      return Math.min(prev, totalPages - 1)
    })
  }, [totalPages])

  const pagedItems = useMemo(() => {
    if (items.length === 0) return []
    const start = page * pageSize
    const end = start + pageSize
    return items.slice(start, end)
  }, [items, page, pageSize])

  return {
    page,
    setPage,
    totalPages,
    pagedItems,
    totalItems: items.length,
    pageSize,
  }
}