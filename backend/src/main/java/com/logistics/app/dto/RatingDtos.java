package com.logistics.app.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class RatingDtos {
    @Data
    public static class CreateRatingRequest {
        @NotNull @Min(1) @Max(5)
        private Integer score;
        private String comment;
    }

    @Data @Builder
    public static class RatingSummaryResponse {
        private Double averageScore;
        private Long totalCount;
        private List<RatingRow> recentRatings;
    }

    @Data @Builder
    public static class RatingRow {
        private Long id;
        private Long shipmentId;
        private String shipmentTitle;
        private String fromUserName;
        private String toUserName;
        private Integer score;
        private String comment;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class PendingRatingRow {
        private Long shipmentId;
        private String shipmentTitle;
        private String counterpartName;
        private String counterpartRole;
        private LocalDateTime completedAt;
        private boolean alreadyRated;
    }

    @Data @Builder
    public static class RatingDashboardResponse {
        private RatingSummaryResponse receivedSummary;
        private List<PendingRatingRow> pendingRatings;
        private List<RatingRow> givenRatings;
    }
}
