package com.logistics.app.dto;

import com.logistics.app.entity.ShipmentStatus;
import com.logistics.app.entity.UserRole;
import com.logistics.app.entity.UserStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
@Getter
public class AdminDtos {

    @Data @Builder
    public static class AdminDashboardResponse {
        private long totalMembers;
        private long activeDrivers;
        private long activeShippers;
        private long pendingInquiries;
        private long openReports;
        private long openDisputes;
        private long liveShipments;
        private List<MemberRow> recentMembers;
        private List<ActionLogRow> recentActions;
    }

    @Data @Builder
    public static class MemberRow {
        private Long id;
        private String email;
        private String name;
        private UserRole role;
        private UserStatus status;
        private String companyName;
        private String vehicleType;
        private String phone;
        private Double averageRating;
        private long ratingCount;
        private LocalDateTime createdAt;
    }

    @Data
    public static class UpdateMemberRoleRequest {
        private UserRole role;
    }

    @Data
    public static class UpdateMemberStatusRequest {
        private UserStatus status;
    }

    @Data @Builder
    public static class ShipmentAdminRow {
        private Long id;
        private String title;
        private ShipmentStatus status;
        private String shipperName;
        private String assignedDriverName;
        private String originAddress;
        private String destinationAddress;
        private Integer offerCount;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class ForceShipmentStatusRequest {
        private ShipmentStatus status;
        private String note;
    }

    @Data
    public static class NoticeUpsertRequest {
        @NotBlank private String category;
        @NotBlank private String title;
        @NotBlank private String summary;
        private boolean pinned;
    }

    @Data
    public static class FaqUpsertRequest {
        @NotBlank private String category;
        @NotBlank private String question;
        @NotBlank private String answer;
        private int sortOrder;
    }

    @Data @Builder
    public static class InquiryRow {
        private Long id;
        private String companyName;
        private String contactName;
        private String email;
        private String phone;
        private String inquiryType;
        private String message;
        private String status;
        private String answerContent;
        private String answeredBy;
        private LocalDateTime createdAt;
    }

    @Data
    public static class AnswerInquiryRequest {
        @NotBlank private String content;
    }

    @Data @Builder
    public static class ReportRow {
        private Long id;
        private String reporterName;
        private String targetName;
        private String shipmentTitle;
        private String reason;
        private String description;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class DisputeRow {
        private Long id;
        private String shipmentTitle;
        private String shipperName;
        private String driverName;
        private String reason;
        private String detail;
        private String status;
        private String resolvedBy;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
    }

    @Data
    public static class ResolveDisputeRequest {
        @NotBlank private String status;
    }

    @Data @Builder
    public static class ActionLogRow {
        private Long id;
        private String adminName;
        private String targetType;
        private Long targetId;
        private String actionType;
        private String description;
        private LocalDateTime createdAt;
    }
}
