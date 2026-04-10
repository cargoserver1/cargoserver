import { useEffect, useMemo, useRef, useState } from "react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import QRCode from "qrcode"
import { formatCurrency, formatDate, transactionTypeText } from "../../utils/formatters"
import "./ReceiptModal.css"

function ReceiptField({ label, value, strong = false }) {
  return (
    <div className="receipt-field">
      <span>{label}</span>
      <strong className={strong ? 'is-strong' : ''}>{value || '-'}</strong>
    </div>
  )
}

function SimpleBarcode({ value = '000000' }) {
  const bars = useMemo(() => {
    const safeValue = String(value || '000000')
    const patterns = {
      '0': '101001101101',
      '1': '110100101011',
      '2': '101100101011',
      '3': '110110010101',
      '4': '101001101011',
      '5': '110100110101',
      '6': '101100110101',
      '7': '101001011011',
      '8': '110100101101',
      '9': '101100101101',
      A: '110101001011',
      B: '101101001011',
      C: '110110100101',
      D: '101011001011',
      E: '110101100101',
      F: '101101100101',
      G: '101010011011',
      H: '110101001101',
      I: '101101001101',
      J: '101011001101',
      K: '110101010011',
      L: '101101010011',
      M: '110110101001',
      N: '101011010011',
      O: '110101101001',
      P: '101101101001',
      Q: '101010110011',
      R: '110101011001',
      S: '101101011001',
      T: '101011011001',
      U: '110010101011',
      V: '100110101011',
      W: '110011010101',
      X: '100101101011',
      Y: '110010110101',
      Z: '100110110101',
      '-': '100101011011',
      '.': '110010101101',
      ' ': '100110101101',
      '$': '100100100101',
      '/': '100100101001',
      '+': '100101001001',
      '%': '101001001001',
      '*': '100101101101',
    }

    const encoded = `*${safeValue.toUpperCase().replace(/[^0-9A-Z\-\.\ $\/\+%]/g, '')}*`
    return encoded
      .split('')
      .map((char) => patterns[char] || patterns['0'])
      .join('0')
      .split('')
      .map((bit, index) => ({
        key: `${charKey(encoded, index)}-${index}`,
        active: bit === '1',
      }))
  }, [value])

  return (
    <div className="receipt-barcode" aria-label="영수증 바코드">
      <svg width="100%" height="72" viewBox={`0 0 ${bars.length * 2} 72`} preserveAspectRatio="none" role="img">
        <rect x="0" y="0" width={bars.length * 2} height="72" fill="#fff" />
        {bars.map((bar, index) =>
          bar.active ? <rect key={bar.key} x={index * 2} y="0" width="2" height="58" fill="#111" /> : null,
        )}
      </svg>
      <p className="receipt-barcode__label">{value || '000000'}</p>
    </div>
  )
}

function charKey(text, index) {
  return text[Math.floor(index / 13)] || 'b'
}

async function exportReceiptPdf(element, fileName) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    ignoreElements: (node) => Boolean(node?.dataset?.pdfIgnore),
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

function buildReceiptQrUrl(data) {
  if (typeof window === 'undefined' || !data) return ''

  const receiptPayload = {
    receiptNumber: data.receiptNumber,
    createdAt: data.createdAt,
    shipmentTitle: data.shipmentTitle,
    transactionType: data.transactionType,
    originAddress: data.originAddress,
    destinationAddress: data.destinationAddress,
    shipperName: data.shipperName,
    driverName: data.driverName,
    grossAmount: data.grossAmount,
    feeAmount: data.feeAmount,
    netAmount: data.netAmount,
    description: data.description,
  }

  const json = JSON.stringify(receiptPayload)
  const base64 = window.btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  const url = new URL(window.location.href)
  url.searchParams.set('receiptPdf', base64)
  return url.toString()
}

export default function ReceiptModal({ open, data, isLoading, error, onClose, role = "SHIPPER" }) {
  const receiptContentRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrImage, setQrImage] = useState('')

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (qrOpen) {
          setQrOpen(false)
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose, qrOpen])

  useEffect(() => {
    if (!qrOpen || !data || isLoading || error) return

    let cancelled = false

    const run = async () => {
      try {
        const qrUrl = buildReceiptQrUrl(data)
        const url = await QRCode.toDataURL(qrUrl, {
          width: 240,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        })

        if (!cancelled) {
          setQrImage(url)
        }
      } catch (qrError) {
        console.error('영수증 QR 생성 실패', qrError)
        if (!cancelled) {
          setQrImage('')
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [qrOpen, data, isLoading, error])

  const handleDownloadPdf = async () => {
    if (!receiptContentRef.current || isLoading || error || isDownloading) return

    try {
      setIsDownloading(true)
      await exportReceiptPdf(receiptContentRef.current, `${data?.receiptNumber || 'receipt'}.pdf`)
    } catch (downloadError) {
      console.error('영수증 PDF 다운로드 실패', downloadError)
      window.alert('영수증 PDF 다운로드에 실패했습니다.')
    } finally {
      setIsDownloading(false)
    }
  }

  const toggleQrPanel = () => {
    if (isLoading || error) return
    setQrOpen((prev) => !prev)
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="receipt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="영수증 상세"
      >
        <div className="receipt-modal__content" ref={receiptContentRef}>
          <div className="receipt-modal__topbar">
            <p className="receipt-modal__eyebrow">TRANSACTION RECEIPT</p>

            <div className="receipt-modal__actions" data-pdf-ignore="true">
              <button
                type="button"
                className="receipt-modal__icon-button receipt-modal__icon-button--qr"
                onClick={toggleQrPanel}
                aria-label="QR 보기"
                title="QR 보기"
                disabled={isLoading || !!error}
              >
                QR
              </button>
              <button
                type="button"
                className="receipt-modal__icon-button"
                onClick={handleDownloadPdf}
                aria-label="PDF 다운로드"
                title="PDF 다운로드"
                disabled={isLoading || !!error || isDownloading}
              >
                ⭳
              </button>
              <button type="button" className="receipt-modal__icon-button" onClick={onClose} aria-label="닫기">
                ×
              </button>
            </div>
          </div>

          <div className="receipt-modal__header">
            <h2>영수증</h2>
            <p className="receipt-modal__sub">거래 상세 내역을 확인하세요.</p>
          </div>

          {qrOpen && !isLoading && !error && (
            <div className="receipt-modal__qr-panel" data-pdf-ignore="true">
              <div className="receipt-modal__qr-card">
                {qrImage ? <img src={qrImage} alt="영수증 QR 코드" /> : <div className="receipt-spinner" />}
                <div>
                  <strong>QR로 영수증 PDF 받기</strong>
                  <p>QR을 스캔하면 현재 영수증 PDF 다운로드 페이지가 열립니다.</p>
                  <span>같은 네트워크 또는 배포된 주소에서 열어야 정상 동작합니다.</span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="receipt-modal__state">
              <div className="receipt-spinner" />
              <p>영수증을 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="receipt-modal__state is-error">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className={`receipt-summary-card receipt-summary-card--${role === 'DRIVER' ? 'driver' : 'shipper'}`}>
                <div>
                  <span>영수증 번호</span>
                  <strong>{data?.receiptNumber || '-'}</strong>
                </div>
                <div>
                  <span>거래 일시</span>
                  <strong>{formatDate(data?.createdAt)}</strong>
                </div>
              </div>

              <div className="receipt-grid">
                <ReceiptField label="화물명" value={data?.shipmentTitle} strong />
                <ReceiptField label="거래 유형" value={transactionTypeText(data?.transactionType)} />
                <ReceiptField label="출발지" value={data?.originAddress} />
                <ReceiptField label="도착지" value={data?.destinationAddress} />
                <ReceiptField label="화주" value={data?.shipperName} />
                <ReceiptField label="차주" value={data?.driverName} />
                <ReceiptField label="거래액" value={formatCurrency(data?.grossAmount)} />
                <ReceiptField label="수수료" value={formatCurrency(data?.feeAmount)} />
                <ReceiptField label="최종 반영액" value={formatCurrency(data?.netAmount)} strong />
                <ReceiptField label="설명" value={data?.description} />
              </div>

              <SimpleBarcode value={data?.receiptNumber || '000000'} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
