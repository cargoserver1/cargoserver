package com.logistics.app.service;

import com.logistics.app.dto.UserDtos;
import com.logistics.app.entity.Rating;
import com.logistics.app.entity.ShipmentStatus;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.entity.UserStatus;
import com.logistics.app.repository.RatingRepository;
import com.logistics.app.repository.ShipmentRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final ShipmentRepository shipmentRepository;
    private final Path uploadRootPath;

    public UserService(UserRepository userRepository, RatingRepository ratingRepository, ShipmentRepository shipmentRepository,
                       @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.userRepository = userRepository;
        this.ratingRepository = ratingRepository;
        this.shipmentRepository = shipmentRepository;
        this.uploadRootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }


    public UserDtos.ProfileImageUploadResponse uploadProfileImage(User user, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지 파일을 선택해 주세요.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }

        String originalFilename = file.getOriginalFilename() == null ? "profile-image" : file.getOriginalFilename();
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path userDir = uploadRootPath.resolve(Paths.get("profile-images", String.valueOf(user.getId()))).normalize();

        try {
            Files.createDirectories(userDir);
            Path destination = userDir.resolve(storedFileName).normalize();
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("프로필 사진 저장 중 오류가 발생했습니다.", e);
        }

        return UserDtos.ProfileImageUploadResponse.builder()
                .imageUrl("/uploads/profile-images/" + user.getId() + "/" + storedFileName)
                .originalFilename(originalFilename)
                .build();
    }

    @Transactional(readOnly = true)
    public UserDtos.ProfileResponse getMyProfile(User user) {
        return toProfile(user);
    }

    public UserDtos.ProfileResponse updateMyProfile(User user, UserDtos.UpdateProfileRequest request) {
        user.setBio(request.getBio());
        user.setProfileImageUrl(request.getProfileImageUrl());
        user.setPaymentMethod(request.getPaymentMethod());
        user.setContactEmail(request.getContactEmail());
        user.setContactPhone(request.getContactPhone());
        if (user.getRole() == UserRole.DRIVER) {
            user.setVehicleType(request.getVehicleType());
        }
        user.setProfileCompleted(true);
        return toProfile(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserDtos.PublicUserListItem> searchPublicUsers(String role, String keyword, Long excludeUserId) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();

        return userRepository.findByRoleAndStatusOrderByCreatedAtDesc(userRole, UserStatus.ACTIVE).stream()
                .filter(user -> user.getTradingBlockedUntil() == null || user.getTradingBlockedUntil().isBefore(java.time.LocalDateTime.now()))
                .filter(user -> excludeUserId == null || !user.getId().equals(excludeUserId))
                .filter(user -> normalizedKeyword.isBlank()
                        || (user.getName() != null && user.getName().toLowerCase().contains(normalizedKeyword)))
                .map(this::toPublicUserListItem)
                .toList();
    }
    
    private UserDtos.PublicUserListItem toPublicUserListItem(User user) {
        return UserDtos.PublicUserListItem.builder()
                .id(user.getId())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .contactEmail(user.getContactEmail())
                .contactPhone(user.getContactPhone())
                .averageRating(0.0)
                .ratingCount(0L)
                .completedCount(0L)
                .penaltyScore30d(user.getPenaltyScore30d())
                .cancelRate(user.getCancelRate())
                .matchingBlockedUntil(user.getMatchingBlockedUntil())
                .tradingBlockedUntil(user.getTradingBlockedUntil())
                .highCancelBadge(Boolean.TRUE.equals(user.getHighCancelBadge()))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDtos.PublicProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return toPublicProfile(user);
    }

    public UserDtos.PublicProfileResponse toPublicProfile(User user) {
        List<Rating> ratings = ratingRepository.findByToUserOrderByCreatedAtDesc(user);
        double baseAverage = ratings.isEmpty() ? 0d : ratings.stream().mapToInt(Rating::getScore).average().orElse(0d);
        double penaltyDelta = user.getPenaltyRatingDelta() == null ? 0d : user.getPenaltyRatingDelta();
        double average = Math.max(0d, Math.round((baseAverage - penaltyDelta) * 10.0) / 10.0);
        long completedCount = 0L;
        if (user.getRole() != null) {
            switch (user.getRole()) {
                case SHIPPER -> completedCount = shipmentRepository.findByShipper(user).stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count();
                case DRIVER -> completedCount = shipmentRepository.findByAssignedDriver(user).stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count();
                default -> completedCount = 0L;
            }
        }
        return UserDtos.PublicProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .contactEmail(user.getContactEmail())
                .contactPhone(user.getContactPhone())
                .averageRating(average)
                .ratingCount((long) ratings.size())
                .completedCount(completedCount)
                .penaltyScore30d(user.getPenaltyScore30d())
                .cancelRate(user.getCancelRate())
                .matchingBlockedUntil(user.getMatchingBlockedUntil())
                .tradingBlockedUntil(user.getTradingBlockedUntil())
                .highCancelBadge(Boolean.TRUE.equals(user.getHighCancelBadge()))
                .build();
    }

    private UserDtos.ProfileResponse toProfile(User user) {
        UserDtos.PublicProfileResponse publicProfile = toPublicProfile(user);
        return UserDtos.ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .phone(user.getPhone())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .paymentMethod(user.getPaymentMethod())
                .contactEmail(user.getContactEmail())
                .contactPhone(user.getContactPhone())
                .profileCompleted(Boolean.TRUE.equals(user.getProfileCompleted()))
                .averageRating(publicProfile.getAverageRating())
                .ratingCount(publicProfile.getRatingCount())
                .completedCount(publicProfile.getCompletedCount())
                .penaltyScore30d(user.getPenaltyScore30d())
                .cancelRate(user.getCancelRate())
                .matchingBlockedUntil(user.getMatchingBlockedUntil())
                .tradingBlockedUntil(user.getTradingBlockedUntil())
                .highCancelBadge(Boolean.TRUE.equals(user.getHighCancelBadge()))
                .build();
    }
}
