package com.logistics.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class UserNotificationDtos {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationItem {
        private Long id;
        private String type;
        private String title;
        private String message;
        private boolean isRead;
        private String linkKey;
        private Long linkId;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationSummary {
        private long unreadCount;
        private List<NotificationItem> items;
    }
}