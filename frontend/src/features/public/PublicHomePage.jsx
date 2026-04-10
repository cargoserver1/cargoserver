import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import PublicBoardSection from './components/PublicBoardSection'
import PublicHeader from './components/PublicHeader'
import PublicHeroSection from './components/PublicHeroSection'
import PublicInfoSection from './components/PublicInfoSection'
import LoginPage from "../../pages/LoginPage";
import ShipperHeader from './components/ShipperHeader'
import DriverHeader from './components/DriverHeader'

import { useEffect } from 'react'

export default function PublicHomePage({ controller }) {
  useRevealOnScroll()

  useEffect(() => {
    controller.loadPublic()
  }, [])

  useEffect(() => {
    if (!controller.pendingScrollTarget || controller.routePage !== 'main') return

    const scrollId = controller.pendingScrollTarget
    const timer = window.setTimeout(() => {
      document
        .getElementById(scrollId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      controller.setPendingScrollTarget('')
    }, 80)

    return () => window.clearTimeout(timer)
  }, [controller.pendingScrollTarget, controller.routePage])

  if (!controller) return null;

  return (
    <div className="public-shell landing-shell">

      {/* 로그인 전 */}
      {!controller.isLoggedIn && (
        <PublicHeader
          isLoggedIn={controller.isLoggedIn}
          authMode={controller.authMode}
          setAuthMode={controller.setAuthMode}
          setDashboardTab={controller.setDashboardTab}
          logout={controller.logout}
          controller={controller}
        />
      )}

      {/* 화주 */}
      {controller.isLoggedIn && controller.auth.role === 'SHIPPER' && (
        <ShipperHeader controller={controller} />
      )}

      {/* 차주 */}
      {controller.isLoggedIn && controller.auth.role === 'DRIVER' && (
        <DriverHeader controller={controller} />
      )}

      {/* 관리자 */}
      {controller.isLoggedIn && controller.auth.role === 'ADMIN' && (
        <PublicHeader
          isLoggedIn={controller.isLoggedIn}
          authMode={controller.authMode}
          setAuthMode={controller.setAuthMode}
          setDashboardTab={controller.setDashboardTab}
          logout={controller.logout}
          controller={controller}
        />
      )}

      <div style={{ position: "relative" }}>
        <PublicHeroSection controller={controller} />
      </div>

      {/* 로그인 아닐 때만 아래 섹션 */}
      <>
        <PublicBoardSection controller={controller} />
        <PublicInfoSection controller={controller} />
      </>

    </div>
  )
}