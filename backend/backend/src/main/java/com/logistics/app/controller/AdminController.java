package com.logistics.app.controller;

import com.logistics.app.dto.AdminDtos;
import com.logistics.app.dto.PublicDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AdminService;
import com.logistics.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AuthService authService;

    public AdminController(AdminService adminService, AuthService authService) {
        this.adminService = adminService;
        this.authService = authService;
    }

    @GetMapping("/dashboard")
    public AdminDtos.AdminDashboardResponse dashboard() {
        return adminService.getDashboard();
    }

    @GetMapping("/members")
    public List<AdminDtos.MemberRow> members() { return adminService.getMembers(); }

    @PatchMapping("/members/{memberId}/role")
    public AdminDtos.MemberRow updateRole(@PathVariable Long memberId, @RequestBody AdminDtos.UpdateMemberRoleRequest request, Authentication authentication) {
        return adminService.updateMemberRole(memberId, request, currentUser(authentication));
    }

    @PatchMapping("/members/{memberId}/status")
    public AdminDtos.MemberRow updateStatus(@PathVariable Long memberId, @RequestBody AdminDtos.UpdateMemberStatusRequest request, Authentication authentication) {
        return adminService.updateMemberStatus(memberId, request, currentUser(authentication));
    }

    @GetMapping("/shipments")
    public List<AdminDtos.ShipmentAdminRow> shipments() { return adminService.getShipments(); }

    @PatchMapping("/shipments/{shipmentId}/status")
    public AdminDtos.ShipmentAdminRow forceShipmentStatus(@PathVariable Long shipmentId, @RequestBody AdminDtos.ForceShipmentStatusRequest request, Authentication authentication) {
        return adminService.forceShipmentStatus(shipmentId, request, currentUser(authentication));
    }

    @GetMapping("/notices")
    public List<PublicDtos.NoticeResponse> notices() { return adminService.getNotices(); }

    @PostMapping("/notices")
    public PublicDtos.NoticeResponse createNotice(@Valid @RequestBody AdminDtos.NoticeUpsertRequest request, Authentication authentication) {
        return adminService.createNotice(request, currentUser(authentication));
    }

    @PutMapping("/notices/{noticeId}")
    public PublicDtos.NoticeResponse updateNotice(@PathVariable Long noticeId, @Valid @RequestBody AdminDtos.NoticeUpsertRequest request, Authentication authentication) {
        return adminService.updateNotice(noticeId, request, currentUser(authentication));
    }

    @DeleteMapping("/notices/{noticeId}")
    public void deleteNotice(@PathVariable Long noticeId, Authentication authentication) {
        adminService.deleteNotice(noticeId, currentUser(authentication));
    }

    @GetMapping("/faqs")
    public List<PublicDtos.FaqResponse> faqs() { return adminService.getFaqs(); }

    @PostMapping("/faqs")
    public PublicDtos.FaqResponse createFaq(@Valid @RequestBody AdminDtos.FaqUpsertRequest request, Authentication authentication) {
        return adminService.createFaq(request, currentUser(authentication));
    }

    @PutMapping("/faqs/{faqId}")
    public PublicDtos.FaqResponse updateFaq(@PathVariable Long faqId, @Valid @RequestBody AdminDtos.FaqUpsertRequest request, Authentication authentication) {
        return adminService.updateFaq(faqId, request, currentUser(authentication));
    }

    @DeleteMapping("/faqs/{faqId}")
    public void deleteFaq(@PathVariable Long faqId, Authentication authentication) {
        adminService.deleteFaq(faqId, currentUser(authentication));
    }

    @GetMapping("/inquiries")
    public List<AdminDtos.InquiryRow> inquiries() { return adminService.getInquiries(); }

    @PostMapping("/inquiries/{inquiryId}/answer")
    public AdminDtos.InquiryRow answerInquiry(@PathVariable Long inquiryId, @Valid @RequestBody AdminDtos.AnswerInquiryRequest request, Authentication authentication) {
        return adminService.answerInquiry(inquiryId, request, currentUser(authentication));
    }

    @GetMapping("/reports")
    public List<AdminDtos.ReportRow> reports() { return adminService.getReports(); }

    @GetMapping("/disputes")
    public List<AdminDtos.DisputeRow> disputes() { return adminService.getDisputes(); }

    @PostMapping("/disputes/{disputeId}/resolve")
    public AdminDtos.DisputeRow resolveDispute(@PathVariable Long disputeId, @Valid @RequestBody AdminDtos.ResolveDisputeRequest request, Authentication authentication) {
        return adminService.resolveDispute(disputeId, request, currentUser(authentication));
    }

    @GetMapping("/action-logs")
    public List<AdminDtos.ActionLogRow> actionLogs() { return adminService.getActionLogs(); }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
