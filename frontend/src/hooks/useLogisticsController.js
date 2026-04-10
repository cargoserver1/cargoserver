import { useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

import {
  API_BASE_URL,
  acceptOffer,
  answerAdminInquiry,
  completeTrip,
  cancelShipment,
  createAdminFaq,
  createAdminNotice,
  createInquiry,
  createOffer,
  createShipment,
  deleteAdminFaq,
  deleteAdminNotice,
  fetchAdminActionLogs,
  fetchAdminDashboard,
  fetchAdminDisputes,
  fetchAdminFaqs,
  fetchAdminInquiries,
  fetchAdminMembers,
  fetchAdminNotices,
  fetchAdminRecentRatings,
  fetchAdminReports,
  fetchAdminShipments,
  fetchBookmarks,
  fetchFinanceSummary,
  fetchFinanceTransactions,
  payShipment,
  fetchNotifications,
  fetchAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchMyProfile,
  fetchPublicOverview,
  fetchPublicProfile,
  fetchPublicUsers,
  fetchChatRoom,
  fetchChatRooms,
  markChatRoomRead,
  sendChatMessage,
  fetchRatingsDashboard,
  fetchShipment,
  fetchShipments,
  forceShipmentStatus,
  login,
  resolveAdminDispute,
  signup,
  startTrip,
  toggleBookmark,
  updateAdminFaq,
  updateAdminNotice,
  updateMemberRole,
  updateMemberStatus,
  updateMyProfile,
  uploadMyProfileImage,
  createRating,
} from '../api';

import {
  emptyFaq,
  emptyInquiry,
  emptyNotice,
  emptyShipment,
  emptySignup,
} from '../constants/forms';

import { roleThemeMeta } from '../constants/theme';
import { buildAdminAlerts, buildUserAlerts } from '../utils/dashboard';
import { fileToDataUrl } from '../utils/formatters';

export function useLogisticsController() {
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem('token') || '',
    email: localStorage.getItem('email') || '',
    name: localStorage.getItem('name') || '',
    role: localStorage.getItem('role') || '',
    profileCompleted: localStorage.getItem('profileCompleted') === 'true',
  }));
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [message, setMessage] = useState('');
  // const [authMode, setAuthMode] = useState('login');
  const [authMode, setAuthMode] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: 'shipper@test.com',
    password: '1111',
  });
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [publicData, setPublicData] = useState({
    liveBoard: [],
    notices: [],
    faqs: [],
  });
  const [publicSelectedId, setPublicSelectedId] = useState(null);
  const [publicStatusFilter, setPublicStatusFilter] = useState('ALL');
  const [inquiryForm, setInquiryForm] = useState(emptyInquiry);

  const [publicUsers, setPublicUsers] = useState([]);
  const [publicUserKeyword, setPublicUserKeyword] = useState('');
  const [publicUserLoading, setPublicUserLoading] = useState(false);
  const [transportLoading, setTransportLoading] = useState(false);
  const [transportDetailLoading, setTransportDetailLoading] = useState(false);

  const [shipments, setShipments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [profileImageUploadError, setProfileImageUploadError] = useState('');
  const [selectedProfileImageName, setSelectedProfileImageName] = useState('');
  const [profileSaveSuccessOpen, setProfileSaveSuccessOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    profileImageUrl: '',
    paymentMethod: '',
    contactEmail: '',
    contactPhone: '',
    vehicleType: '',
  });
  const [shipmentForm, setShipmentForm] = useState(emptyShipment);
  const [offerForm, setOfferForm] = useState({ price: '', message: '' });
  const [shipmentFilter, setShipmentFilter] = useState('ALL');
  const [driverBoardTag, setDriverBoardTag] = useState('ALL');
  const [shipmentKeyword, setShipmentKeyword] = useState('');

  const [routePage, setRoutePage] = useState('main');
  const [pendingScrollTarget, setPendingScrollTarget] = useState('');

  const [activeProfile, setActiveProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [chatInboxOpen, setChatInboxOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState({ unreadCount: 0, items: [] });
  const [allNotifications, setAllNotifications] = useState([]);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalStep, setPaymentModalStep] = useState('summary');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('REGISTERED');

  const [page, setPage] = useState(0);

  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminMembers, setAdminMembers] = useState([]);
  const [adminShipments, setAdminShipments] = useState([]);
  const [adminNotices, setAdminNotices] = useState([]);
  const [adminFaqs, setAdminFaqs] = useState([]);
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [adminDisputes, setAdminDisputes] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);

  const [financeSummary, setFinanceSummary] = useState(null);
  const [financeTransactions, setFinanceTransactions] = useState([]);

  const [ratingsDashboard, setRatingsDashboard] = useState(null);
  const [adminRecentRatings, setAdminRecentRatings] = useState([]);
  const [ratingDrafts, setRatingDrafts] = useState({});

  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [faqForm, setFaqForm] = useState(emptyFaq);

  const [completionProof, setCompletionProof] = useState({
    dataUrl: '',
    name: '',
  });
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    detail: '',
  });

  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [inquiryAnswerDraft, setInquiryAnswerDraft] = useState({});

  const stompClientRef = useRef(null);
  const isLoggedIn = !!auth.token;
  const isAdmin = auth.role === 'ADMIN';
  const roleTheme = useMemo(
    () => roleThemeMeta[auth.role] || null,
    [auth.role],
  );

  const publicBoard = useMemo(() => {
    return (publicData.liveBoard || []).filter((item) => {
      return publicStatusFilter === 'ALL' || item.status === publicStatusFilter;
    });
  }, [publicData.liveBoard, publicStatusFilter]);

  //영수증 팝업
  const openReceipt = async (shipmentId) => {
    try {
      const data = await fetchReceipt(shipmentId);
      setReceipt(data);
      setReceiptOpen(true);
    } catch (err) {
      console.error(err);
      setMessage('영수증 불러오기 실패');
    }
  };

  const closeReceipt = () => {
    setReceiptOpen(false);
    setReceipt(null);
  };
  const selectedPublic = useMemo(() => {
    return (
      publicData.liveBoard?.find((item) => item.id === publicSelectedId) ||
      publicBoard[0] ||
      null
    );
  }, [publicData.liveBoard, publicSelectedId, publicBoard]);

  const filteredShipmentItems = useMemo(() => {
    return shipments.filter((item) => {
      const keyword = shipmentKeyword.trim().toLowerCase();
      const byStatus =
        shipmentFilter === 'ALL' || item.status === shipmentFilter;
      let byTag = true;

      if (auth.role === 'DRIVER') {
        if (driverBoardTag === 'BIDDING') byTag = item.status === 'BIDDING';
        if (driverBoardTag === 'MY_BIDS') byTag = item.status === 'BIDDING' && !!item.hasMyOffer;
        if (driverBoardTag === 'MY_ASSIGNED') {
          byTag = !!item.assignedToMe && item.status === 'CONFIRMED';
        }
        if (driverBoardTag === 'MY_TRANSIT') {
          byTag = !!item.assignedToMe && ['IN_TRANSIT', 'COMPLETED'].includes(item.status);
        }
      }

      const byKeyword =
        !keyword ||
        [
          item.title,
          item.cargoType,
          item.originAddress,
          item.destinationAddress,
          item.shipperName,
          item.assignedDriverName,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(keyword));

      return byStatus && byKeyword && byTag;
    });
  }, [shipments, shipmentFilter, shipmentKeyword, auth.role, driverBoardTag]);

  const totalPages = useMemo(() => {
    return filteredShipmentItems.length === 0
      ? 0
      : Math.ceil(filteredShipmentItems.length / 10);
  }, [filteredShipmentItems]);

  const filteredShipments = useMemo(() => {
    const start = page * 10;
    const end = start + 10;
    return filteredShipmentItems.slice(start, end);
  }, [filteredShipmentItems, page]);

  const summary = useMemo(
    () => ({
      total: shipments.length,
      bidding: shipments.filter((item) => item.status === 'BIDDING').length,
      live: shipments.filter(
        (item) => item.status === 'CONFIRMED' || item.status === 'IN_TRANSIT',
      ).length,
      completed: shipments.filter((item) => item.status === 'COMPLETED').length,
    }),
    [shipments],
  );

  const userAlerts = useMemo(
    () => buildUserAlerts(auth.role, shipments, selected),
    [auth.role, shipments, selected],
  );

  const adminAlerts = useMemo(
    () =>
      buildAdminAlerts(
        adminDashboard,
        adminReports,
        adminDisputes,
        adminInquiries,
      ),
    [adminDashboard, adminReports, adminDisputes, adminInquiries],
  );

  const unreadChatCount = useMemo(() => {
    return (chatRooms || []).reduce((sum, room) => sum + (room.unreadCount || 0), 0);
  }, [chatRooms]);

  const notificationUnreadCount = useMemo(() => {
    return notificationSummary?.unreadCount || 0;
  }, [notificationSummary]);

  const roleQuickActions = useMemo(() => {
    if (auth.role === 'SHIPPER') {
      return [
        {
          title: '새 화물 등록',
          desc: '등록 즉시 공개 보드와 입찰 흐름에 반영됩니다.',
          action: () => setDashboardTab('register'),
          cta: '등록 이동',
        },
        {
          title: '입찰 비교',
          desc: '입찰중 배차를 모아서 가격과 메시지를 검토합니다.',
          action: () => {
            setShipmentFilter('BIDDING');
            setDashboardTab('board');
          },
          cta: '보드 보기',
        },
        {
          title: '운행 확인',
          desc: '확정 또는 운행중 상태만 필터링해 ETA 중심으로 봅니다.',
          action: () => {
            setShipmentFilter('IN_TRANSIT');
            setDashboardTab('board');
          },
          cta: '운행 보기',
        },
      ];
    }

    return [
      {
        title: '입찰 가능한 배차',
        desc: '입찰중 상태의 배차를 바로 찾을 수 있습니다.',
        action: () => {
          setShipmentFilter('BIDDING');
          setDriverBoardTag('BIDDING');
          setDashboardTab('board');
        },
        cta: '입찰 보드',
      },
      {
        title: '확정된 운행',
        desc: '화주가 확정한 건만 운반 시작 버튼이 열립니다.',
        action: () => {
          setShipmentFilter('ALL');
          setDriverBoardTag('MY_ASSIGNED');
          setDashboardTab('board');
        },
        cta: '확정 보기',
      },
      {
        title: '주행 가이드',
        desc: '자동 주행, ETA, 완료 전환 시점을 다시 확인합니다.',
        action: () => setDashboardTab('register'),
        cta: '가이드 열기',
      },
    ];
  }, [auth.role]);

  const searchPublicUsers = async (role, keyword = publicUserKeyword) => {
    setPublicUserLoading(true);

    try {
      const data = await fetchPublicUsers(role, keyword);
      setPublicUsers(data);
      setPublicUserKeyword(keyword);
      setRoutePage(role === 'SHIPPER' ? 'shippers' : 'drivers');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '회원 검색 실패');
    } finally {
      window.setTimeout(() => {
        setPublicUserLoading(false);
      }, 280);
    }
  };

  const resetPublicUserSearch = async (role) => {
    await searchPublicUsers(role, '');
  };

  const openUserProfile = async (userId, fallbackProfile = null) => {
    if (!userId) return;

    try {
      if (fallbackProfile) {
        setActiveProfile(fallbackProfile);
        setProfileModalOpen(true);
      }

      const data = await fetchPublicProfile(userId);
      setActiveProfile(data);
      setProfileModalOpen(true);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '프로필 정보를 불러오지 못했습니다.');
    }
  };

  const closeUserProfile = () => {
    setProfileModalOpen(false);
  };

  const loadChatRooms = async () => {
    if (!isLoggedIn || isAdmin) return;

    try {
      const data = await fetchChatRooms();
      setChatRooms(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    if (!isLoggedIn || isAdmin) return

    try {
      const data = await fetchNotifications()
      const nextSummary = data || { unreadCount: 0, items: [] }
      setNotificationSummary(nextSummary)
      return nextSummary
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const openNotificationPanel = async () => {
    if (!isLoggedIn) {
      setMessage('로그인 후 알림을 확인할 수 있습니다.')
      return
    }

    try {
      await loadNotifications()
      setNotificationPanelOpen(true)
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.message || '알림을 불러오지 못했습니다.')
    }
  }

  const closeNotificationPanel = () => {
    setNotificationPanelOpen(false)
  }

  const loadAllNotifications = async () => {
    if (!isLoggedIn || isAdmin) return

    try {
      const data = await fetchAllNotifications()
      const nextItems = data || []
      setAllNotifications(nextItems)
      return nextItems
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead()

      setNotificationSummary((prev) => ({
        unreadCount: 0,
        items: (prev?.items || []).map((item) => ({
          ...item,
          isRead: true,
        })),
      }))

      setAllNotifications((prev) =>
        (prev || []).map((item) => ({
          ...item,
          isRead: true,
        })),
      )
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.message || '알림 읽음 처리 실패')
    }
  }

  const handleOpenNotificationLink = async (item, options = {}) => {
    const { keepPanelClosed = false } = options

    if (item?.id && !item.isRead) {
      try {
        await markNotificationRead(item.id)

        setNotificationSummary((prev) => {
          const nextItems = (prev?.items || []).map((notification) =>
            notification.id === item.id
              ? { ...notification, isRead: true }
              : notification,
          )

          return {
            unreadCount: nextItems.filter((notification) => !notification.isRead).length,
            items: nextItems,
          }
        })

        setAllNotifications((prev) =>
          (prev || []).map((notification) =>
            notification.id === item.id
              ? { ...notification, isRead: true }
              : notification,
          ),
        )
      } catch (err) {
        console.error(err)
      }
    }

    if (item?.linkKey === 'SHIPMENT' && item?.linkId) {
      setNotificationPanelOpen(false)
      setSelectedId(item.linkId)
      setRoutePage('dashboard')
      setDashboardTab('board')
      return
    }

    if (keepPanelClosed) {
      setNotificationPanelOpen(false)
    }
  }

  const openNotificationsPage = async () => {
    if (!isLoggedIn) {
      setMessage('로그인 후 알림을 확인할 수 있습니다.')
      return
    }

    try {
      await Promise.all([loadNotifications(), loadAllNotifications()])
      setNotificationPanelOpen(false)
      setRoutePage('notifications')
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.message || '알림을 불러오지 못했습니다.')
    }
  }

  const openChatInbox = async () => {
    if (!isLoggedIn) {
      setMessage('로그인 후 채팅을 사용할 수 있습니다.');
      return;
    }

    try {
      await loadChatRooms();
      setChatInboxOpen(true);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '채팅 목록을 불러오지 못했습니다.');
    }
  };

  const closeChatInbox = () => {
    setChatInboxOpen(false);
  };

  const openChatRoomFromSummary = async (room, options = {}) => {
    const targetUserId = room?.targetProfile?.id;
    if (!targetUserId) return;

    const { embedded = false } = options;

    try {
      const fullRoom = await fetchChatRoom(targetUserId);
      setChatRoom(fullRoom);
      setChatDraft('');
      setChatModalOpen(!embedded);
      setChatInboxOpen(false);
      await markChatRoomRead(targetUserId);
      await loadChatRooms();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '채팅방을 열지 못했습니다.');
    }
  };

  const openChatWithUser = async (profile) => {
    if (!isLoggedIn) {
      setMessage('1대1 채팅은 로그인 후 사용할 수 있습니다.');
      return;
    }

    if (!profile?.id) {
      setMessage('채팅 상대 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const room = await fetchChatRoom(profile.id);
      setChatRoom(room);
      setChatModalOpen(true);
      setProfileModalOpen(false);
      setChatInboxOpen(false);
      await markChatRoomRead(profile.id);
      await loadChatRooms();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '채팅방을 열지 못했습니다.');
    }
  };

  const closeChatRoom = () => {
    setChatModalOpen(false);
    setChatDraft('');
  };

  const reloadChatRoom = async (targetUserId) => {
    if (!targetUserId || !isLoggedIn) return;

    try {
      const room = await fetchChatRoom(targetUserId);
      setChatRoom(room);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatRoom?.targetProfile?.id) return;

    const content = chatDraft.trim();
    if (!content) return;

    try {
      setChatSending(true);
      await sendChatMessage(chatRoom.targetProfile.id, content);
      setChatDraft('');
      await reloadChatRoom(chatRoom.targetProfile.id);
      await loadChatRooms();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '메시지 전송 실패');
    } finally {
      setChatSending(false);
    }
  };

  const openPublicUserPage = async (role) => {
    setPublicUserKeyword('');
    setRoutePage(role === 'SHIPPER' ? 'shippers' : 'drivers');
    setPublicUserLoading(true);
    await searchPublicUsers(role, '');
  };

  const goToMainSection = (sectionId) => {
    setPendingScrollTarget(sectionId || '');
    setRoutePage('main');
    setDashboardTab('home');
    if (!isLoggedIn) {
      setAuthMode('signup');
    }
  };

  const openDashboard = (tab = 'overview') => {
    setRoutePage('dashboard');
    setDashboardTab(tab);
    setPendingScrollTarget('');
  };

  const syncAuth = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', data.role);
    if (data.id) localStorage.setItem('userId', String(data.id));
    localStorage.setItem('profileCompleted', String(!!data.profileCompleted));
    setAuth(data);
  };

  const logout = () => {
    localStorage.clear();
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;

    setAuth({
      token: '',
      email: '',
      name: '',
      role: '',
      profileCompleted: false,
    });

    setDashboardTab('overview');
    setSelectedId(null);
    setSelected(null);
    setDriverBoardTag('ALL');
    setShipments([]);
    setBookmarks([]);
    setAdminDashboard(null);
    setAdminMembers([]);
    setAdminShipments([]);
    setAdminNotices([]);
    setAdminFaqs([]);
    setAdminInquiries([]);
    setAdminReports([]);
    setAdminDisputes([]);
    setAdminLogs([]);
    setFinanceSummary(null);
    setFinanceTransactions([]);
    setRatingsDashboard(null);
    setAdminRecentRatings([]);
    setCompletionProof({ dataUrl: '', name: '' });
    setRoutePage('main');
    setPendingScrollTarget('');
    setActiveProfile(null);
    setProfileModalOpen(false);
    setChatRoom(null);
    setChatRooms([]);
    setChatInboxOpen(false);
    setChatDraft('');
    setChatModalOpen(false);
    setChatSending(false);
    setPage(0);
  };

  const loadPublic = async () => {
    setTransportLoading(true);
    try {
      const data = await fetchPublicOverview();
      setPublicData(data);

      if (!publicSelectedId && data.liveBoard?.length) {
        setPublicSelectedId(data.liveBoard[0].id);
      }
    } finally {
      setTransportLoading(false);
    }
  };

  const loadShipments = async () => {
    if (!isLoggedIn || isAdmin) return;

    setTransportLoading(true);
    try {
      const data = await fetchShipments(page, 10);
      const items = Array.isArray(data) ? data : (data.content || []);

      setShipments(items);

      if (!selectedId && items.length) {
        setSelectedId(items[0].id);
      }
    } finally {
      setTransportLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!isLoggedIn || isAdmin) return;
    setBookmarks(await fetchBookmarks());
  };

  const loadDetail = async (id) => {
    if (!id || !isLoggedIn || isAdmin) return null;

    setTransportDetailLoading(true);
    try {
      const data = await fetchShipment(id);
      setSelected(data);
      return data;
    } finally {
      setTransportDetailLoading(false);
    }
  };

  const loadAdmin = async () => {
    if (!isLoggedIn || !isAdmin) return;

    const [
      dashboard,
      members,
      shipmentsData,
      notices,
      faqs,
      inquiries,
      reports,
      disputes,
      logs,
    ] = await Promise.all([
      fetchAdminDashboard(),
      fetchAdminMembers(),
      fetchAdminShipments(),
      fetchAdminNotices(),
      fetchAdminFaqs(),
      fetchAdminInquiries(),
      fetchAdminReports(),
      fetchAdminDisputes(),
      fetchAdminActionLogs(),
    ]);

    setAdminDashboard(dashboard);
    setAdminMembers(members);
    setAdminShipments(shipmentsData);
    setAdminNotices(notices);
    setAdminFaqs(faqs);
    setAdminInquiries(inquiries);
    setAdminReports(reports);
    setAdminDisputes(disputes);
    setAdminLogs(logs);
  };

  const loadFinance = async () => {
    if (!isLoggedIn) return;

    const [summaryData, transactionsData] = await Promise.all([
      fetchFinanceSummary(),
      fetchFinanceTransactions(),
    ]);

    setFinanceSummary(summaryData);
    setFinanceTransactions(transactionsData);
  };

  const loadRatings = async () => {
    if (!isLoggedIn) return;

    if (isAdmin) {
      setAdminRecentRatings(await fetchAdminRecentRatings());
      return;
    }

    setRatingsDashboard(await fetchRatingsDashboard());
  };

  const loadProfile = async () => {
    if (!isLoggedIn || isAdmin) return;

    const data = await fetchMyProfile();
    setProfile(data);
    setProfileForm({
      bio: data.bio || '',
      profileImageUrl: data.profileImageUrl || '',
      paymentMethod: data.paymentMethod || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      vehicleType: data.vehicleType || '',
    });
  };

  const handleCreateRating = async (shipmentId, counterpartName) => {
    try {
      const draft = ratingDrafts[shipmentId] || { score: 5, comment: '' };
      const score = Number(draft.score || 0);

      if (score < 1 || score > 5) {
        setMessage('평점은 1점부터 5점까지 선택해 주세요.');
        return;
      }

      await createRating(shipmentId, {
        score,
        comment: (draft.comment || '').trim(),
      });

      setMessage(`${counterpartName || '상대방'}에게 평점이 등록되었습니다.`);
      setRatingDrafts((prev) => ({
        ...prev,
        [shipmentId]: { score: 5, comment: '' },
      }));

      await loadRatings();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '평가 등록 실패');
    }
  };


  const handleProfileImageFileChange = async (file) => {
    if (!file) return;

    setProfileImageUploadError('');
    setSelectedProfileImageName(file.name || '');
    setProfileImageUploading(true);

    try {
      const uploaded = await uploadMyProfileImage(file);
      setProfileForm((prev) => ({
        ...prev,
        profileImageUrl: uploaded.imageUrl || '',
      }));
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || '프로필 사진 업로드 실패';
      setProfileImageUploadError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setProfileImageUploading(false);
    }
  };

  const clearProfileImage = () => {
    setSelectedProfileImageName('');
    setProfileImageUploadError('');
    setProfileForm((prev) => ({
      ...prev,
      profileImageUrl: '',
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      setProfileSaveSuccessOpen(false);
      setMessage('');

      const payload = {
        bio: profileForm.bio || '',
        profileImageUrl: profileForm.profileImageUrl || '',
        paymentMethod: profileForm.paymentMethod || '',
        contactEmail: profileForm.contactEmail || '',
        contactPhone: profileForm.contactPhone || '',
        vehicleType: auth.role === 'DRIVER' ? (profileForm.vehicleType || '') : '',
      };

      const saved = await updateMyProfile(payload);
      setProfile(saved);
      setProfileForm({
        bio: saved.bio || '',
        profileImageUrl: saved.profileImageUrl || '',
        paymentMethod: saved.paymentMethod || '',
        contactEmail: saved.contactEmail || '',
        contactPhone: saved.contactPhone || '',
        vehicleType: saved.vehicleType || '',
      });

      const updatedAuth = {
        ...auth,
        profileCompleted: !!saved.profileCompleted,
      };

      localStorage.setItem(
        'profileCompleted',
        String(!!saved.profileCompleted),
      );
      setAuth(updatedAuth);
      setMessage('');
      setProfileSaveSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '회원정보 저장 실패');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleShipmentImagesChange = async (event) => {
    try {
      const files = Array.from(event.target.files || []).slice(0, 5);
      const converted = await Promise.all(files.map(fileToDataUrl));

      setShipmentForm((prev) => ({
        ...prev,
        cargoImageDataUrls: converted.map((item) => item.dataUrl),
        cargoImageNames: converted.map((item) => item.name),
      }));
    } catch (err) {
      console.error(err);
      setMessage('화물 사진을 읽지 못했습니다.');
    }
  };

  const handleCompletionProofChange = async (event) => {
    try {
      const file = event.target.files?.[0];

      if (!file) {
        setCompletionProof({ dataUrl: '', name: '' });
        return;
      }

      const converted = await fileToDataUrl(file);
      setCompletionProof(converted);
    } catch (err) {
      console.error(err);
      setMessage('완료 사진을 읽지 못했습니다.');
    }
  };

  useEffect(() => {
    loadPublic().catch(() => { });
  }, []);

  useEffect(() => {
    const classes = [
      'theme-public',
      'theme-shipper',
      'theme-driver',
      'theme-admin',
    ];

    document.body.classList.remove(...classes);
    const publicTheme = routePage === 'shippers'
      ? 'theme-shipper'
      : routePage === 'drivers'
        ? 'theme-driver'
        : 'theme-public';

    document.body.classList.add(
      isLoggedIn ? `theme-${auth.role.toLowerCase()}` : publicTheme,
    );

    return () => document.body.classList.remove(...classes);
  }, [isLoggedIn, auth.role, routePage]);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (isAdmin) {
      loadAdmin().catch((err) =>
        setMessage(err.response?.data?.message || '관리자 데이터 로드 실패'),
      );
      loadFinance().catch(() => { });
      loadRatings().catch(() => { });
    } else {
      loadShipments().catch((err) =>
        setMessage(err.response?.data?.message || '목록 로드 실패'),
      );
      loadBookmarks().catch(() => { });
      loadFinance().catch(() => { });
      loadRatings().catch(() => { });
      loadProfile().catch(() => { });
      loadChatRooms().catch(() => { });
      loadNotifications().catch(() => { });
      loadAllNotifications().catch(() => { });
    }
  }, [isLoggedIn, isAdmin]);

  useEffect(() => {
    if (selectedId && isLoggedIn && !isAdmin) {
      loadDetail(selectedId).catch((err) =>
        setMessage(err.response?.data?.message || '상세 로드 실패'),
      );
    }
  }, [selectedId, isLoggedIn, isAdmin]);

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 0) setPage(0);
      return;
    }

    if (page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [shipmentFilter, shipmentKeyword, driverBoardTag]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe('/topic/shipments', () => {
          loadPublic().catch(() => { });

          if (isAdmin) {
            loadAdmin().catch(() => { });
            loadFinance().catch(() => { });
            loadRatings().catch(() => { });
          } else if (isLoggedIn) {
            loadShipments().catch(() => { });
            loadBookmarks().catch(() => { });
            loadFinance().catch(() => { });
            loadRatings().catch(() => { });
            loadChatRooms().catch(() => { });
            loadNotifications().catch(() => { });
            loadAllNotifications().catch(() => { });
            if (selectedId) loadDetail(selectedId).catch(() => { });
          }
        });

        if (selectedId) {
          client.subscribe(`/topic/shipments/${selectedId}`, () => {
            if (!isAdmin && isLoggedIn && selectedId) {
              loadDetail(selectedId).catch(() => { });
            }
          });
        }
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [isLoggedIn, isAdmin, selectedId]);

  useEffect(() => {
    if (!chatModalOpen || !chatRoom?.targetProfile?.id || !isLoggedIn) return;

    const timer = setInterval(() => {
      reloadChatRoom(chatRoom.targetProfile.id);
    }, 2000);




    return () => clearInterval(timer);
  }, [chatModalOpen, chatRoom?.targetProfile?.id, isLoggedIn]);

  const handleLogin = async () => {
    try {
      const data = await login(loginForm);
      syncAuth(data);
      setDashboardTab(data.profileCompleted ? 'home' : 'overview');
      setMessage(
        data.profileCompleted
          ? '로그인되었습니다. 공개 메인 페이지에서도 역할별 기능으로 이동할 수 있습니다.'
          : '첫 로그인입니다. 선택 정보만 입력해도 되니 회원정보를 한 번 확인해 주세요.',
      );
      return true; // 로그인 성공 시 true 반환
    } catch (err) {
      setMessage(err.response?.data?.message || '로그인 실패');
      return false; // 로그인 실패 시 false 반환
    }
  };

  const handleSignup = async () => {
    try {
      const data = await signup(signupForm);
      syncAuth(data);
      setSignupForm(emptySignup);
      setDashboardTab('overview');
      setMessage(
        '회원가입이 완료되었습니다. 첫 로그인이라 회원정보 수정 페이지로 안내합니다.',
      );
    } catch (err) {
      setMessage(err.response?.data?.message || '회원가입 실패');
    }
  };

  const handleInquiry = async () => {
    try {
      await createInquiry(inquiryForm);
      setInquiryForm(emptyInquiry);
      setMessage('문의가 접수되었습니다.');
      await loadPublic();
    } catch (err) {
      setMessage(err.response?.data?.message || '문의 접수 실패');
    }
  };

  const handleCreateShipment = async () => {
    try {
      const created = await createShipment({
        ...shipmentForm,
        weightKg: Number(shipmentForm.weightKg || 0),
        originLat: Number(shipmentForm.originLat),
        originLng: Number(shipmentForm.originLng),
        destinationLat: Number(shipmentForm.destinationLat),
        destinationLng: Number(shipmentForm.destinationLng),
        scheduledStartAt: shipmentForm.scheduledStartAt,
        cargoImageDataUrls: shipmentForm.cargoImageDataUrls || [],
        cargoImageNames: shipmentForm.cargoImageNames || [],
      });

      setShipmentForm(emptyShipment);
      setDashboardTab('board');
      setSelectedId(created.id);
      setMessage('화물이 등록되었습니다.');

      await loadShipments();
    } catch (err) {
      setMessage(err.response?.data?.message || '화물 등록 실패');
    }
  };

  const handleCreateOffer = async () => {
    try {
      await createOffer(selectedId, {
        price: Number(offerForm.price),
        message: offerForm.message,
      });
      setOfferForm({ price: '', message: '' });
      setMessage('입찰 제안이 등록되었습니다.');

      await Promise.all([loadShipments(), loadDetail(selectedId)]);
    } catch (err) {
      setMessage(err.response?.data?.message || '입찰 제안 실패');
    }
  };

  const openPaymentModal = async (shipmentId = selectedId) => {
    const targetId = shipmentId || selectedId;
    if (!targetId) return;

    if (!selected || selected.id !== targetId) {
      await loadDetail(targetId);
    }

    const preferredMethod = profile?.paymentMethod?.trim() ? 'REGISTERED' : 'CARD';
    setSelectedPaymentMethod(preferredMethod);
    setPaymentModalStep('summary');
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    const preferredMethod = profile?.paymentMethod?.trim() ? 'REGISTERED' : 'CARD';
    setSelectedPaymentMethod(preferredMethod);
    setPaymentModalStep('summary');
    setPaymentModalOpen(false);
  };

  const openPaymentMethodStep = () => {
    const preferredMethod = profile?.paymentMethod?.trim() ? selectedPaymentMethod || 'REGISTERED' : selectedPaymentMethod === 'REGISTERED' ? 'CARD' : (selectedPaymentMethod || 'CARD');
    setSelectedPaymentMethod(preferredMethod);
    setPaymentModalStep('method');
  };

  const resolveSelectedPaymentMethodLabel = () => {
    if (selectedPaymentMethod === 'REGISTERED') {
      return profile?.paymentMethod?.trim() || '등록된 결제수단';
    }

    switch (selectedPaymentMethod) {
      case 'NAVER_PAY':
        return '네이버페이';
      case 'KAKAO_PAY':
        return '카카오페이';
      case 'TOSS_PAY':
        return '토스페이';
      case 'CARD':
        return '신용카드';
      case 'BANK_TRANSFER':
        return '실시간 계좌이체';
      case 'WIRE_TRANSFER':
        return '무통장 입금';
      default:
        return profile?.paymentMethod?.trim() || '등록된 결제수단';
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      const response = await acceptOffer(offerId);
      const shipmentId = response?.id || selectedId;

      if (shipmentId) {
        setSelectedId(shipmentId);
      }

      await Promise.all([loadShipments(), loadNotifications()]);
      await loadDetail(shipmentId);
      await openPaymentModal(shipmentId);
      setMessage('차주가 확정되었습니다. 결제를 진행해 주세요.');
    } catch (err) {
      setMessage(err.response?.data?.message || '차주 확정 실패');
    }
  };

  const handlePayShipment = async () => {
    try {
      if (!selectedId) return;
      setPaymentSubmitting(true);
      const response = await payShipment(selectedId, { paymentMethod: resolveSelectedPaymentMethodLabel() });
      setMessage(response?.message || '결제가 완료되었습니다.');
      await Promise.all([loadShipments(), loadDetail(selectedId), loadFinance(), loadNotifications()]);
      setPaymentModalStep('complete');
    } catch (err) {
      setMessage(err.response?.data?.message || '결제 처리 실패');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleStart = async () => {
    try {
      await startTrip(selectedId);
      setMessage('운반이 시작되었습니다.');

      await Promise.all([loadShipments(), loadDetail(selectedId)]);
    } catch (err) {
      setMessage(err.response?.data?.message || '운반 시작 실패');
    }
  };

  const handleComplete = async () => {
    try {
      if (!completionProof.dataUrl) {
        setMessage('배송 완료 사진을 먼저 등록해 주세요.');
        return;
      }

      await completeTrip(selectedId, {
        completionImageDataUrl: completionProof.dataUrl,
        completionImageName: completionProof.name,
      });
      setCompletionProof({ dataUrl: '', name: '' });

      setRoutePage('main');
      setMessage('운반이 완료되었습니다.');
      await Promise.all([loadShipments(), loadDetail(selectedId)]);
    } catch (err) {
      setMessage(err.response?.data?.message || '완료 처리 실패');
    }
  };

  const openCancelModal = () => {
    setCancelForm({ reason: '', detail: '' });
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setCancelForm({ reason: '', detail: '' });
  };

  const handleCancelShipment = async () => {
    try {
      if (!selectedId) return;
      if (!cancelForm.reason) {
        setMessage('취소 사유를 선택해 주세요.');
        return;
      }
      if (!cancelForm.detail.trim()) {
        setMessage('상세 설명을 입력해 주세요.');
        return;
      }

      setCancelSubmitting(true);
      await cancelShipment(selectedId, {
        reason: cancelForm.reason,
        detail: cancelForm.detail.trim(),
      });

      closeCancelModal();
      setMessage('거래가 취소되었습니다.');
      await Promise.all([loadShipments(), loadDetail(selectedId), loadProfile(), loadBookmarks()]);
    } catch (err) {
      setMessage(err.response?.data?.message || '거래 취소 실패');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleToggleBookmark = async (shipmentId) => {
    try {
      await toggleBookmark(shipmentId);
      await Promise.all([loadBookmarks(), loadShipments()]);

      if (selectedId === shipmentId) {
        await loadDetail(selectedId);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || '즐겨찾기 처리 실패');
    }
  };

  const handleUpdateMember = async (memberId, type, value) => {
    try {
      if (type === 'role') {
        await updateMemberRole(memberId, value);
      } else {
        await updateMemberStatus(memberId, value);
      }

      setMessage('회원 정보가 변경되었습니다.');
      await loadAdmin();
    } catch (err) {
      setMessage(err.response?.data?.message || '회원 변경 실패');
    }
  };

  const handleForceShipmentStatus = async (shipmentId, status) => {
    try {
      await forceShipmentStatus(shipmentId, status, '관리자 운영 조정');
      setMessage('화물 상태가 변경되었습니다.');
      await loadAdmin();
    } catch (err) {
      setMessage(err.response?.data?.message || '화물 상태 변경 실패');
    }
  };

  const submitNotice = async () => {
    try {
      if (editingNoticeId) {
        await updateAdminNotice(editingNoticeId, noticeForm);
      } else {
        await createAdminNotice(noticeForm);
      }

      setEditingNoticeId(null);
      setNoticeForm(emptyNotice);
      setMessage('공지사항이 저장되었습니다.');

      await Promise.all([loadAdmin(), loadPublic()]);
    } catch (err) {
      setMessage(err.response?.data?.message || '공지 저장 실패');
    }
  };

  const submitFaq = async () => {
    try {
      const payload = {
        ...faqForm,
        sortOrder: Number(faqForm.sortOrder),
      };

      if (editingFaqId) {
        await updateAdminFaq(editingFaqId, payload);
      } else {
        await createAdminFaq(payload);
      }

      setEditingFaqId(null);
      setFaqForm(emptyFaq);
      setMessage('FAQ가 저장되었습니다.');

      await Promise.all([loadAdmin(), loadPublic()]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'FAQ 저장 실패');
    }
  };

  const handleAnswerInquiry = async (id) => {
    try {
      await answerAdminInquiry(id, inquiryAnswerDraft[id] || '');
      setMessage('문의 답변이 저장되었습니다.');
      await loadAdmin();
    } catch (err) {
      setMessage(err.response?.data?.message || '문의 답변 실패');
    }
  };

  const handleResolveDispute = async (id, status) => {
    try {
      await resolveAdminDispute(id, status);
      setMessage('분쟁 상태가 변경되었습니다.');
      await loadAdmin();
    } catch (err) {
      setMessage(err.response?.data?.message || '분쟁 처리 실패');
    }
  };

  return {
    API_BASE_URL,
    auth,
    setAuth,
    page,
    setPage,
    totalPages,
    routePage,
    pendingScrollTarget,
    setPendingScrollTarget,
    setRoutePage,
    message,
    setMessage,
    authMode,
    setAuthMode,
    loginForm,
    setLoginForm,
    signupForm,
    setSignupForm,
    publicData,
    publicSelectedId,
    setPublicSelectedId,
    publicStatusFilter,
    setPublicStatusFilter,
    inquiryForm,
    setInquiryForm,
    publicUsers,
    publicUserKeyword,
    publicUserLoading,
    transportLoading,
    transportDetailLoading,
    setPublicUserKeyword,
    activeProfile,
    profileModalOpen,
    chatRoom,
    chatRooms,
    chatInboxOpen,
    chatDraft,
    setChatDraft,
    chatModalOpen,
    chatSending,
    notificationSummary,
    allNotifications,
    notificationPanelOpen,
    paymentSubmitting,
    paymentModalOpen,
    paymentModalStep,
    selectedPaymentMethod,
    unreadChatCount,
    notificationUnreadCount,
    shipments,
    bookmarks,
    selectedId,
    setSelectedId,
    selected,
    dashboardTab,
    setDashboardTab,
    profile,
    profileForm,
    setProfileForm,
    profileSaving,
    profileImageUploading,
    profileImageUploadError,
    selectedProfileImageName,
    profileSaveSuccessOpen,
    setProfileSaveSuccessOpen,
    shipmentForm,
    setShipmentForm,
    offerForm,
    setOfferForm,
    shipmentFilter,
    setShipmentFilter,
    driverBoardTag,
    setDriverBoardTag,
    shipmentKeyword,
    setShipmentKeyword,
    adminDashboard,
    adminMembers,
    adminShipments,
    adminNotices,
    adminFaqs,
    adminInquiries,
    adminReports,
    adminDisputes,
    adminLogs,
    financeSummary,
    financeTransactions,
    ratingsDashboard,
    adminRecentRatings,
    ratingDrafts,
    setRatingDrafts,
    noticeForm,
    setNoticeForm,
    faqForm,
    setFaqForm,
    completionProof,
    cancelModalOpen,
    cancelSubmitting,
    cancelForm,
    setCancelForm,
    editingNoticeId,
    setEditingNoticeId,
    editingFaqId,
    setEditingFaqId,
    inquiryAnswerDraft,
    setInquiryAnswerDraft,
    isLoggedIn,
    isAdmin,
    roleTheme,
    publicBoard,
    selectedPublic,
    filteredShipments,
    summary,
    userAlerts,
    adminAlerts,
    roleQuickActions,
    logout,
    handleLogin,
    handleSignup,
    handleInquiry,
    handleCreateShipment,
    handleCreateOffer,
    handleAcceptOffer,
    handlePayShipment,
    openPaymentModal,
    closePaymentModal,
    openPaymentMethodStep,
    setPaymentModalStep,
    setSelectedPaymentMethod,
    handleStart,
    handleComplete,
    openCancelModal,
    closeCancelModal,
    handleCancelShipment,
    handleToggleBookmark,
    searchPublicUsers,
    resetPublicUserSearch,
    openPublicUserPage,
    goToMainSection,
    openDashboard,
    openUserProfile,
    closeUserProfile,
    openChatWithUser,
    openChatInbox,
    openNotificationPanel,
    openNotificationsPage,
    closeNotificationPanel,
    handleMarkAllNotificationsRead,
    handleOpenNotificationLink,
    closeChatInbox,
    openChatRoomFromSummary,
    closeChatRoom,
    setChatModalOpen,
    handleSendChatMessage,
    reloadChatRoom,
    handleCreateRating,
    handleUpdateMember,
    handleForceShipmentStatus,
    submitNotice,
    submitFaq,
    handleAnswerInquiry,
    handleResolveDispute,
    handleSaveProfile,
    handleProfileImageFileChange,
    clearProfileImage,
    handleShipmentImagesChange,
    handleCompletionProofChange,
    loadAdmin,
    loadPublic,
    deleteAdminFaq,
    deleteAdminNotice,
    receipt,
    receiptOpen,
    openReceipt,
    closeReceipt,
  };
}