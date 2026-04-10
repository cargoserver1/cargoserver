import { useEffect, useMemo, useRef, useState } from "react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { formatCurrency, formatDate, transactionTypeText } from "../../utils/formatters"
import "./ReceiptPdfBridge.css"

function parseReceiptPayload() {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('receiptPdf')
    if (!encoded) return null

    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
    const json = decodeURIComponent(escape(window.atob(padded)))
    return JSON.parse(json)
  } catch (error) {
    console.error('영수증 QR 데이터 파싱 실패', error)
    return null
  }
}

async function exportReceiptPdf(element, fileName) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
  })

  const imageData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableWidth = pageWidth - margin * 2
  const imageHeight = (canvas.height * usableWidth) / canvas.width

  if (imageHeight <= pageHeight - margin * 2) {
    pdf.addImage(imageData, 'PNG', margin, margin, usableWidth, imageHeight)
  } else {
    let remainingHeight = imageHeight
    let sourceY = 0
    const pageCanvas = document.createElement('canvas')
    const pageContext = pageCanvas.getContext('2d')
    const pagePixelHeight = Math.floor(((pageHeight - margin * 2) * canvas.width) / usableWidth)

    pageCanvas.width = canvas.width
    pageCanvas.height = pagePixelHeight

    while (remainingHeight > 0 && pageContext) {
      pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
      pageContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        pagePixelHeight,
        0,
        0,
        canvas.width,
        pagePixelHeight,
      )

      const pageImageData = pageCanvas.toDataURL('image/png')
      const currentPageHeight = Math.min(pageHeight - margin * 2, remainingHeight)
      pdf.addImage(pageImageData, 'PNG', margin, margin, usableWidth, currentPageHeight)

      remainingHeight -= pageHeight - margin * 2
      sourceY += pagePixelHeight

      if (remainingHeight > 0) {
        pdf.addPage()
      }
    }
  }

  pdf.save(fileName)
}

function ReceiptField({ label, value, strong = false }) {
  return (
    <div className="receipt-field">
      <span>{label}</span>
      <strong className={strong ? 'is-strong' : ''}>{value || '-'}</strong>
    </div>
  )
}

export default function ReceiptPdfBridge() {
  const receiptRef = useRef(null)
  const [status, setStatus] = useState('preparing')
  const payload = useMemo(() => parseReceiptPayload(), [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!payload || !receiptRef.current) {
        setStatus('invalid')
        return
      }

      try {
        await exportReceiptPdf(receiptRef.current, `${payload.receiptNumber || 'receipt'}.pdf`)
        if (!cancelled) setStatus('done')
      } catch (error) {
        console.error('QR 영수증 PDF 다운로드 실패', error)
        if (!cancelled) setStatus('error')
      }
    }

    const timer = window.setTimeout(run, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [payload])

  if (!payload) {
    return (
      <div className="receipt-bridge-page">
        <div className="receipt-bridge-card">
          <h1>영수증 정보를 확인할 수 없습니다.</h1>
          <p>다시 QR을 생성해서 시도해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="receipt-bridge-page">
      <div className="receipt-bridge-card">
        <p className="receipt-bridge-eyebrow">TRANSACTION RECEIPT</p>
        <h1>영수증 PDF 다운로드</h1>
        <p className="receipt-bridge-status">
          {status === 'preparing' && 'PDF를 준비하고 있습니다...'}
          {status === 'done' && '다운로드가 시작되었습니다.'}
          {status === 'error' && '다운로드에 실패했습니다. 다시 시도해주세요.'}
          {status === 'invalid' && '잘못된 영수증 정보입니다.'}
        </p>

        <div className="receipt-modal__content receipt-bridge-preview" ref={receiptRef}>
          <div className="receipt-modal__header">
            <p className="receipt-modal__eyebrow">TRANSACTION RECEIPT</p>
            <h2>영수증</h2>
            <p className="receipt-modal__sub">거래 상세 내역을 확인하세요.</p>
          </div>

          <div className="receipt-summary-card receipt-summary-card--shipper">
            <div>
              <span>영수증 번호</span>
              <strong>{payload.receiptNumber || '-'}</strong>
            </div>
            <div>
              <span>거래 일시</span>
              <strong>{formatDate(payload.createdAt)}</strong>
            </div>
          </div>

          <div className="receipt-grid">
            <ReceiptField label="화물명" value={payload.shipmentTitle} strong />
            <ReceiptField label="거래 유형" value={transactionTypeText(payload.transactionType)} />
            <ReceiptField label="출발지" value={payload.originAddress} />
            <ReceiptField label="도착지" value={payload.destinationAddress} />
            <ReceiptField label="화주" value={payload.shipperName} />
            <ReceiptField label="차주" value={payload.driverName} />
            <ReceiptField label="거래액" value={formatCurrency(payload.grossAmount)} />
            <ReceiptField label="수수료" value={formatCurrency(payload.feeAmount)} />
            <ReceiptField label="최종 반영액" value={formatCurrency(payload.netAmount)} strong />
            <ReceiptField label="설명" value={payload.description} />
          </div>
        </div>
      </div>
    </div>
  )
}
