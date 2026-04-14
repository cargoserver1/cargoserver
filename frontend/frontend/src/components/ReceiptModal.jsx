import { useEffect, useState } from 'react'
import { fetchReceipt } from '../api'
import './ReceiptModal.css'

export default function ReceiptModal({ shipmentId, onClose }) {
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (shipmentId) {
      fetchReceipt(shipmentId).then(setReceipt)
    }
  }, [shipmentId])

  if (!receipt) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="receipt" onClick={(e) => e.stopPropagation()}>
        
        <h2>🧾 영수증</h2>

        <div className="row">
          <span>일련번호</span>
          <span>{receipt.receiptNumber}</span>
        </div>

        <div className="row">
          <span>배송명</span>
          <span>{receipt.title}</span>
        </div>

        <div className="row">
          <span>금액</span>
          <span>{receipt.amount}원</span>
        </div>

        <div className="row">
          <span>수수료</span>
          <span>{receipt.fee}원</span>
        </div>

        <div className="row total">
          <span>최종 결제</span>
          <span>{receipt.finalAmount}원</span>
        </div>

        <div className="date">
          {new Date(receipt.createdAt).toLocaleString()}
        </div>

        {/* 바코드 */}
        <div className="barcode">
          {receipt.receiptNumber.split('').map((c, i) => (
            <div key={i} className="bar" style={{ height: (c.charCodeAt(0) % 50) + 20 }} />
          ))}
        </div>

        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}