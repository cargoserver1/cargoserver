package com.logistics.app.dto;

import com.logistics.app.entity.ShipmentStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class PublicDtos {

    @Data
    @Builder
    public static class PublicOverviewResponse {
        private long totalShippers;
        private long totalDrivers;
        private long totalShipments;
        private long liveShipments;
        private long biddingShipments;
        private long completedShipments;
        private List<PublicShipmentCard> liveBoard;
        private List<NoticeResponse> notices;
        private List<FaqResponse> faqs;
    }

    @Data
    @Builder
    public static class PublicShipmentCard {
        private Long id;
        private String title;
        private String cargoType;
        private Double weightKg;
        private ShipmentStatus status;
        private String originSummary;
        private String destinationSummary;
        private String currentLocationSummary;
        private Integer estimatedMinutes;
        private Double estimatedDistanceKm;
        private Integer bestOfferPrice;
        private Integer offerCount;
        private String assignedDriverName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    public static class NoticeResponse {
        private Long id;
        private String category;
        private String title;
        private String summary;
        private boolean pinned;
        private LocalDateTime publishedAt;
    }

    @Data
    @Builder
    public static class FaqResponse {
        private Long id;
        private String category;
        private String question;
        private String answer;
        private int sortOrder;
    }


    @Data
    @Builder
    public static class RoutePoint {
        private double lat;
        private double lng;
    }

    @Data
    @Builder
    public static class DrivingRouteResponse {
        private List<RoutePoint> routeCoords;
        private Integer totalDistanceMeter;
        private Integer totalTimeSecond;
    }

    @Data
    public static class CreateInquiryRequest {
        @NotBlank private String companyName;
        @NotBlank private String contactName;
        @Email @NotBlank private String email;
        @NotBlank private String phone;
        @NotBlank private String inquiryType;
        @NotBlank private String message;
    }

    @Data
    @Builder
    public static class InquiryResponse {
        private Long id;
        private String companyName;
        private String contactName;
        private String inquiryType;
        private String status;
        private LocalDateTime createdAt;
    }
}
