package com.logistics.app.service;

import com.logistics.app.dto.RatingDtos;
import com.logistics.app.entity.Rating;
import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.ShipmentStatus;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.repository.RatingRepository;
import com.logistics.app.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RatingService {
    private final RatingRepository ratingRepository;
    private final ShipmentRepository shipmentRepository;

    public RatingDtos.RatingDashboardResponse getDashboard(User user) {
        return RatingDtos.RatingDashboardResponse.builder()
                .receivedSummary(getReceivedSummary(user))
                .pendingRatings(getPendingRatings(user))
                .givenRatings(getGivenRatings(user))
                .build();
    }

    public RatingDtos.RatingSummaryResponse getReceivedSummary(User user) {
        List<Rating> ratings = ratingRepository.findByToUserOrderByCreatedAtDesc(user);
        double avg = ratings.stream().mapToInt(Rating::getScore).average().orElse(0);
        return RatingDtos.RatingSummaryResponse.builder()
                .averageScore(Math.round(avg * 100.0) / 100.0)
                .totalCount((long) ratings.size())
                .recentRatings(ratings.stream().limit(8).map(this::toRow).toList())
                .build();
    }

    public List<RatingDtos.PendingRatingRow> getPendingRatings(User user) {
        List<Shipment> completed = shipmentRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShipmentStatus.COMPLETED)
                .filter(s -> isParticipant(s, user))
                .sorted(Comparator.comparing(Shipment::getCompletedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        return completed.stream().map(shipment -> {
            User counterpart = getCounterpart(shipment, user);
            boolean already = ratingRepository.findByShipmentAndFromUser(shipment, user).isPresent();
            return RatingDtos.PendingRatingRow.builder()
                    .shipmentId(shipment.getId())
                    .shipmentTitle(shipment.getTitle())
                    .counterpartName(counterpart != null ? counterpart.getName() : "-")
                    .counterpartRole(counterpart != null ? counterpart.getRole().name() : "-")
                    .completedAt(shipment.getCompletedAt())
                    .alreadyRated(already)
                    .build();
        }).filter(r -> !r.isAlreadyRated()).toList();
    }

    public List<RatingDtos.RatingRow> getGivenRatings(User user) {
        return ratingRepository.findAll().stream()
                .filter(r -> r.getFromUser().getId().equals(user.getId()))
                .sorted(Comparator.comparing(Rating::getCreatedAt).reversed())
                .map(this::toRow)
                .toList();
    }

    @Transactional
    public RatingDtos.RatingRow createRating(Long shipmentId, RatingDtos.CreateRatingRequest request, User user) {
        Shipment shipment = shipmentRepository.findById(shipmentId).orElseThrow(() -> new RuntimeException("화물을 찾을 수 없습니다."));
        if (shipment.getStatus() != ShipmentStatus.COMPLETED) {
            throw new RuntimeException("완료된 화물만 평가할 수 있습니다.");
        }
        if (!isParticipant(shipment, user)) {
            throw new RuntimeException("해당 화물의 당사자만 평가할 수 있습니다.");
        }
        if (ratingRepository.findByShipmentAndFromUser(shipment, user).isPresent()) {
            throw new RuntimeException("이미 평가를 등록했습니다.");
        }
        User counterpart = getCounterpart(shipment, user);
        if (counterpart == null) {
            throw new RuntimeException("평가 대상이 없습니다.");
        }
        Rating rating = Rating.builder()
                .shipment(shipment)
                .fromUser(user)
                .toUser(counterpart)
                .score(request.getScore())
                .comment(request.getComment())
                .build();
        ratingRepository.save(rating);
        return toRow(rating);
    }

    public List<RatingDtos.RatingRow> getAdminRecentRatings() {
        return ratingRepository.findTop20ByOrderByCreatedAtDesc().stream().map(this::toRow).toList();
    }

    private boolean isParticipant(Shipment shipment, User user) {
        return (shipment.getShipper() != null && shipment.getShipper().getId().equals(user.getId())) ||
                (shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(user.getId()));
    }

    private User getCounterpart(Shipment shipment, User user) {
        if (shipment.getShipper() != null && shipment.getShipper().getId().equals(user.getId())) {
            return shipment.getAssignedDriver();
        }
        if (shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(user.getId())) {
            return shipment.getShipper();
        }
        return null;
    }

    private RatingDtos.RatingRow toRow(Rating rating) {
        return RatingDtos.RatingRow.builder()
                .id(rating.getId())
                .shipmentId(rating.getShipment() != null ? rating.getShipment().getId() : null)
                .shipmentTitle(rating.getShipment() != null ? rating.getShipment().getTitle() : null)
                .fromUserName(rating.getFromUser() != null ? rating.getFromUser().getName() : null)
                .toUserName(rating.getToUser() != null ? rating.getToUser().getName() : null)
                .score(rating.getScore())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
