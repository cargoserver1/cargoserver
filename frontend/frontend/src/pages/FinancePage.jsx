import { useEffect } from 'react';
import ReceiptModal from '../components/ReceiptModal';
import { useLogisticsController } from '../hooks/useLogisticsController';

export default function FinancePage() {
  const {
    financeSummary,
    financeTransactions,
    loadFinance,

    // 🔥 영수증 관련
    receipt,
    receiptOpen,
    openReceipt,
    closeReceipt,
  } = useLogisticsController();

  useEffect(() => {
    loadFinance();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1>💰 정산 / 지출 내역</h1>

      {/* ✅ 요약 */}
      <div style={{ marginBottom: '20px' }}>
        <h2>요약</h2>
        <p>총 수익: {financeSummary?.totalIncome || 0}원</p>
        <p>총 지출: {financeSummary?.totalExpense || 0}원</p>
      </div>

      {/* ✅ 거래 리스트 */}
      <div>
        <h2>지출 내역</h2>

        {financeTransactions?.length === 0 && <p>내역 없음</p>}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {financeTransactions?.map((item) => (
            <li
              key={item.id}
              onClick={() => openReceipt(item.shipmentId)}
              style={{
                padding: '12px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div><b>{item.title}</b></div>
              <div>{item.amount}원</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                클릭하면 영수증 보기
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ 영수증 팝업 */}
      {receiptOpen && (
        <ReceiptModal receipt={receipt} onClose={closeReceipt} />
      )}
    </div>
  );
}