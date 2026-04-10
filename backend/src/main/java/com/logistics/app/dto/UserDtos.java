package com.logistics.app.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class UserDtos {

    @Data
    public static class UpdateProfileRequest {
        private String bio;
        private String profileImageUrl;
        private String paymentMethod;
        private String contactEmail;
        private String contactPhone;
        private String vehicleType;
    }


    @Data
    @Builder
    public static class ProfileImageUploadResponse {
        private String imageUrl;
        private String originalFilename;
    }

    @Data
    @Builder
    public static class ProfileResponse {
        private Long id;
        private String email;
        private String name;
        private String role;
        private String companyName;
        private String vehicleType;
        private String phone;
        private String bio;
        private String profileImageUrl;
        private String paymentMethod;
        private String contactEmail;
        private String contactPhone;
        private Boolean profileCompleted;
        private Double averageRating;
        private Long ratingCount;
        private Long completedCount;
        private Integer penaltyScore30d;
        private Double cancelRate;
        private LocalDateTime matchingBlockedUntil;
        private LocalDateTime tradingBlockedUntil;
        private Boolean highCancelBadge;
    }

    @Data
    @Builder
    public static class PublicProfileResponse {
        private Long id;
        private String name;
        private String role;
        private String companyName;
        private String vehicleType;
        private String bio;
        private String profileImageUrl;
        private String contactEmail;
        private String contactPhone;
        private Double averageRating;
        private Long ratingCount;
        private Long completedCount;
        private Integer penaltyScore30d;
        private Double cancelRate;
        private LocalDateTime matchingBlockedUntil;
        private LocalDateTime tradingBlockedUntil;
        private Boolean highCancelBadge;
    }

    @Data
    @Builder
    public static class PublicUserListItem {
        private Long id;
        private String name;
        private String role;
        private String companyName;
        private String vehicleType;
        private String bio;
        private String profileImageUrl;
        private String contactEmail;
        private String contactPhone;
        private Double averageRating;
        private Long ratingCount;
        private Long completedCount;
        private Integer penaltyScore30d;
        private Double cancelRate;
        private LocalDateTime matchingBlockedUntil;
        private LocalDateTime tradingBlockedUntil;
        private Boolean highCancelBadge;
    }
}
