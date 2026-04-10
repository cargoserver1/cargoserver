package com.logistics.app.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class InteractionDtos {

    @Data
    @Builder
    public static class PeerUserRow {
        private Long id;
        private String email;
        private String name;
        private String companyName;
        private String vehicleType;
        private String role;
        private Double averageRating;
        private Long ratingCount;
        private boolean blocked;
    }

    @Data
    @Builder
    public static class BlockToggleResponse {
        private boolean blocked;
    }

    @Data
    @Builder
    public static class NotificationRow {
        private Long id;
        private String type;
        private String title;
        private String message;
        private boolean isRead;
        private String linkKey;
        private Long linkId;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class NotificationSummary {
        private long unreadCount;
        private List<NotificationRow> items;
    }
}
