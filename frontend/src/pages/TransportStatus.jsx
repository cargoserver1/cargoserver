import { useEffect, useMemo, useRef, useState } from 'react'
import PublicHeader from '../features/public/components/PublicHeader'
import ShipperHeader from '../features/public/components/ShipperHeader';
import DriverHeader from '../features/public/components/DriverHeader';
import KakaoMapView from '../components/KakaoMapView'
import {
  formatCurrency,
  formatDate,
  renderStars,
  roleText,
  statusText,
} from '../utils/formatters'
import ReceiptModal from "../components/common/ReceiptModal"
import { fetchReceipt } from "../api"

const STATUS_META = {
  REQUESTED: { label: '요청 접수', short: '요청', emoji: '📝', tone: 'requested' },
  BIDDING: { label: '입찰 진행', short: '입찰중', emoji: '📦', tone: 'bidding' },
  CONFIRMED: { label: '배차 확정', short: '확정', emoji: '✅', tone: 'confirmed' },
  IN_TRANSIT: { label: '운송 중', short: '운송중', emoji: '🚚', tone: 'transit' },
  COMPLETED: { label: '거래 완료', short: '완료', emoji: '🎉', tone: 'completed' },
  CANCELLED: { label: '거래 취소', short: '취소', emoji: '❌', tone: 'cancelled' },
}

const STEP_ORDER = ['BIDDING', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED']

function getStatusMeta(status) {
  return STATUS_META[status] || { label: statusText(status), short: statusText(status), emoji: '•', tone: 'neutral' }
}

function findHistoryDate(item, targetStatus) {
  const histories = item?.histories || []
  const matched = histories.find((history) => history?.toStatus === targetStatus)
  return matched?.createdAt || null
}

function getStepDate(item, step) {
  if (!item) return null

  if (step === 'BIDDING') {
    return item.createdAt || findHistoryDate(item, 'BIDDING') || item.updatedAt
  }

  if (step === 'CONFIRMED') {
    return (
      findHistoryDate(item, 'CONFIRMED')
      || item.scheduledStartAt
      || (['CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].includes(item.status) ? item.updatedAt || item.createdAt : null)
    )
  }

  if (step === 'IN_TRANSIT') {
    return (
      item.startedAt
      || findHistoryDate(item, 'IN_TRANSIT')
      || (['IN_TRANSIT', 'COMPLETED'].includes(item.status) ? item.tracking?.lastUpdatedAt || item.estimatedArrivalAt || item.scheduledStartAt : null)
    )
  }

  if (step === 'COMPLETED') {
    return (
      item.completedAt
      || findHistoryDate(item, 'COMPLETED')
      || (item.status === 'COMPLETED' ? item.updatedAt || item.estimatedArrivalAt || item.startedAt : null)
    )
  }

  return null
}

function normalizeShipment(item, auth, bookmarks) {
  if (!item) return null
  const userId = Number(localStorage.getItem('userId') || 0)
  const isShipperMine = auth?.role === 'SHIPPER'
    ? item.shipperId === userId || !!item.isMine || item.canAccessDetail !== false
    : false
  const isDriverMine = auth?.role === 'DRIVER'
    ? !!item.assignedToMe || item.assignedDriverId === userId || item.driverId === userId || !!item.hasMyOffer || item.status === 'IN_TRANSIT' || item.status === 'COMPLETED'
    : false
  const isMine = isShipperMine || isDriverMine

  return {
    ...item,
    id: item.id,
    title: item.title,
    status: item.status,
    originAddress: item.originAddress,
    destinationAddress: item.destinationAddress,
    cargoType: item.cargoType,
    offerCount: item.offerCount || 0,
    bestOfferPrice: item.bestOfferPrice,
    assignedDriverName: item.assignedDriverName,
    assignedDriverId: item.assignedDriverId,
    shipperName: item.shipperName,
    shipperId: item.shipperId,
    tracking: item.tracking,
    estimatedMinutes: item.estimatedMinutes,
    estimatedDistanceKm: item.estimatedDistanceKm,
    scheduledStartAt: item.scheduledStartAt,
    startedAt: item.startedAt,
    completedAt: item.completedAt,
    histories: item.histories || [],
    offers: item.offers || [],
    canAccessDetail: item.canAccessDetail !== false,
    isMine,
    bookmarked: item.bookmarked || (bookmarks || []).some((bookmark) => bookmark.id === item.id),
  }
}

function normalizePublicItem(item) {
  if (!item) return null
  return {
    ...item,
    isMine: false,
    canAccessDetail: false,
    bookmarked: false,
    histories: item.histories || [],
    offers: item.offers || [],
  }
}

function isTransportMine(item, auth) {
  if (!item || !auth?.role) return false

  if (auth.role === 'SHIPPER') {
    return item.shipperId === Number(localStorage.getItem('userId') || item.shipperId || 0)
  }

  if (auth.role === 'DRIVER') {
    if (item.assignedToMe) return true
    return item.status === 'BIDDING' && !!item.hasMyOffer
  }

  return false
}


function getOverallProgressPercent(status) {
  const stepIndex = STEP_ORDER.indexOf(status)
  if (stepIndex === -1) return 0
  return (stepIndex + 1) * 25
}

function getTransitProgressPercent(item) {
  if (!item) return 0
  if (item.status === 'COMPLETED') return 100
  if (item.status !== 'IN_TRANSIT') return 0

  const directProgress = Number(item?.tracking?.progressPercent)
  if (Number.isFinite(directProgress)) {
    return Math.max(0, Math.min(100, Math.round(directProgress)))
  }

  const totalMinutes = Number(item.estimatedMinutes || 0)
  const remainingMinutes = Number(item?.tracking?.remainingMinutes)
  if (Number.isFinite(remainingMinutes) && totalMinutes > 0) {
    const raw = ((totalMinutes - remainingMinutes) / totalMinutes) * 100
    return Math.max(0, Math.min(100, Math.round(raw)))
  }

  return item.status === 'IN_TRANSIT' ? 75 : 0
}

function getTransitConnectorProgress(item) {
  if (!item || item.status !== 'IN_TRANSIT') return 0

  const totalMinutes = Number(item.estimatedMinutes || 0)
  const remainingMinutes = Number(item?.tracking?.remainingMinutes)

  if (Number.isFinite(remainingMinutes) && totalMinutes > 0) {
    const raw = ((totalMinutes - remainingMinutes) / totalMinutes) * 100
    return Math.max(12, Math.min(94, raw))
  }

  const overallPercent = Number(item?.tracking?.progressPercent)
  if (Number.isFinite(overallPercent)) {
    const raw = ((overallPercent - 55) / 45) * 100
    return Math.max(12, Math.min(94, raw))
  }

  return 58
}

function getConnectorFill(index, status, item) {
  const currentIndex = STEP_ORDER.indexOf(status)
  if (currentIndex === -1) return 0
  if (index < currentIndex) {
    if (status === 'IN_TRANSIT' && index === currentIndex) return getTransitConnectorProgress(item)
    return 100
  }
  if (status === 'IN_TRANSIT' && index === currentIndex) {
    return getTransitConnectorProgress(item)
  }
  return 0
}

function buildStepState(status, item) {
  const currentIndex = STEP_ORDER.indexOf(status)
  return STEP_ORDER.map((step, index) => {
    const meta = getStatusMeta(step)
    return {
      key: step,
      ...meta,
      isDone: currentIndex > index,
      isActive: currentIndex === index,
      isUpcoming: currentIndex < index,
      connectorFill: index < STEP_ORDER.length - 1 ? getConnectorFill(index, status, item) : 0,
      connectorAnimated: status === 'IN_TRANSIT' && index === currentIndex,
    }
  })
}

function StatCard({ label, value, accent }) {
  return (
    <div className="ts-statCard">
      <span>{label}</span>
      <strong className={accent ? `is-${accent}` : ''}>{value}</strong>
    </div>
  )
}

function TransportStatusLoading({ detail = false }) {
  return (
    <div className="transport-loadingOverlay" role="status" aria-live="polite">
      <div className="transport-loadingCard">
        <div className="transport-loadingBadge">LIVE STATUS</div>
        <div className="transport-loadingVisual" aria-hidden="true">
          <span className="transport-loadingDot transport-loadingDot--left" />
          <span className="transport-loadingTrack">
            <span className="transport-loadingTruck">🚚</span>
          </span>
          <span className="transport-loadingDot transport-loadingDot--right" />
        </div>
        <strong>{detail ? '선택한 운송 정보를 정리하고 있어요' : '운송 현황을 불러오고 있어요'}</strong>
        <p>{detail ? '지도와 단계 정보까지 준비 중입니다.' : '현재 거래, 지도, 진행 단계를 순서대로 불러오는 중입니다.'}</p>
      </div>
    </div>
  )
}

export default function TransportStatus({ controller }) {
  const {
    auth,
    isLoggedIn,
    isAdmin,
    routePage,
    dashboardTab,
    setDashboardTab,
    setRoutePage,
    shipments,
    bookmarks,
    selected,
    selectedId,
    setSelectedId,
    publicBoard,
    publicSelectedId,
    setPublicSelectedId,
    selectedPublic,
    transportLoading,
    transportDetailLoading,
    roleTheme,
    ratingsDashboard,
    completionProof,
    handleCompletionProofChange,
    handleComplete,
    handleStart,
    openCancelModal,
    handleToggleBookmark,
    message,
  } = controller

  const [tab, setTab] = useState('ALL')
  const [showDetailLoading, setShowDetailLoading] = useState(false)
  const detailLoadingStartedAtRef = useRef(0)
  const detailTransitionReadyRef = useRef(false)
  const detailTransitionKeyRef = useRef('')

  const shipmentItems = useMemo(
    () => (shipments || []).map((item) => normalizeShipment(item, auth, bookmarks)),
    [shipments, auth, bookmarks],
  )

  const publicItems = useMemo(
    () => (publicBoard || []).map(normalizePublicItem),
    [publicBoard],
  )

  useEffect(() => {
    setTab('ALL')
  }, [isLoggedIn, isAdmin])


  const sourceItems = isLoggedIn && !isAdmin ? shipmentItems : publicItems

  const visibleItems = useMemo(() => {
    if (!(isLoggedIn && !isAdmin)) return sourceItems
    return tab === 'MY'
      ? sourceItems.filter((item) => isTransportMine(item, auth))
      : sourceItems
  }, [isLoggedIn, isAdmin, sourceItems, tab, auth])

  const hasVisibleSelected = !!selectedId && visibleItems.some((item) => item.id === selectedId)
  const matchingSelected = isLoggedIn && !isAdmin && selected && selected.id === selectedId && visibleItems.some((item) => item.id === selected.id)
    ? normalizeShipment(selected, auth, bookmarks)
    : null

  const activeItem = isLoggedIn && !isAdmin
    ? (matchingSelected || visibleItems.find((item) => item.id === selectedId) || visibleItems[0] || null)
    : (selectedPublic ? normalizePublicItem(selectedPublic) : visibleItems.find((item) => item.id === publicSelectedId) || visibleItems[0] || null)

  const overallProgressPercent = getOverallProgressPercent(activeItem?.status)
  const transitProgressPercent = getTransitProgressPercent(activeItem)
  const detailPanelLoading = isLoggedIn && !isAdmin
    ? (!!selectedId && (transportDetailLoading || !matchingSelected))
    : false

  useEffect(() => {
    if (!(isLoggedIn && !isAdmin)) {
      detailTransitionReadyRef.current = false
      detailTransitionKeyRef.current = ''
      return
    }

    const nextKey = `${tab}:${activeItem?.id ?? 'none'}`

    if (!detailTransitionReadyRef.current) {
      detailTransitionReadyRef.current = true
      detailTransitionKeyRef.current = nextKey
      return
    }

    if (detailTransitionKeyRef.current === nextKey) return

    detailTransitionKeyRef.current = nextKey

    if (!activeItem) {
      setShowDetailLoading(false)
      detailLoadingStartedAtRef.current = 0
      return
    }

    detailLoadingStartedAtRef.current = Date.now()
    setShowDetailLoading(true)
  }, [tab, activeItem?.id, isLoggedIn, isAdmin])

  useEffect(() => {
    if (!(isLoggedIn && !isAdmin)) {
      setShowDetailLoading(false)
      detailLoadingStartedAtRef.current = 0
      return undefined
    }

    if (detailPanelLoading) {
      if (!showDetailLoading) {
        detailLoadingStartedAtRef.current = Date.now()
        setShowDetailLoading(true)
      }
      return undefined
    }

    if (!showDetailLoading) return undefined

    const elapsed = Date.now() - detailLoadingStartedAtRef.current
    const remaining = Math.max(0, 1900 - elapsed)
    const timeoutId = window.setTimeout(() => {
      setShowDetailLoading(false)
      detailLoadingStartedAtRef.current = 0
    }, remaining)

    return () => window.clearTimeout(timeoutId)
  }, [detailPanelLoading, isLoggedIn, isAdmin, showDetailLoading])

  useEffect(() => {
    if (isLoggedIn && !isAdmin) {
      if (!visibleItems.length) {
        if (selectedId !== null) setSelectedId(null)
        return
      }

      if (!selectedId || !visibleItems.some((item) => item.id === selectedId)) {
        setSelectedId(visibleItems[0].id)
      }
      return
    }

    if (!visibleItems.length) return

    if (!publicSelectedId || !visibleItems.some((item) => item.id === publicSelectedId)) {
      setPublicSelectedId(visibleItems[0].id)
    }
  }, [visibleItems, isLoggedIn, isAdmin, selectedId, publicSelectedId, setSelectedId, setPublicSelectedId])

  const statusMeta = getStatusMeta(activeItem?.status)
  const stepState = buildStepState(activeItem?.status, activeItem)

  const pendingRatings = ratingsDashboard?.pendingRatings || []
  const isMyTransportTrade = isTransportMine(activeItem, auth)
  const canRate = !!isMyTransportTrade && activeItem?.status === 'COMPLETED' && pendingRatings.some((item) => item.shipmentId === activeItem.id)
  const canSettle = !!isMyTransportTrade && activeItem?.status === 'COMPLETED'
  const canStart = auth.role === 'DRIVER' && !!activeItem?.assignedToMe && activeItem?.status === 'CONFIRMED'
  const canComplete = auth.role === 'DRIVER' && !!activeItem?.assignedToMe && activeItem?.status === 'IN_TRANSIT'
  const canCancel = !!isMyTransportTrade && ['BIDDING', 'CONFIRMED', 'IN_TRANSIT'].includes(activeItem?.status)

  const handleSelectItem = (item) => {
    if (isLoggedIn && !isAdmin) {
      setSelectedId(item.id)
      return
    }
    setPublicSelectedId(item.id)
  }

  const openFinance = () => {
    setRoutePage('dashboard')
    setDashboardTab('finance')
  }

  const openRatings = () => {
    setRoutePage('dashboard')
    setDashboardTab('ratings')
  }

  return (
    <div className="public-shell landing-shell transport-shell">
      {
        controller.isLoggedIn ? (
          controller.auth.role === 'DRIVER' ? (
            <DriverHeader controller={controller} />
          ) : controller.auth.role === 'SHIPPER' ? (
            <ShipperHeader controller={controller} />
          ) : (
            <PublicHeader
              isLoggedIn={controller.isLoggedIn}
              authMode={controller.authMode}
              setAuthMode={controller.setAuthMode}
              setDashboardTab={controller.setDashboardTab}
              logout={controller.logout}
              controller={controller}
            />
          )
        ) : (
          <PublicHeader
            isLoggedIn={controller.isLoggedIn}
            authMode={controller.authMode}
            setAuthMode={controller.setAuthMode}
            setDashboardTab={controller.setDashboardTab}
            logout={controller.logout}
            controller={controller}
          />
        )
      }

      <section className="transport-hero">
        <div className="transport-hero__inner">
          <div>
            <span className="transport-kicker">LIVE STATUS</span>
            <h1>운송 현황</h1>
          </div>

          <div className="transport-tabs" role="tablist" aria-label="운송 목록 필터">
            <button
              type="button"
              className={tab === 'ALL' ? 'is-active' : ''}
              onClick={() => setTab('ALL')}
            >
              전체 보기
            </button>
            <button
              type="button"
              className={tab === 'MY' ? 'is-active' : ''}
              onClick={() => setTab('MY')}
            >
              내 거래
            </button>
          </div>
        </div>
      </section>

      <section className="transport-stage">
        <div className="transport-stage__inner transport-stage__inner--status">
          <aside className="transport-listPanel surface">
            <div className="transport-listPanel__head">
              <div>
                <strong>{tab === 'MY' ? '내 거래' : '전체 기록'}</strong>
                <small>{visibleItems.length}건</small>
              </div>
              <span className="transport-listPanel__hint">5개씩 표시</span>
            </div>

            <div className="transport-listScroller">
              {visibleItems.length ? visibleItems.map((item) => {
                const meta = getStatusMeta(item.status)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={activeItem?.id === item.id ? 'transport-listCard is-active' : 'transport-listCard'}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="transport-listCard__top">
                      <span className={`transport-statusChip is-${meta.tone}`}>
                        <span>{meta.emoji}</span>
                        {meta.short}
                      </span>
                      <small>{formatDate(item.createdAt || item.scheduledStartAt || item.startedAt || item.completedAt || item.updatedAt)}</small>
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.originAddress} → {item.destinationAddress}</p>
                    <div className="transport-listCard__meta">
                      <span>{item.cargoType || '일반 화물'}</span>
                      <span>{item.tracking?.remainingMinutes ?? item.estimatedMinutes ?? '-'}분</span>
                    </div>
                  </button>
                )
              }) : (
                <div className="transport-empty surface-sub">표시할 배차가 없습니다.</div>
              )}
            </div>
          </aside>

          <div className={`transport-detailPanel surface ${showDetailLoading && activeItem ? 'is-loading' : ''}`} aria-busy={showDetailLoading && !!activeItem}>
            {showDetailLoading && activeItem ? <TransportStatusLoading detail /> : null}
            {activeItem ? (
              <>
                <div className="transport-detailHead">
                  <div>
                    <div className={`transport-statusChip is-${statusMeta.tone} is-large`}>
                      <span>{statusMeta.emoji}</span>
                      {statusMeta.label}
                    </div>
                    <h2>{activeItem.title}</h2>
                    <div className="transport-detailRoute">{activeItem.originAddress} → {activeItem.destinationAddress}</div>
                  </div>

                  <div className="transport-headActions">
                    {isLoggedIn && !isAdmin && (
                      <button
                        type="button"
                        className={activeItem.bookmarked ? 'transport-iconBtn is-active' : 'transport-iconBtn'}
                        onClick={() => handleToggleBookmark(activeItem.id)}
                      >
                        ★
                      </button>
                    )}
                    <StatCard label="ETA" value={formatDate(activeItem.tracking?.eta || activeItem.estimatedArrivalAt)} accent={statusMeta.tone} />
                    <StatCard label="남은 거리" value={`${Number(activeItem.tracking?.remainingDistanceKm ?? activeItem.estimatedDistanceKm ?? 0).toFixed(1)} km`} />
                  </div>
                </div>

                <div className="transport-mainGrid">
                  <div className="transport-mapCard">
                    {isLoggedIn && !isAdmin ? (
                      <KakaoMapView shipment={activeItem} />
                    ) : (
                      <div className="transport-mapPlaceholder">
                        <strong>공개 현황</strong>
                        <span>로그인 후 내 거래 상세 지도를 확인할 수 있습니다.</span>
                      </div>
                    )}

                    <div className="transport-statsGrid">
                      <StatCard label="남은 시간" value={`${activeItem.tracking?.remainingMinutes ?? activeItem.estimatedMinutes ?? '-'}분`} />
                      <StatCard label="전체 진행률" value={`${overallProgressPercent}%`} accent={statusMeta.tone} />
                      <StatCard label="현재 위치" value={activeItem.tracking?.roughLocation || '-'} />
                      <StatCard label="예상 요금" value={formatCurrency(activeItem.bestOfferPrice)} />
                    </div>
                  </div>

                  <div className="transport-sideStack">
                    <div className="transport-infoCard">
                      <div className="transport-cardTitle">담당 정보</div>
                      <div className="transport-infoRows">
                        <div><span>화주</span><strong>{activeItem.shipperName || '-'}</strong></div>
                        <div><span>차주</span><strong>{activeItem.assignedDriverName || '미확정'}</strong></div>
                        <div><span>입찰</span><strong>{activeItem.offerCount || 0}건</strong></div>
                        <div><span>화물</span><strong>{activeItem.cargoType || '-'}</strong></div>
                      </div>
                    </div>

                    <div className="transport-infoCard">
                      <div className="transport-cardTitle">거래 정보</div>
                      <div className="transport-infoRows">
                        <div><span>출발 예정</span><strong>{formatDate(activeItem.scheduledStartAt || activeItem.startedAt)}</strong></div>
                        <div><span>완료 시각</span><strong>{formatDate(activeItem.completedAt)}</strong></div>
                        <div><span>거리</span><strong>{Number(activeItem.estimatedDistanceKm || 0).toFixed(1)} km</strong></div>
                        <div><span>현재 상태</span><strong>{statusText(activeItem.status)}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="transport-progressCard">
                  <div className="transport-progressRail">
                    {stepState.map((step, index) => (
                      <div className="transport-progressSegment" key={step.key}>
                        <div
                          className={
                            step.isActive
                              ? 'transport-stepNode is-active'
                              : step.isDone
                                ? 'transport-stepNode is-done'
                                : 'transport-stepNode'
                          }
                        >
                          <div className="transport-stepNode__bubble">{step.emoji}</div>
                          <div className="transport-stepNode__text">
                            <strong>{step.short}</strong>
                            <small>{formatDate(getStepDate(activeItem, step.key))}</small>
                          </div>
                        </div>

                        {index < stepState.length - 1 && (
                          <div className="transport-stepConnector">
                            <span
                              className={step.connectorAnimated ? 'is-animated' : ''}
                              style={{ width: `${step.connectorFill}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="transport-actionGrid">
                  <div className="transport-actionCard">
                    <div className="transport-cardTitle">내 거래 액션</div>
                    <div className="transport-actionButtons">
                      {canStart && (
                        <button type="button" className="landing-btn landing-btn--primary" onClick={handleStart} disabled={!selected?.paid}>운행 시작</button>
                      )}
                      {canComplete && (
                        <>
                          <label className="transport-uploadBtn">
                            완료 사진
                            <input type="file" accept="image/*" onChange={handleCompletionProofChange} />
                          </label>
                          <button type="button" className="landing-btn landing-btn--primary" onClick={handleComplete}>운행 완료</button>
                        </>
                      )}
                      {canRate && (
                        <button type="button" className="landing-btn landing-btn--primary" onClick={openRatings}>별점 주기</button>
                      )}
                      {canSettle && (
                        <button type="button" className="landing-btn landing-btn--light" onClick={openFinance}>정산하기</button>
                      )}
                      {canCancel && (
                        <button type="button" className="landing-btn landing-btn--light" onClick={openCancelModal}>거래 취소</button>
                      )}
                      {!canStart && !canComplete && !canRate && !canSettle && !canCancel && (
                        <div className="transport-inlineHint">현재 선택한 거래에서 바로 실행할 작업이 없습니다.</div>
                      )}
                    </div>
                    {completionProof?.name && <small className="transport-proofName">{completionProof.name}</small>}
                  </div>

                  <div className="transport-actionCard">
                    <div className="transport-cardTitle">거래 평가</div>
                    {canRate ? (
                      <div className="transport-ratingPreview">{renderStars(5)}</div>
                    ) : (
                      <div className="transport-inlineHint">완료된 내 거래에서만 별점 등록이 가능합니다.</div>
                    )}
                  </div>
                </div>

                {message && <div className="transport-pageMessage">{message}</div>}
              </>
            ) : (
              <div className="transport-emptyHero">선택한 배차가 없습니다.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
