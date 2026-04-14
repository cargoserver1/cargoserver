package com.logistics.app.service;

import com.logistics.app.dto.PublicDtos;
import com.logistics.app.entity.*;
import com.logistics.app.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PublicService {

    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final OfferRepository offerRepository;
    private final LocationLogRepository locationLogRepository;
    private final NoticeRepository noticeRepository;
    private final FaqRepository faqRepository;
    private final CustomerInquiryRepository customerInquiryRepository;

    public PublicService(UserRepository userRepository,
                         ShipmentRepository shipmentRepository,
                         OfferRepository offerRepository,
                         LocationLogRepository locationLogRepository,
                         NoticeRepository noticeRepository,
                         FaqRepository faqRepository,
                         CustomerInquiryRepository customerInquiryRepository) {
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
        this.offerRepository = offerRepository;
        this.locationLogRepository = locationLogRepository;
        this.noticeRepository = noticeRepository;
        this.faqRepository = faqRepository;
        this.customerInquiryRepository = customerInquiryRepository;
    }

    public PublicDtos.PublicOverviewResponse getOverview() {
        List<PublicDtos.PublicShipmentCard> liveBoard = getPublicShipments();
        return PublicDtos.PublicOverviewResponse.builder()
                .totalShippers(userRepository.countByRole(UserRole.SHIPPER))
                .totalDrivers(userRepository.countByRole(UserRole.DRIVER))
                .totalShipments(shipmentRepository.count())
                .liveShipments(shipmentRepository.countByStatus(ShipmentStatus.IN_TRANSIT) + shipmentRepository.countByStatus(ShipmentStatus.CONFIRMED))
                .biddingShipments(shipmentRepository.countByStatus(ShipmentStatus.BIDDING))
                .completedShipments(shipmentRepository.countByStatus(ShipmentStatus.COMPLETED))
                .liveBoard(liveBoard)
                .notices(getNotices())
                .faqs(getFaqs())
                .build();
    }

    public List<PublicDtos.PublicShipmentCard> getPublicShipments() {
        List<Shipment> shipments = shipmentRepository.findByStatusIn(List.of(
                ShipmentStatus.BIDDING, ShipmentStatus.CONFIRMED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.COMPLETED
        ));

        return shipments.stream()
                .sorted(Comparator.comparing(Shipment::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                                .map(this::toPublicCard)
                .toList();
    }

    public List<PublicDtos.NoticeResponse> getNotices() {
        return noticeRepository.findTop6ByOrderByPinnedDescPublishedAtDesc().stream()
                .map(notice -> PublicDtos.NoticeResponse.builder()
                        .id(notice.getId())
                        .category(notice.getCategory())
                        .title(notice.getTitle())
                        .summary(notice.getSummary())
                        .pinned(notice.isPinned())
                        .publishedAt(notice.getPublishedAt())
                        .build())
                .toList();
    }

    public List<PublicDtos.FaqResponse> getFaqs() {
        return faqRepository.findAllByOrderBySortOrderAsc().stream()
                .map(faq -> PublicDtos.FaqResponse.builder()
                        .id(faq.getId())
                        .category(faq.getCategory())
                        .question(faq.getQuestion())
                        .answer(faq.getAnswer())
                        .sortOrder(faq.getSortOrder())
                        .build())
                .toList();
    }

    @Transactional
    public PublicDtos.InquiryResponse createInquiry(PublicDtos.CreateInquiryRequest request) {
        CustomerInquiry inquiry = CustomerInquiry.builder()
                .companyName(request.getCompanyName())
                .contactName(request.getContactName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .inquiryType(request.getInquiryType())
                .message(request.getMessage())
                .status("RECEIVED")
                .build();
        customerInquiryRepository.save(inquiry);
        return PublicDtos.InquiryResponse.builder()
                .id(inquiry.getId())
                .companyName(inquiry.getCompanyName())
                .contactName(inquiry.getContactName())
                .inquiryType(inquiry.getInquiryType())
                .status(inquiry.getStatus())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }

    private PublicDtos.PublicShipmentCard toPublicCard(Shipment shipment) {
        List<Offer> offers = offerRepository.findByShipment(shipment);
        LocationLog latest = locationLogRepository.findTopByShipmentOrderByCreatedAtDesc(shipment).orElse(null);
        Integer bestOffer = offers.stream().map(Offer::getPrice).min(Integer::compareTo).orElse(null);

        return PublicDtos.PublicShipmentCard.builder()
                .id(shipment.getId())
                .title(shipment.getTitle())
                .cargoType(shipment.getCargoType())
                .weightKg(shipment.getWeightKg())
                .status(shipment.getStatus())
                .originSummary(maskAddress(shipment.getOriginAddress()))
                .destinationSummary(maskAddress(shipment.getDestinationAddress()))
                .currentLocationSummary(latest != null ? latest.getRoughLocation() : defaultLocationLabel(shipment))
                .estimatedMinutes(latest != null ? latest.getRemainingMinutes() : shipment.getEstimatedMinutes())
                .estimatedDistanceKm(shipment.getEstimatedDistanceKm())
                .bestOfferPrice(bestOffer)
                .offerCount(offers.size())
                .assignedDriverName(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getName() : null)
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt() != null ? shipment.getUpdatedAt() : shipment.getCreatedAt())
                .build();
    }

    private String maskAddress(String address) {
        if (address == null || address.isBlank()) return "위치 미등록";
        String[] tokens = address.split(" ");
        if (tokens.length >= 2) return tokens[0] + " " + tokens[1];
        return address;
    }

    private String defaultLocationLabel(Shipment shipment) {
        if (shipment.getStatus() == ShipmentStatus.BIDDING) return "배차 대기";
        if (shipment.getStatus() == ShipmentStatus.CONFIRMED) return "상차 준비";
        if (shipment.getStatus() == ShipmentStatus.COMPLETED) return "운송 완료";
        return "운행 상태 확인중";
    }
}
