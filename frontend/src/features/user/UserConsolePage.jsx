import ConsoleLayout from '../../components/layout/ConsoleLayout';
import UserSidebar from './components/UserSidebar';
import UserTopbar from './components/UserTopbar';
import { USER_TITLE_MAP } from './components/userConfig';
import UserBoardTab from './tabs/UserBoardTab';
import UserBookmarksTab from './tabs/UserBookmarksTab';
import UserFinanceTab from './tabs/UserFinanceTab';
import UserOverviewTab from './tabs/UserOverviewTab';
import UserPenaltyTab from './tabs/UserPenaltyTab';
import UserRatingsTab from './tabs/UserRatingsTab';
import UserRegisterDriverTab from './tabs/UserRegisterDriverTab';
import UserRegisterShipperTab from './tabs/UserRegisterShipperTab';
import TransportStatus from '../../pages/TransportStatus';

function resolveTitle(authRole, dashboardTab) {
  if (dashboardTab === 'register') {
    return authRole === 'SHIPPER'
      ? USER_TITLE_MAP.registerShipper
      : USER_TITLE_MAP.registerDriver;
  }
  return USER_TITLE_MAP[dashboardTab] || '마이페이지';
}

function resolveTabComponent(authRole, dashboardTab) {
  if (dashboardTab === 'register') {
    return authRole === 'SHIPPER'
      ? UserRegisterShipperTab
      : UserRegisterDriverTab;
  }

  const map = {
    overview: UserOverviewTab,
    board: UserBoardTab,
    finance: UserFinanceTab,
    penalty: UserPenaltyTab,
    ratings: UserRatingsTab,
    bookmarks: UserBookmarksTab,
  };

  return map[dashboardTab] || UserOverviewTab;
}

export default function UserConsolePage({ controller }) {
  if (controller.routePage === 'status') {
    return <TransportStatus controller={controller} />;
  }

  const title = resolveTitle(controller.auth.role, controller.dashboardTab);
  const ActiveTab = resolveTabComponent(
    controller.auth.role,
    controller.dashboardTab,
  );

  return (
    <ConsoleLayout
      shellClassName="user-console"
      sidebar={
        <UserSidebar
          auth={controller.auth}
          dashboardTab={controller.dashboardTab}
          setDashboardTab={controller.setDashboardTab}
          summary={controller.summary}
          logout={controller.logout}
          goToMain={() => controller.goToMainSection()}
        />
      }
      topbar={
        <UserTopbar
          auth={controller.auth}
          title={title}
          roleTheme={controller.roleTheme}
          shipmentKeyword={controller.shipmentKeyword}
          setShipmentKeyword={controller.setShipmentKeyword}
          driverBoardTag={controller.driverBoardTag}
          setDriverBoardTag={controller.setDriverBoardTag}
          shipmentFilter={controller.shipmentFilter}
          setShipmentFilter={controller.setShipmentFilter}
        />
      }
      message={controller.message}
    >
      <ActiveTab controller={controller} />
    </ConsoleLayout>
  );
}
