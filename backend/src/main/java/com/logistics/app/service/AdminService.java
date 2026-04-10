package com.logistics.app.service;

import com.logistics.app.dto.AdminDtos;
import com.logistics.app.dto.PublicDtos;
import com.logistics.app.entity.*;
import com.logistics.app.repository.*;
import com.logistics.app.ws.ShipmentRealtimePublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final OfferRepository offerRepository;
    private final NoticeRepository noticeRepository;
    private final FaqRepository faqRepository;
    private final CustomerInquiryRepository customerInquiryRepository;
    private final InquiryAnswerRepository inquiryAnswerRepository;
    private final ReportRepository reportRepository;
    private final DisputeRepository disputeRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final ShipmentRealtimePublisher realtimePublisher;
    private final PublicService publicService;
    private final RatingRepository ratingRepository;

    public AdminService(UserRepository userRepository, ShipmentRepository shipmentRepository, OfferRepository offerRepository,
                        NoticeRepository noticeRepository, FaqRepository faqRepository,
                        CustomerInquiryRepository customerInquiryRepository, InquiryAnswerRepository inquiryAnswerRepository,
                        ReportRepository reportRepository, DisputeRepository disputeRepository,
                        AdminActionLogRepository adminActionLogRepository, StatusHistoryRepository statusHistoryRepository,
                        ShipmentRealtimePublisher realtimePublisher, PublicService publicService, RatingRepository ratingRepository) {
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
        this.offerRepository = offerRepository;
        this.noticeRepository = noticeRepository;
        this.faqRepository = faqRepository;
        this.customerInquiryRepository = customerInquiryRepository;
        this.inquiryAnswerRepository = inquiryAnswerRepository;
        this.reportRepository = reportRepository;
        this.disputeRepository = disputeRepository;
        this.adminActionLogRepository = adminActionLogRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.realtimePublisher = realtimePublisher;
        this.publicService = publicService;
        this.ratingRepository = ratingRepository;
    }

    @Transactional(readOnly = true)
    public AdminDtos.AdminDashboardResponse getDashboard() {
        return AdminDtos.AdminDashboardResponse.builder()
                .totalMembers(userRepository.count())
                .activeDrivers(userRepository.countByRole(UserRole.DRIVER))
                .activeShippers(userRepository.countByRole(UserRole.SHIPPER))
                .pendingInquiries(customerInquiryRepository.countByStatus("RECEIVED"))
                .openReports(reportRepository.countByStatus("OPEN"))
                .openDisputes(disputeRepository.countByStatus("OPEN"))
                .liveShipments(shipmentRepository.countByStatus(ShipmentStatus.CONFIRMED) + shipmentRepository.countByStatus(ShipmentStatus.IN_TRANSIT))
                .recentMembers(userRepository.findAllByOrderByCreatedAtDesc().stream().limit(6).map(this::toMemberRow).toList())
                .recentActions(adminActionLogRepository.findTop20ByOrderByCreatedAtDesc().stream().map(this::toActionRow).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.MemberRow> getMembers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toMemberRow).toList();
    }

    public AdminDtos.MemberRow updateMemberRole(Long memberId, AdminDtos.UpdateMemberRoleRequest request, User admin) {
        User member = getUser(memberId);
        member.setRole(request.getRole());
        log(admin, "MEMBER", member.getId(), "UPDATE_ROLE", member.getEmail() + " -> " + request.getRole());
        return toMemberRow(member);
    }

    public AdminDtos.MemberRow updateMemberStatus(Long memberId, AdminDtos.UpdateMemberStatusRequest request, User admin) {
        User member = getUser(memberId);
        member.setStatus(request.getStatus());
        log(admin, "MEMBER", member.getId(), "UPDATE_STATUS", member.getEmail() + " -> " + request.getStatus());
        return toMemberRow(member);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.ShipmentAdminRow> getShipments() {
        return shipmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Shipment::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toShipmentRow)
                .toList();
    }

    public AdminDtos.ShipmentAdminRow forceShipmentStatus(Long shipmentId, AdminDtos.ForceShipmentStatusRequest request, User admin) {
        Shipment shipment = shipmentRepository.findById(shipmentId).orElseThrow(() -> new RuntimeException("화물을 찾을 수 없습니다."));
        ShipmentStatus before = shipment.getStatus();
        shipment.setStatus(request.getStatus());
        statusHistoryRepository.save(StatusHistory.builder()
                .shipment(shipment)
                .fromStatus(before)
                .toStatus(request.getStatus())
                .actorEmail(admin.getEmail())
                .note(request.getNote() == null || request.getNote().isBlank() ? "관리자 상태 변경" : request.getNote())
                .build());
        log(admin, "SHIPMENT", shipment.getId(), "FORCE_STATUS", before + " -> " + request.getStatus());
        return toShipmentRow(shipment);
    }

    @Transactional(readOnly = true)
    public List<PublicDtos.NoticeResponse> getNotices() {
        return noticeRepository.findAllByOrderByPinnedDescPublishedAtDesc().stream()
                .map(n -> PublicDtos.NoticeResponse.builder().id(n.getId()).category(n.getCategory()).title(n.getTitle()).summary(n.getSummary()).pinned(n.isPinned()).publishedAt(n.getPublishedAt()).build())
                .toList();
    }

    public PublicDtos.NoticeResponse createNotice(AdminDtos.NoticeUpsertRequest request, User admin) {
        Notice notice = noticeRepository.save(Notice.builder().category(request.getCategory()).title(request.getTitle()).summary(request.getSummary()).pinned(request.isPinned()).build());
        log(admin, "NOTICE", notice.getId(), "CREATE", notice.getTitle());
        return PublicDtos.NoticeResponse.builder().id(notice.getId()).category(notice.getCategory()).title(notice.getTitle()).summary(notice.getSummary()).pinned(notice.isPinned()).publishedAt(notice.getPublishedAt()).build();
    }

    public PublicDtos.NoticeResponse updateNotice(Long noticeId, AdminDtos.NoticeUpsertRequest request, User admin) {
        Notice notice = noticeRepository.findById(noticeId).orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        notice.setCategory(request.getCategory());
        notice.setTitle(request.getTitle());
        notice.setSummary(request.getSummary());
        notice.setPinned(request.isPinned());
        log(admin, "NOTICE", notice.getId(), "UPDATE", notice.getTitle());
        return PublicDtos.NoticeResponse.builder().id(notice.getId()).category(notice.getCategory()).title(notice.getTitle()).summary(notice.getSummary()).pinned(notice.isPinned()).publishedAt(notice.getPublishedAt()).build();
    }

    public void deleteNotice(Long noticeId, User admin) {
        noticeRepository.deleteById(noticeId);
        log(admin, "NOTICE", noticeId, "DELETE", "공지 삭제");
    }

    @Transactional(readOnly = true)
    public List<PublicDtos.FaqResponse> getFaqs() {
        return faqRepository.findAllByOrderBySortOrderAsc().stream()
                .map(f -> PublicDtos.FaqResponse.builder().id(f.getId()).category(f.getCategory()).question(f.getQuestion()).answer(f.getAnswer()).sortOrder(f.getSortOrder()).build())
                .toList();
    }

    public PublicDtos.FaqResponse createFaq(AdminDtos.FaqUpsertRequest request, User admin) {
        Faq faq = faqRepository.save(Faq.builder().category(request.getCategory()).question(request.getQuestion()).answer(request.getAnswer()).sortOrder(request.getSortOrder()).build());
        log(admin, "FAQ", faq.getId(), "CREATE", faq.getQuestion());
        return PublicDtos.FaqResponse.builder().id(faq.getId()).category(faq.getCategory()).question(faq.getQuestion()).answer(faq.getAnswer()).sortOrder(faq.getSortOrder()).build();
    }

    public PublicDtos.FaqResponse updateFaq(Long faqId, AdminDtos.FaqUpsertRequest request, User admin) {
        Faq faq = faqRepository.findById(faqId).orElseThrow(() -> new RuntimeException("FAQ를 찾을 수 없습니다."));
        faq.setCategory(request.getCategory());
        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        faq.setSortOrder(request.getSortOrder());
        log(admin, "FAQ", faq.getId(), "UPDATE", faq.getQuestion());
        return PublicDtos.FaqResponse.builder().id(faq.getId()).category(faq.getCategory()).question(faq.getQuestion()).answer(faq.getAnswer()).sortOrder(faq.getSortOrder()).build();
    }

    public void deleteFaq(Long faqId, User admin) {
        faqRepository.deleteById(faqId);
        log(admin, "FAQ", faqId, "DELETE", "FAQ 삭제");
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.InquiryRow> getInquiries() {
        return customerInquiryRepository.findAllByOrderByCreatedAtDesc().stream().map(inquiry -> {
            InquiryAnswer answer = inquiryAnswerRepository.findByInquiryId(inquiry.getId()).orElse(null);
            return AdminDtos.InquiryRow.builder()
                    .id(inquiry.getId())
                    .companyName(inquiry.getCompanyName())
                    .contactName(inquiry.getContactName())
                    .email(inquiry.getEmail())
                    .phone(inquiry.getPhone())
                    .inquiryType(inquiry.getInquiryType())
                    .message(inquiry.getMessage())
                    .status(inquiry.getStatus())
                    .answerContent(answer != null ? answer.getContent() : null)
                    .answeredBy(answer != null ? answer.getAdmin().getName() : null)
                    .createdAt(inquiry.getCreatedAt())
                    .build();
        }).toList();
    }

    public AdminDtos.InquiryRow answerInquiry(Long inquiryId, AdminDtos.AnswerInquiryRequest request, User admin) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(inquiryId).orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));
        InquiryAnswer answer = inquiryAnswerRepository.findByInquiryId(inquiryId).orElse(null);
        if (answer == null) {
            answer = InquiryAnswer.builder().inquiry(inquiry).admin(admin).content(request.getContent()).build();
        } else {
            answer.setContent(request.getContent());
            answer.setAdmin(admin);
        }
        inquiry.setStatus("ANSWERED");
        inquiryAnswerRepository.save(answer);
        log(admin, "INQUIRY", inquiry.getId(), "ANSWER", inquiry.getCompanyName());
        return AdminDtos.InquiryRow.builder()
                .id(inquiry.getId()).companyName(inquiry.getCompanyName()).contactName(inquiry.getContactName())
                .email(inquiry.getEmail()).phone(inquiry.getPhone()).inquiryType(inquiry.getInquiryType())
                .message(inquiry.getMessage()).status(inquiry.getStatus()).answerContent(answer.getContent())
                .answeredBy(admin.getName()).createdAt(inquiry.getCreatedAt()).build();
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.ReportRow> getReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream().map(report -> AdminDtos.ReportRow.builder()
                .id(report.getId())
                .reporterName(report.getReporter().getName())
                .targetName(report.getTargetUser() != null ? report.getTargetUser().getName() : null)
                .shipmentTitle(report.getShipment() != null ? report.getShipment().getTitle() : null)
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build()).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.DisputeRow> getDisputes() {
        return disputeRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDisputeRow).toList();
    }

    public AdminDtos.DisputeRow resolveDispute(Long disputeId, AdminDtos.ResolveDisputeRequest request, User admin) {
        Dispute dispute = disputeRepository.findById(disputeId).orElseThrow(() -> new RuntimeException("분쟁을 찾을 수 없습니다."));
        dispute.setStatus(request.getStatus());
        dispute.setResolvedBy(admin);
        dispute.setResolvedAt(java.time.LocalDateTime.now());
        log(admin, "DISPUTE", dispute.getId(), "RESOLVE", request.getStatus());
        return toDisputeRow(dispute);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.ActionLogRow> getActionLogs() {
        return adminActionLogRepository.findTop20ByOrderByCreatedAtDesc().stream().map(this::toActionRow).toList();
    }

    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    private void log(User admin, String targetType, Long targetId, String actionType, String description) {
        adminActionLogRepository.save(AdminActionLog.builder().admin(admin).targetType(targetType).targetId(targetId).actionType(actionType).description(description).build());
    }

    private AdminDtos.MemberRow toMemberRow(User user) {
        var ratings = ratingRepository.findByToUserOrderByCreatedAtDesc(user);
        double average = ratings.stream().mapToInt(Rating::getScore).average().orElse(0);
        return AdminDtos.MemberRow.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .status(user.getStatus())
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .phone(user.getPhone())
                .averageRating(average)
                .ratingCount(ratings.size())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminDtos.ShipmentAdminRow toShipmentRow(Shipment shipment) {
        return AdminDtos.ShipmentAdminRow.builder()
                .id(shipment.getId()).title(shipment.getTitle()).status(shipment.getStatus())
                .shipperName(shipment.getShipper().getName())
                .assignedDriverName(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getName() : null)
                .originAddress(shipment.getOriginAddress()).destinationAddress(shipment.getDestinationAddress())
                .offerCount(offerRepository.findByShipment(shipment).size()).updatedAt(shipment.getUpdatedAt() != null ? shipment.getUpdatedAt() : shipment.getCreatedAt())
                .build();
    }

    private AdminDtos.DisputeRow toDisputeRow(Dispute dispute) {
        return AdminDtos.DisputeRow.builder()
                .id(dispute.getId()).shipmentTitle(dispute.getShipment().getTitle()).shipperName(dispute.getShipper().getName())
                .driverName(dispute.getDriver().getName()).reason(dispute.getReason()).detail(dispute.getDetail()).status(dispute.getStatus())
                .resolvedBy(dispute.getResolvedBy() != null ? dispute.getResolvedBy().getName() : null)
                .createdAt(dispute.getCreatedAt()).resolvedAt(dispute.getResolvedAt()).build();
    }

    private AdminDtos.ActionLogRow toActionRow(AdminActionLog log) {
        return AdminDtos.ActionLogRow.builder().id(log.getId()).adminName(log.getAdmin().getName()).targetType(log.getTargetType()).targetId(log.getTargetId()).actionType(log.getActionType()).description(log.getDescription()).createdAt(log.getCreatedAt()).build();
    }
}
