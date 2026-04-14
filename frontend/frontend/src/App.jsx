import ChatFloatingButton from "./components/common/ChatFloatingButton";
import ChatInboxPanel from "./components/common/ChatInboxPanel";
import NotificationPanel from "./components/common/NotificationPanel";
import PaymentModal from "./components/common/PaymentModal";
import ChatWindowModal from "./components/common/ChatWindowModal";
import UserProfileModal from "./components/common/UserProfileModal";
import AdminConsolePage from "./features/admin/AdminConsolePage";
import MessagesPage from "./features/chat/MessagesPage";
import NotificationsPage from "./features/chat/NotificationsPage";
import QuoteListPage from "./features/public/QuoteListPage";
import QuoteRegisterPage from "./features/public/QuoteRegisterPage";
import PublicHomePage from "./features/public/PublicHomePage";
import PublicUserSearchPage from "./features/public/users/PublicUserSearchPage";
import UserConsolePage from "./features/user/UserConsolePage";
import { useLogisticsController } from "./hooks/useLogisticsController";
import DriverSignupPage from "./pages/DriverSignupForm";
import ShipperSignupPage from "./pages/ShipperSignupForm";
import TransportStatus from "./pages/TransportStatus";
import PaymentPage from "./pages/PaymentPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ReceiptPdfBridge from "./components/common/ReceiptPdfBridge";

export default function App() {
  const hasReceiptPdfQuery = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("receiptPdf");

  if (hasReceiptPdfQuery) {
    return <ReceiptPdfBridge />;
  }

  const controller = useLogisticsController();

  let page = null;

  if (controller.routePage === "payment") {
    page = <PaymentPage controller={controller} />;
  } else if (controller.dashboardTab === "quotes") {
    page = <QuoteListPage controller={controller} />;
  } else if (controller.routePage === "register") {
    page = <QuoteRegisterPage controller={controller} />;
  } else if (controller.dashboardTab === "quoteRegister") {
    page = <QuoteRegisterPage controller={controller} />;
  } else if (controller.routePage === "status") {
    page = <TransportStatus controller={controller} />;
  } else if (controller.routePage === "messages") {
    page = <MessagesPage controller={controller} />;
  } else if (controller.routePage === "notifications") {
    page = <NotificationsPage controller={controller} />;
  } else if (controller.routePage === "shippers") {
    page = <PublicUserSearchPage controller={controller} role="SHIPPER" />;
  } else if (controller.routePage === "drivers") {
    page = <PublicUserSearchPage controller={controller} role="DRIVER" />;
  } else if (controller.routePage === "main") {
    page = <PublicHomePage controller={controller} />;
  } else if (controller.routePage === "login") {
    page = <LoginPage controller={controller} />;
  } else if (controller.routePage === "signup") {
    page = <SignupPage controller={controller} />;
  } else if (controller.routePage === "signup-shipper") {
    page = <ShipperSignupPage controller={controller} />;
  } else if (controller.routePage === "signup-driver") {
    page = <DriverSignupPage controller={controller} />;
  } else if (controller.routePage === "forgot-password") {
    page = <ForgotPasswordPage controller={controller} />;
  } else if (controller.routePage === "dashboard") {
    page = controller.isAdmin ? <AdminConsolePage controller={controller} /> : <UserConsolePage controller={controller} />;
  } else if (controller.dashboardTab === "home") {
    page = <PublicHomePage controller={controller} />;
  } else if (controller.isAdmin) {
    page = <AdminConsolePage controller={controller} />;
  } else {
    page = <UserConsolePage controller={controller} />;
  }

  return (
    <>
      {page}
      {controller.profileModalOpen && (
        <UserProfileModal
          profile={controller.activeProfile}
          isLoggedIn={controller.isLoggedIn}
          onClose={controller.closeUserProfile}
          onOpenChat={controller.openChatWithUser}
        />
      )}
      {controller.chatModalOpen && controller.routePage !== "messages" && (
        <ChatWindowModal
          room={controller.chatRoom}
          draft={controller.chatDraft}
          setDraft={controller.setChatDraft}
          onSend={controller.handleSendChatMessage}
          onClose={controller.closeChatRoom}
          isSending={controller.chatSending}
        />
      )}
      {controller.paymentModalOpen && (
        <PaymentModal controller={controller} />
      )}
      {controller.isLoggedIn && !controller.isAdmin && (
        <>
          <ChatFloatingButton
            unreadCount={controller.unreadChatCount}
            notificationUnreadCount={controller.notificationUnreadCount}
            onChatClick={controller.openChatInbox}
            onNotificationClick={controller.openNotificationPanel}
          />
          <ChatInboxPanel
            open={controller.chatInboxOpen}
            rooms={controller.chatRooms}
            onClose={controller.closeChatInbox}
            onOpenRoom={controller.openChatRoomFromSummary}
            onOpenMessagesPage={() => {
              controller.closeChatInbox();
              controller.setChatModalOpen(false);
              controller.setRoutePage("messages");
            }}
          />

          <NotificationPanel
            open={controller.notificationPanelOpen}
            summary={controller.notificationSummary}
            onClose={controller.closeNotificationPanel}
            onMarkAllRead={controller.handleMarkAllNotificationsRead}
            onOpenLink={controller.handleOpenNotificationLink}
            onOpenNotificationsPage={controller.openNotificationsPage}
          />
        </>
      )}
    </>
  );
}