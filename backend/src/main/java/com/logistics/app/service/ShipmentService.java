package com.logistics.app.service;

import com.logistics.app.dto.ShipmentDtos;
import com.logistics.app.entity.*;
import com.logistics.app.repository.*;
import com.logistics.app.ws.ShipmentRealtimePublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OfferRepository offerRepository;
    private final LocationLogRepository locationLogRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final ShipmentBookmarkRepository shipmentBookmarkRepository;
    private final ShipmentImageRepository shipmentImageRepository;
    private final ShipmentCancelHistoryRepository shipmentCancelHistoryRepository;
    private final DisputeRepository disputeRepository;
    private final ShipmentRealtimePublisher realtimePublisher;
    private final FinanceService financeService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public ShipmentService(ShipmentRepository shipmentRepository,
                           OfferRepository offerRepository,
                           LocationLogRepository locationLogRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           ShipmentBookmarkRepository shipmentBookmarkRepository,
                           ShipmentImageRepository shipmentImageRepository,
                           ShipmentCancelHistoryRepository shipmentCancelHistoryRepository,
                           DisputeRepository disputeRepository,
                           ShipmentRealtimePublisher realtimePublisher,
                           FinanceService financeService,
                           UserRepository userRepository,
                           UserService userService,
                           NotificationService notificationService) {
        this.shipmentRepository = shipmentRepository;
        this.offerRepository = offerRepository;
        this.locationLogRepository = locationLogRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.shipmentBookmarkRepository = shipmentBookmarkRepository;
        this.shipmentImageRepository = shipmentImageRepository;
        this.shipmentCancelHistoryRepository = shipmentCancelHistoryRepository;
        this.disputeRepository = disputeRepository;
        this.realtimePublisher = realtimePublisher;
        this.financeService = financeService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public ShipmentDtos.ShipmentResponse createShipment(User shipper, ShipmentDtos.CreateShipmentRequest request) {
        if (request.getScheduledStartAt() == null) {
            throw new RuntimeException("운송 시작 예정 시각을 입력해 주세요.");
        }
        if (request.getScheduledStartAt().isBefore(LocalDateTime.now().plusMinutes(10))) {
            throw new RuntimeException("운송 시작 예정 시각은 현재보다 최소 10분 이후여야 합니다.");
        }

        int estimatedMinutes = estimateMinutes(request.getOriginLat(), request.getOriginLng(), request.getDestinationLat(), request.getDestinationLng());
        double estimatedDistanceKm = estimateDistanceKm(request.getOriginLat(), request.getOriginLng(), request.getDestinationLat(), request.getDestinationLng());

        Shipment shipment = Shipment.builder()
                .shipper(shipper)
                .title(request.getTitle())
                .cargoType(request.getCargoType())
                .weightKg(request.getWeightKg())
                .description(request.getDescription())
                .originAddress(request.getOriginAddress())
                .originLat(request.getOriginLat())
                .originLng(request.getOriginLng())
                .destinationAddress(request.getDestinationAddress())
                .destinationLat(request.getDestinationLat())
                .destinationLng(request.getDestinationLng())
                .scheduledStartAt(request.getScheduledStartAt())
                .estimatedMinutes(estimatedMinutes)
                .estimatedDistanceKm(estimatedDistanceKm)
                .status(ShipmentStatus.BIDDING)
                .build();
        shipmentRepository.save(shipment);
        saveCargoImages(shipment, request.getCargoImageDataUrls(), request.getCargoImageNames());
        logStatus(shipment, ShipmentStatus.REQUESTED, ShipmentStatus.BIDDING, shipper.getEmail(), "화물 등록");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, shipper);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public List<ShipmentDtos.ShipmentResponse> listForUser(User user) {
        return shipmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Shipment::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(shipment -> toResponse(shipment, user))
                .collect(Collectors.toList());
    }

    public List<ShipmentDtos.ShipmentResponse> listBookmarks(User user) {
        return shipmentBookmarkRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(ShipmentBookmark::getShipment)
                .map(shipment -> toResponse(shipment, user))
                .toList();
    }

    public ShipmentDtos.ShipmentResponse getShipment(Long shipmentId, User user) {
        Shipment shipment = getById(shipmentId);
        validateReadAccess(shipment, user);
        return toResponse(shipment, user);
    }

    public ShipmentDtos.OfferResponse createOffer(Long shipmentId, User driver, ShipmentDtos.CreateOfferRequest request) {
        validateTradeAvailability(driver);
        Shipment shipment = getById(shipmentId);
        if (shipment.getStatus() != ShipmentStatus.BIDDING) {
            throw new RuntimeException("입찰 가능한 상태가 아닙니다.");
        }
        if (offerRepository.existsByShipmentAndDriver(shipment, driver)) {
            throw new RuntimeException("이미 제안한 배차입니다.");
        }

        Offer offer = Offer.builder()
                .shipment(shipment)
                .driver(driver)
                .price(request.getPrice())
                .message(request.getMessage())
                .build();
        offerRepository.save(offer);
        notificationService.notifyUser(shipment.getShipper().getId(), "OFFER", "새 제안이 도착했습니다.",
                driver.getName() + "님이 " + shipment.getTitle() + " 화물에 " + String.format("%,d원", offer.getPrice()) + " 제안을 보냈습니다.", "SHIPMENT", shipment.getId());
        realtimePublisher.publishShipmentUpdated(toResponse(shipment, driver));
        return toOfferResponse(offer);
    }

    public ShipmentDtos.ShipmentResponse acceptOffer(Long offerId, User shipper) {
        validateTradeAvailability(shipper);
        Offer offer = offerRepository.findById(offerId).orElseThrow(() -> new RuntimeException("입찰 제안을 찾을 수 없습니다."));
        Shipment shipment = offer.getShipment();
        if (!shipment.getShipper().getId().equals(shipper.getId())) {
            throw new RuntimeException("본인 화물만 차주를 확정할 수 있습니다.");
        }
        if (shipment.getStatus() != ShipmentStatus.BIDDING) {
            throw new RuntimeException("입찰중인 화물만 확정할 수 있습니다.");
        }

        offerRepository.findByShipment(shipment).forEach(item -> {
            item.setStatus(item.getId().equals(offerId) ? OfferStatus.ACCEPTED : OfferStatus.REJECTED);
            offerRepository.save(item);
        });

        ShipmentStatus before = shipment.getStatus();
        shipment.setAssignedDriver(offer.getDriver());
        shipment.setAcceptedOfferId(offerId);
        shipment.setStatus(ShipmentStatus.CONFIRMED);
        shipment.setAgreedPrice(offer.getPrice());
        shipmentRepository.save(shipment);

        notificationService.notifyUser(offer.getDriver().getId(), "OFFER_ACCEPTED", "제안이 수락되었습니다.",
                shipment.getTitle() + " 의 배정이 확정되었습니다. 배차 보드에서 운송을 시작해 주세요.", "SHIPMENT", shipment.getId());
        offerRepository.findByShipment(shipment).stream()
                .filter(item -> !item.getId().equals(offerId))
                .map(Offer::getDriver)
                .distinct()
                .forEach(driverUser -> notificationService.notifyUser(driverUser.getId(), "OFFER_REJECTED", "제안이 선택되지 않았습니다.",
                        shipment.getTitle() + " 은 다른 차주가 선택되었습니다. 다른 배차를 확인해 보세요.", "SHIPMENT", shipment.getId()));

        logStatus(shipment, before, ShipmentStatus.CONFIRMED, shipper.getEmail(), "차주 확정");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, shipper);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.ShipmentResponse startTrip(Long shipmentId, User driver) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getAssignedDriver() == null || !shipment.getAssignedDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("배정된 차주만 운반을 시작할 수 있습니다.");
        }
        if (!shipment.isPaid()) {
            throw new RuntimeException("결제 완료 후에만 운반을 시작할 수 있습니다.");
        }
        ShipmentStatus before = shipment.getStatus();
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        shipment.setStartedAt(LocalDateTime.now());
        shipment.setEstimatedArrivalAt(LocalDateTime.now().plusMinutes(shipment.getEstimatedMinutes()));
        shipmentRepository.save(shipment);

        locationLogRepository.save(LocationLog.builder()
                .shipment(shipment)
                .driver(driver)
                .latitude(shipment.getOriginLat())
                .longitude(shipment.getOriginLng())
                .roughLocation("출발지 출발")
                .remainingMinutes(shipment.getEstimatedMinutes())
                .build());

        logStatus(shipment, before, ShipmentStatus.IN_TRANSIT, driver.getEmail(), "운반 시작");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, driver);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.TrackingResponse updateLocation(Long shipmentId, User driver, ShipmentDtos.LocationUpdateRequest request) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getAssignedDriver() == null || !shipment.getAssignedDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("배정된 차주만 위치를 업데이트할 수 있습니다.");
        }
        if (shipment.getStatus() != ShipmentStatus.IN_TRANSIT) {
            throw new RuntimeException("운반중 상태에서만 위치를 업데이트할 수 있습니다.");
        }

        int remainingMinutes = estimateMinutes(request.getLatitude(), request.getLongitude(), shipment.getDestinationLat(), shipment.getDestinationLng());

        LocationLog log = LocationLog.builder()
                .shipment(shipment)
                .driver(driver)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .roughLocation(request.getRoughLocation())
                .remainingMinutes(remainingMinutes)
                .build();
        locationLogRepository.save(log);

        ShipmentDtos.TrackingResponse trackingResponse = ShipmentDtos.TrackingResponse.builder()
                .remainingMinutes(remainingMinutes)
                .roughLocation(request.getRoughLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .completable(isCompletable(shipment, remainingMinutes))
                .updatedAt(log.getCreatedAt())
                .build();

        realtimePublisher.publishShipmentUpdated(toResponse(shipment, driver));
        return trackingResponse;
    }

    public ShipmentDtos.ShipmentResponse completeTrip(Long shipmentId, User driver, ShipmentDtos.CompleteShipmentRequest request) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getAssignedDriver() == null || !shipment.getAssignedDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("배정된 차주만 완료할 수 있습니다.");
        }
        int remainingMinutes = locationLogRepository.findTopByShipmentOrderByCreatedAtDesc(shipment).map(LocationLog::getRemainingMinutes).orElse(shipment.getEstimatedMinutes());
        if (!isCompletable(shipment, remainingMinutes)) {
            throw new RuntimeException("예상 도착 시간 이전에는 완료할 수 없습니다.");
        }
        if (request == null || request.getCompletionImageDataUrl() == null || request.getCompletionImageDataUrl().isBlank()) {
            throw new RuntimeException("배송 완료 사진을 등록해야 완료 처리할 수 있습니다.");
        }
        ShipmentStatus before = shipment.getStatus();
        shipment.setStatus(ShipmentStatus.COMPLETED);
        shipment.setCompletedAt(LocalDateTime.now());
        shipmentRepository.save(shipment);

        incrementCompletedCount(shipment.getShipper());
        if (shipment.getAssignedDriver() != null) {
            incrementCompletedCount(shipment.getAssignedDriver());
        }

        shipmentImageRepository.save(ShipmentImage.builder()
                .shipment(shipment)
                .type(ShipmentImageType.COMPLETION)
                .originalName(request.getCompletionImageName())
                .dataUrl(request.getCompletionImageDataUrl())
                .build());
        Offer acceptedOffer = shipment.getAcceptedOfferId() != null ? offerRepository.findById(shipment.getAcceptedOfferId()).orElse(null) : null;
        User adminUser = userRepository.findAll().stream().filter(user -> user.getRole() == UserRole.ADMIN).findFirst().orElse(null);
        financeService.settleCompletedShipment(shipment, acceptedOffer, adminUser);
        logStatus(shipment, before, ShipmentStatus.COMPLETED, driver.getEmail(), "운반 완료");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, driver);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.ShipmentResponse cancelShipment(Long shipmentId, User actor, ShipmentDtos.CancelShipmentRequest request) {
        Shipment shipment = getById(shipmentId);

        if (request == null || request.getReason() == null) {
            throw new RuntimeException("취소 사유를 선택해 주세요.");
        }
        if (request.getDetail() == null || request.getDetail().trim().isBlank()) {
            throw new RuntimeException("상세 설명을 입력해 주세요.");
        }
        if (!canCancel(shipment, actor)) {
            throw new RuntimeException("이 거래를 취소할 권한이 없습니다.");
        }
        if (shipment.getStatus() == ShipmentStatus.COMPLETED || shipment.getStatus() == ShipmentStatus.CANCELLED) {
            throw new RuntimeException("이미 종료된 거래입니다.");
        }

        ShipmentStatus before = shipment.getStatus();
        shipment.setStatus(ShipmentStatus.CANCELLED);
        shipmentRepository.save(shipment);

        int timingPenalty = calculateTimingPenalty(shipment);
        boolean disputed = isDisputedReason(request.getReason());
        int finalPenalty = disputed ? 0 : timingPenalty;

        User disputeTarget = resolveDisputeTarget(shipment, actor, request.getReason());
        String penaltyActionSummary = disputed ? "분쟁성 취소 접수" : applyPenalty(actor, finalPenalty);

        shipmentCancelHistoryRepository.save(ShipmentCancelHistory.builder()
                .shipment(shipment)
                .canceledBy(actor)
                .cancelReason(request.getReason())
                .detail(request.getDetail().trim())
                .canceledAt(LocalDateTime.now())
                .scheduledStartAt(resolveScheduledStartAt(shipment))
                .timingPenaltyScore(timingPenalty)
                .finalPenaltyScore(finalPenalty)
                .disputed(disputed)
                .disputeTargetUser(disputeTarget)
                .penaltyActionSummary(penaltyActionSummary)
                .build());

        if (disputed && shipment.getAssignedDriver() != null) {
            disputeRepository.save(Dispute.builder()
                    .shipment(shipment)
                    .shipper(shipment.getShipper())
                    .driver(shipment.getAssignedDriver())
                    .reason(request.getReason().name())
                    .detail(request.getDetail().trim())
                    .status("OPEN")
                    .build());
        }

        logStatus(shipment, before, ShipmentStatus.CANCELLED, actor.getEmail(),
                "거래 취소 - " + reasonLabel(request.getReason()) + " / " + request.getDetail().trim());

        ShipmentDtos.ShipmentResponse response = toResponse(shipment, actor);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.ToggleBookmarkResponse toggleBookmark(Long shipmentId, User user) {
        Shipment shipment = getById(shipmentId);
        validateReadAccess(shipment, user);
        boolean bookmarked;
        var existing = shipmentBookmarkRepository.findByUserAndShipment(user, shipment);
        if (existing.isPresent()) {
            shipmentBookmarkRepository.delete(existing.get());
            bookmarked = false;
        } else {
            shipmentBookmarkRepository.save(ShipmentBookmark.builder().user(user).shipment(shipment).build());
            bookmarked = true;
        }
        return ShipmentDtos.ToggleBookmarkResponse.builder().bookmarked(bookmarked).build();
    }

    private void saveCargoImages(Shipment shipment, List<String> dataUrls, List<String> names) {
        if (dataUrls == null || dataUrls.isEmpty()) return;
        for (int i = 0; i < dataUrls.size(); i++) {
            String dataUrl = dataUrls.get(i);
            if (dataUrl == null || dataUrl.isBlank()) continue;
            String name = names != null && i < names.size() ? names.get(i) : null;
            shipmentImageRepository.save(ShipmentImage.builder()
                    .shipment(shipment)
                    .type(ShipmentImageType.CARGO)
                    .originalName(name)
                    .dataUrl(dataUrl)
                    .build());
        }
    }

    private boolean isCompletable(Shipment shipment, Integer remainingMinutes) {
        boolean etaPassed = shipment.getEstimatedArrivalAt() != null && !LocalDateTime.now().isBefore(shipment.getEstimatedArrivalAt());
        boolean remainingDone = remainingMinutes != null && remainingMinutes <= 0;
        return etaPassed || remainingDone;
    }

    private Shipment getById(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("화물을 찾을 수 없습니다."));
    }

    private void validateReadAccess(Shipment shipment, User user) {
        if (user == null) {
            throw new RuntimeException("조회 권한이 없습니다.");
        }
    }

    private ShipmentDtos.ShipmentResponse toResponse(Shipment shipment, User viewer) {
        List<Offer> offers = offerRepository.findByShipment(shipment);
        List<StatusHistory> histories = statusHistoryRepository.findByShipmentOrderByCreatedAtAsc(shipment);
        LocationLog latestLocation = locationLogRepository.findTopByShipmentOrderByCreatedAtDesc(shipment).orElse(null);
        Integer bestOfferPrice = offers.stream().map(Offer::getPrice).min(Integer::compareTo).orElse(null);
        boolean bookmarked = viewer != null && shipmentBookmarkRepository.findByUserAndShipment(viewer, shipment).isPresent();
        boolean hasMyOffer = viewer != null && viewer.getRole() == UserRole.DRIVER && offers.stream().anyMatch(offer -> offer.getDriver().getId().equals(viewer.getId()));
        boolean assignedToMe = viewer != null && viewer.getRole() == UserRole.DRIVER && shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(viewer.getId());
        boolean canAccessDetail = viewer != null;
        ShipmentDtos.TrackingResponse trackingResponse = resolveTracking(shipment, latestLocation);
        var shipperProfile = userService.toPublicProfile(shipment.getShipper());
        var assignedDriverProfile = shipment.getAssignedDriver() != null ? userService.toPublicProfile(shipment.getAssignedDriver()) : null;

        boolean counterpartyHighCancelBadge = false;
        if (viewer != null) {
            if (viewer.getRole() == UserRole.SHIPPER && assignedDriverProfile != null) {
                counterpartyHighCancelBadge = Boolean.TRUE.equals(assignedDriverProfile.getHighCancelBadge());
            } else if (viewer.getRole() == UserRole.DRIVER) {
                counterpartyHighCancelBadge = Boolean.TRUE.equals(shipperProfile.getHighCancelBadge());
            }
        }

        return ShipmentDtos.ShipmentResponse.builder()
                .id(shipment.getId())
                .title(shipment.getTitle())
                .cargoType(shipment.getCargoType())
                .weightKg(shipment.getWeightKg())
                .description(shipment.getDescription())
                .originAddress(shipment.getOriginAddress())
                .originLat(shipment.getOriginLat())
                .originLng(shipment.getOriginLng())
                .destinationAddress(shipment.getDestinationAddress())
                .destinationLat(shipment.getDestinationLat())
                .destinationLng(shipment.getDestinationLng())
                .estimatedMinutes(shipment.getEstimatedMinutes())
                .estimatedDistanceKm(shipment.getEstimatedDistanceKm())
                .status(shipment.getStatus())
                .shipperName(shipment.getShipper().getName())
                .shipperId(shipment.getShipper().getId())
                .shipperAverageRating(shipperProfile.getAverageRating())
                .shipperRatingCount(shipperProfile.getRatingCount())
                .shipperBio(shipperProfile.getBio())
                .shipperProfileImageUrl(shipperProfile.getProfileImageUrl())
                .shipperContactEmail(shipperProfile.getContactEmail())
                .shipperContactPhone(shipperProfile.getContactPhone())
                .assignedDriverName(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getName() : null)
                .assignedDriverId(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getId() : null)
                .assignedDriverAverageRating(assignedDriverProfile != null ? assignedDriverProfile.getAverageRating() : null)
                .assignedDriverRatingCount(assignedDriverProfile != null ? assignedDriverProfile.getRatingCount() : null)
                .assignedDriverBio(assignedDriverProfile != null ? assignedDriverProfile.getBio() : null)
                .assignedDriverProfileImageUrl(assignedDriverProfile != null ? assignedDriverProfile.getProfileImageUrl() : null)
                .assignedDriverContactEmail(assignedDriverProfile != null ? assignedDriverProfile.getContactEmail() : null)
                .assignedDriverContactPhone(assignedDriverProfile != null ? assignedDriverProfile.getContactPhone() : null)
                .acceptedOfferId(shipment.getAcceptedOfferId())
                .agreedPrice(shipment.getAgreedPrice())
                .paid(shipment.isPaid())
                .paymentMethod(shipment.getPaymentMethod())
                .paymentCompletedAt(shipment.getPaymentCompletedAt())
                .bookmarked(bookmarked)
                .hasMyOffer(hasMyOffer)
                .assignedToMe(assignedToMe)
                .canAccessDetail(canAccessDetail)
                .bestOfferPrice(bestOfferPrice)
                .offerCount(offers.size())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .scheduledStartAt(shipment.getScheduledStartAt())
                .startedAt(shipment.getStartedAt())
                .estimatedArrivalAt(shipment.getEstimatedArrivalAt())
                .completedAt(shipment.getCompletedAt())
                .offers(offers.stream().map(this::toOfferResponse).toList())
                .tracking(trackingResponse)
                .histories(histories.stream().map(history -> ShipmentDtos.StatusHistoryResponse.builder()
                        .id(history.getId())
                        .fromStatus(history.getFromStatus())
                        .toStatus(history.getToStatus())
                        .actorEmail(history.getActorEmail())
                        .note(history.getNote())
                        .createdAt(history.getCreatedAt())
                        .build()).toList())
                .cargoImageUrls(shipmentImageRepository.findByShipmentAndTypeOrderByCreatedAtAsc(shipment, ShipmentImageType.CARGO)
                        .stream().map(ShipmentImage::getDataUrl).toList())
                .completionImageUrl(shipmentImageRepository.findTopByShipmentAndTypeOrderByCreatedAtDesc(shipment, ShipmentImageType.COMPLETION)
                        .map(ShipmentImage::getDataUrl).orElse(null))
                .cancelPenaltyScore(viewer != null ? viewer.getPenaltyScore30d() : null)
                .counterpartyHighCancelBadge(counterpartyHighCancelBadge)
                .viewerMatchingBlockedUntil(viewer != null ? viewer.getMatchingBlockedUntil() : null)
                .viewerTradingBlockedUntil(viewer != null ? viewer.getTradingBlockedUntil() : null)
                .build();
    }

    private ShipmentDtos.TrackingResponse resolveTracking(Shipment shipment, LocationLog latestLocation) {
        if (shipment.getStatus() == ShipmentStatus.COMPLETED) {
            return ShipmentDtos.TrackingResponse.builder()
                    .remainingMinutes(0)
                    .roughLocation("도착 완료")
                    .latitude(shipment.getDestinationLat())
                    .longitude(shipment.getDestinationLng())
                    .completable(true)
                    .updatedAt(shipment.getCompletedAt() != null ? shipment.getCompletedAt() : LocalDateTime.now())
                    .build();
        }

        if (shipment.getStatus() == ShipmentStatus.IN_TRANSIT && shipment.getStartedAt() != null && shipment.getEstimatedArrivalAt() != null) {
            long totalSeconds = Math.max(1L, Duration.between(shipment.getStartedAt(), shipment.getEstimatedArrivalAt()).getSeconds());
            long elapsedSeconds = Duration.between(shipment.getStartedAt(), LocalDateTime.now()).getSeconds();
            double progress = Math.max(0d, Math.min(1d, elapsedSeconds / (double) totalSeconds));
            double latitude = interpolate(shipment.getOriginLat(), shipment.getDestinationLat(), progress);
            double longitude = interpolate(shipment.getOriginLng(), shipment.getDestinationLng(), progress);
            int remainingMinutes = Math.max(0, (int) Math.ceil((totalSeconds - Math.max(0L, elapsedSeconds)) / 60.0));
            String roughLocation = progress >= 1d ? "도착지 도착" : progress >= 0.85d ? "도착지 인근 이동" : progress >= 0.35d ? "경로 이동중" : "출발지 출발";

            return ShipmentDtos.TrackingResponse.builder()
                    .remainingMinutes(remainingMinutes)
                    .roughLocation(roughLocation)
                    .latitude(latitude)
                    .longitude(longitude)
                    .completable(isCompletable(shipment, remainingMinutes))
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        if (latestLocation != null) {
            Integer remainingMinutes = latestLocation.getRemainingMinutes() != null ? latestLocation.getRemainingMinutes() : shipment.getEstimatedMinutes();
            return ShipmentDtos.TrackingResponse.builder()
                    .remainingMinutes(remainingMinutes)
                    .roughLocation(latestLocation.getRoughLocation())
                    .latitude(latestLocation.getLatitude())
                    .longitude(latestLocation.getLongitude())
                    .completable(isCompletable(shipment, remainingMinutes))
                    .updatedAt(latestLocation.getCreatedAt())
                    .build();
        }

        return null;
    }

    private double interpolate(Double from, Double to, double progress) {
        if (from == null) return to != null ? to : 0d;
        if (to == null) return from;
        return from + ((to - from) * progress);
    }

    private ShipmentDtos.OfferResponse toOfferResponse(Offer offer) {
        var profile = userService.toPublicProfile(offer.getDriver());
        return ShipmentDtos.OfferResponse.builder()
                .id(offer.getId())
                .driverName(offer.getDriver().getName())
                .driverId(offer.getDriver().getId())
                .driverAverageRating(profile.getAverageRating())
                .driverRatingCount(profile.getRatingCount())
                .driverBio(profile.getBio())
                .driverProfileImageUrl(profile.getProfileImageUrl())
                .driverContactEmail(profile.getContactEmail())
                .driverContactPhone(profile.getContactPhone())
                .price(offer.getPrice())
                .message(offer.getMessage())
                .status(offer.getStatus())
                .createdAt(offer.getCreatedAt())
                .build();
    }

    private void logStatus(Shipment shipment, ShipmentStatus from, ShipmentStatus to, String actor, String note) {
        statusHistoryRepository.save(StatusHistory.builder()
                .shipment(shipment)
                .fromStatus(from)
                .toStatus(to)
                .actorEmail(actor)
                .note(note)
                .build());
    }

    private void validateTradeAvailability(User user) {
        LocalDateTime now = LocalDateTime.now();
        if (user.getTradingBlockedUntil() != null && user.getTradingBlockedUntil().isAfter(now)) {
            throw new RuntimeException("현재 거래 금지 상태입니다. 해제 시각: " + user.getTradingBlockedUntil());
        }
        if (user.getMatchingBlockedUntil() != null && user.getMatchingBlockedUntil().isAfter(now)) {
            throw new RuntimeException("현재 매칭 제한 상태입니다. 해제 시각: " + user.getMatchingBlockedUntil());
        }
    }

    private boolean canCancel(Shipment shipment, User actor) {
        if (actor.getRole() == UserRole.ADMIN) return true;
        if (shipment.getShipper() != null && shipment.getShipper().getId().equals(actor.getId())) return true;
        return shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(actor.getId());
    }

    private LocalDateTime resolveScheduledStartAt(Shipment shipment) {
        if (shipment.getScheduledStartAt() != null) {
            return shipment.getScheduledStartAt();
        }
        if (shipment.getStartedAt() != null) {
            return shipment.getStartedAt();
        }
        return shipment.getCreatedAt() != null ? shipment.getCreatedAt().plusHours(48) : LocalDateTime.now().plusHours(48);
    }

    private int calculateTimingPenalty(Shipment shipment) {
        LocalDateTime now = LocalDateTime.now();
        if (shipment.getStartedAt() != null || shipment.getStatus() == ShipmentStatus.IN_TRANSIT) {
            return 6;
        }
        LocalDateTime scheduledStartAt = resolveScheduledStartAt(shipment);
        if (!now.isBefore(scheduledStartAt)) {
            return 6;
        }
        long minutes = Duration.between(now, scheduledStartAt).toMinutes();

        if (minutes <= 60) {
            return 4;
        }
        if (minutes <= 180) {
            return 3;
        }
        if (minutes <= 1440) {
            return 2;
        }
        if (minutes <= 2880) {
            return 1;
        }
        return 1;
    }

    private boolean isDisputedReason(CancelReason reason) {
        return reason == CancelReason.OTHER_PARTY_NO_SHOW
                || reason == CancelReason.OTHER_PARTY_CHANGED_CONDITIONS;
    }

    private User resolveDisputeTarget(Shipment shipment, User actor, CancelReason reason) {
        if (!isDisputedReason(reason)) return null;
        if (shipment.getShipper() != null && shipment.getShipper().getId().equals(actor.getId())) {
            return shipment.getAssignedDriver();
        }
        return shipment.getShipper();
    }

    private String applyPenalty(User user, int penalty) {
        LocalDateTime now = LocalDateTime.now();
        refreshPenaltyWindow(user, now);

        int newScore = (user.getPenaltyScore30d() == null ? 0 : user.getPenaltyScore30d()) + penalty;
        user.setPenaltyScore30d(newScore);
        user.setCancelCount((user.getCancelCount() == null ? 0 : user.getCancelCount()) + 1);

        long denominator = (long) (user.getCancelCount() == null ? 0 : user.getCancelCount())
                + (long) (user.getCompletedTransactionCount() == null ? 0 : user.getCompletedTransactionCount());
        if (denominator > 0) {
            double rate = ((double) user.getCancelCount() / denominator) * 100.0;
            user.setCancelRate(Math.round(rate * 10.0) / 10.0);
        } else {
            user.setCancelRate(0d);
        }

        String action;
        if (newScore >= 20) {
            user.setTradingBlockedUntil(now.plusDays(14));
            user.setPenaltyRatingDelta(minPenaltyDelta(user.getPenaltyRatingDelta(), 0.6));
            action = "14일 거래 금지";
        } else if (newScore >= 15) {
            user.setTradingBlockedUntil(now.plusDays(7));
            user.setPenaltyRatingDelta(minPenaltyDelta(user.getPenaltyRatingDelta(), 0.3));
            action = "7일 거래 금지 + 평점 강등";
        } else if (newScore >= 10) {
            user.setTradingBlockedUntil(now.plusDays(3));
            action = "3일 거래 금지";
        } else if (newScore >= 8) {
            user.setMatchingBlockedUntil(now.plusHours(72));
            user.setHighCancelBadge(true);
            user.setPenaltyRatingDelta(minPenaltyDelta(user.getPenaltyRatingDelta(), 0.1));
            action = "72시간 매칭 제한 + 취소율 높음 뱃지";
        } else if (newScore >= 5) {
            user.setMatchingBlockedUntil(now.plusHours(24));
            action = "24시간 매칭 제한";
        } else if (newScore >= 3) {
            user.setMatchingBlockedUntil(now.plusHours(2));
            action = "2시간 매칭 제한";
        } else {
            action = "점수 누적만 반영";
        }

        if ((user.getCancelRate() != null && user.getCancelRate() >= 20d && denominator >= 20) || newScore >= 8) {
            user.setHighCancelBadge(true);
        }

        userRepository.save(user);
        return action;
    }

    private void refreshPenaltyWindow(User user, LocalDateTime now) {
        LocalDateTime start = now.minusDays(30);
        List<ShipmentCancelHistory> recentCancels = shipmentCancelHistoryRepository.findByCanceledByAndCanceledAtAfterOrderByCanceledAtDesc(user, start);
        int recalculated = recentCancels.stream()
                .map(ShipmentCancelHistory::getFinalPenaltyScore)
                .filter(score -> score != null)
                .mapToInt(Integer::intValue)
                .sum();
        user.setPenaltyScore30d(recalculated);

        if (user.getMatchingBlockedUntil() != null && user.getMatchingBlockedUntil().isBefore(now)) {
            user.setMatchingBlockedUntil(null);
        }
        if (user.getTradingBlockedUntil() != null && user.getTradingBlockedUntil().isBefore(now)) {
            user.setTradingBlockedUntil(null);
        }
        if ((user.getCancelRate() == null || user.getCancelRate() < 20d) && recalculated < 8) {
            user.setHighCancelBadge(false);
        }
    }

    private double minPenaltyDelta(Double current, double target) {
        double safeCurrent = current == null ? 0d : current;
        return Math.max(safeCurrent, target);
    }

    private void incrementCompletedCount(User user) {
        if (user == null) return;
        user.setCompletedTransactionCount((user.getCompletedTransactionCount() == null ? 0 : user.getCompletedTransactionCount()) + 1);
        long denominator = (long) (user.getCancelCount() == null ? 0 : user.getCancelCount())
                + (long) user.getCompletedTransactionCount();
        if (denominator > 0) {
            double rate = ((double) (user.getCancelCount() == null ? 0 : user.getCancelCount()) / denominator) * 100.0;
            user.setCancelRate(Math.round(rate * 10.0) / 10.0);
        }
        userRepository.save(user);
    }

    private String reasonLabel(CancelReason reason) {
        return switch (reason) {
            case SIMPLE_CHANGE_OF_MIND -> "단순 변심";
            case SCHEDULE_CHANGE -> "일정 변경";
            case OTHER_PARTY_NO_SHOW -> "상대방 연락 두절";
            case OTHER_PARTY_CHANGED_CONDITIONS -> "상대방 조건 변경";
            case VEHICLE_OR_CARGO_ISSUE -> "차량/화물 문제 발생";
            case OTHER -> "기타";
        };
    }

    private int estimateMinutes(Double lat1, Double lng1, Double lat2, Double lng2) {
        double km = estimateDistanceKm(lat1, lng1, lat2, lng2);
        return Math.max(10, (int) Math.round((km / 40.0) * 60.0));
    }

    private double estimateDistanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
        double earthRadius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(earthRadius * c * 10) / 10.0;
    }
}
