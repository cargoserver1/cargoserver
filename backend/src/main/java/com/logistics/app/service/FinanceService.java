package com.logistics.app.service;

import com.logistics.app.dto.FinanceDtos;
import com.logistics.app.dto.ReceiptDTO;
import com.logistics.app.entity.*;
import com.logistics.app.repository.MoneyTransactionRepository;
import com.logistics.app.repository.OfferRepository;
import com.logistics.app.repository.ShipmentRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FinanceService {

    public static final int SERVICE_FEE_RATE = 3;
    private final OfferRepository offerRepository;
    private final MoneyTransactionRepository moneyTransactionRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public FinanceService(MoneyTransactionRepository moneyTransactionRepository,
                          ShipmentRepository shipmentRepository,
                          UserRepository userRepository,
                          OfferRepository offerRepository,
                          NotificationService notificationService) {
        this.moneyTransactionRepository = moneyTransactionRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.offerRepository = offerRepository;
        this.notificationService = notificationService;
    }

    public FinanceDtos.FinanceSummaryResponse getSummary(User user) {
        List<MoneyTransaction> transactions;
        if (user.getRole() == UserRole.ADMIN) {
            transactions = moneyTransactionRepository.findAll();
        } else {
            transactions = moneyTransactionRepository.findByUserOrderByCreatedAtDesc(user);
        }

        int totalSpent = 0;
        int totalGrossEarned = 0;
        int totalNetEarned = 0;
        int totalFeePaid = 0;
        int totalPlatformRevenue = 0;

        for (MoneyTransaction tx : transactions) {
            switch (tx.getType()) {
                case SPEND -> {
                    totalSpent += nvl(tx.getGrossAmount());
                    totalFeePaid += nvl(tx.getFeeAmount());
                }
                case EARN -> {
                    totalGrossEarned += nvl(tx.getGrossAmount());
                    totalNetEarned += nvl(tx.getNetAmount());
                    totalFeePaid += nvl(tx.getFeeAmount());
                }
                case FEE -> totalPlatformRevenue += nvl(tx.getNetAmount());
            }
        }

        int completedShipmentCount = user.getRole() == UserRole.ADMIN
                ? (int) shipmentRepository.findAll().stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count()
                : (int) shipmentRepository.findAll().stream().filter(s ->
                s.getStatus() == ShipmentStatus.COMPLETED && (
                        (user.getRole() == UserRole.SHIPPER && s.getShipper() != null && s.getShipper().getId().equals(user.getId())) ||
                                (user.getRole() == UserRole.DRIVER && s.getAssignedDriver() != null && s.getAssignedDriver().getId().equals(user.getId()))
                )
        ).count();

        List<FinanceDtos.MoneyTransactionResponse> recent = transactions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(8)
                .map(this::toResponse)
                .toList();

        return FinanceDtos.FinanceSummaryResponse.builder()
                .role(user.getRole().name())
                .serviceFeeRate(SERVICE_FEE_RATE)
                .totalSpent(totalSpent)
                .totalGrossEarned(totalGrossEarned)
                .totalNetEarned(totalNetEarned)
                .totalFeePaid(totalFeePaid)
                .totalPlatformRevenue(totalPlatformRevenue)
                .transactionCount(transactions.size())
                .completedShipmentCount(completedShipmentCount)
                .recentTransactions(recent)
                .build();
    }

    public List<FinanceDtos.MoneyTransactionResponse> getTransactions(User user) {
        List<MoneyTransaction> transactions = user.getRole() == UserRole.ADMIN
                ? moneyTransactionRepository.findAll()
                : moneyTransactionRepository.findByUserOrderByCreatedAtDesc(user);
        return transactions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void settleCompletedShipment(Shipment shipment) {
        if (shipment == null || shipment.getAcceptedOfferId() == null || moneyTransactionRepository.existsByShipment(shipment)) {
            return;
        }
        var accepted = shipment.getAcceptedOfferId();
        var offer = shipment.getAcceptedOfferId() == null ? null : shipment.getAcceptedOfferId();
    }

    @Transactional
    public void settleCompletedShipment(Shipment shipment, Offer acceptedOffer, User adminUser) {
        if (shipment == null || acceptedOffer == null || moneyTransactionRepository.existsByShipment(shipment)) {
            return;
        }

        int grossAmount = acceptedOffer.getPrice() == null ? 0 : acceptedOffer.getPrice();
        int feeAmount = (int) Math.floor(grossAmount * (SERVICE_FEE_RATE / 100.0));
        int netAmount = grossAmount - feeAmount;

        if (!moneyTransactionRepository.existsByShipmentAndType(shipment, TransactionType.SPEND)) {
            moneyTransactionRepository.save(MoneyTransaction.builder()
                    .user(shipment.getShipper())
                    .shipment(shipment)
                    .type(TransactionType.SPEND)
                    .grossAmount(grossAmount)
                    .feeAmount(0)
                    .netAmount(grossAmount)
                    .description("배차 완료 결제")
                    .build());
        }

        if (shipment.getAssignedDriver() != null) {
            moneyTransactionRepository.save(MoneyTransaction.builder()
                    .user(shipment.getAssignedDriver())
                    .shipment(shipment)
                    .type(TransactionType.EARN)
                    .grossAmount(grossAmount)
                    .feeAmount(feeAmount)
                    .netAmount(netAmount)
                    .description("운행 완료 정산")
                    .build());
        }

        if (adminUser != null) {
            moneyTransactionRepository.save(MoneyTransaction.builder()
                    .user(adminUser)
                    .shipment(shipment)
                    .type(TransactionType.FEE)
                    .grossAmount(grossAmount)
                    .feeAmount(feeAmount)
                    .netAmount(feeAmount)
                    .description("플랫폼 수수료 수익")
                    .build());
        }
    }

    public FinanceDtos.ReceiptResponse getReceipt(User user, Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("화물을 찾을 수 없습니다."));

        boolean canView = user.getRole() == UserRole.ADMIN
                || (shipment.getShipper() != null && shipment.getShipper().getId().equals(user.getId()))
                || (shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(user.getId()));

        if (!canView) {
            throw new RuntimeException("해당 영수증을 조회할 권한이 없습니다.");
        }

        MoneyTransaction tx = user.getRole() == UserRole.ADMIN
                ? moneyTransactionRepository.findFirstByShipmentIdOrderByCreatedAtDesc(shipmentId).orElse(null)
                : moneyTransactionRepository.findFirstByUserAndShipmentIdOrderByCreatedAtDesc(user, shipmentId).orElse(null);

        Integer fallbackGross = shipment.getAgreedPrice();
        if (fallbackGross == null && shipment.getAcceptedOfferId() != null) {
            fallbackGross = offerRepository.findById(shipment.getAcceptedOfferId())
                    .map(Offer::getPrice)
                    .orElse(null);
        }
        int grossAmount = tx != null ? nvl(tx.getGrossAmount()) : nvl(fallbackGross);
        int feeAmount;
        int netAmount;
        TransactionType transactionType;
        String description;
        String paymentMethod;
        java.time.LocalDateTime createdAt;
        String receiptNumber;

        if (tx != null) {
            feeAmount = nvl(tx.getFeeAmount());
            netAmount = nvl(tx.getNetAmount());
            transactionType = tx.getType();
            description = tx.getDescription();
            paymentMethod = tx.getPaymentMethod() != null ? tx.getPaymentMethod() : (tx.getShipment() != null ? tx.getShipment().getPaymentMethod() : null);
            createdAt = tx.getCreatedAt();
            receiptNumber = "RCPT-" + shipmentId + "-" + tx.getId();
        } else {
            feeAmount = user.getRole() == UserRole.DRIVER ? (int) Math.floor(grossAmount * (SERVICE_FEE_RATE / 100.0)) : 0;
            netAmount = Math.max(grossAmount - feeAmount, 0);
            transactionType = user.getRole() == UserRole.DRIVER ? TransactionType.EARN : TransactionType.SPEND;
            description = shipment.isPaid() ? "운송 결제 내역" : "거래 예상 영수증";
            paymentMethod = shipment.getPaymentMethod();
            createdAt = shipment.getPaymentCompletedAt() != null ? shipment.getPaymentCompletedAt() : shipment.getUpdatedAt();
            if (createdAt == null) {
                createdAt = shipment.getCreatedAt();
            }
            receiptNumber = "RCPT-" + shipmentId + "-PREVIEW";
        }

        return FinanceDtos.ReceiptResponse.builder()
                .receiptNumber(receiptNumber)
                .shipmentId(shipment.getId())
                .shipmentTitle(shipment.getTitle())
                .transactionType(transactionType)
                .grossAmount(grossAmount)
                .feeAmount(feeAmount)
                .netAmount(netAmount)
                .description(description)
                .paymentMethod(paymentMethod)
                .createdAt(createdAt)
                .originAddress(shipment.getOriginAddress())
                .destinationAddress(shipment.getDestinationAddress())
                .shipperName(shipment.getShipper() != null ? shipment.getShipper().getName() : null)
                .driverName(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getName() : null)
                .viewerRole(user.getRole().name())
                .build();
    }

    @Transactional
    public FinanceDtos.ShipmentPaymentResponse payForShipment(Long shipmentId, User user, FinanceDtos.ShipmentPaymentRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("결제할 거래를 찾을 수 없습니다."));

        if (user == null || shipment.getShipper() == null || !shipment.getShipper().getId().equals(user.getId())) {
            throw new RuntimeException("본인 화물만 결제할 수 있습니다.");
        }
        if (shipment.getStatus() != ShipmentStatus.CONFIRMED) {
            throw new RuntimeException("차주 확정 후에만 결제할 수 있습니다.");
        }
        if (shipment.isPaid()) {
            throw new RuntimeException("이미 결제가 완료된 거래입니다.");
        }
        if (shipment.getAcceptedOfferId() == null) {
            throw new RuntimeException("확정된 운임 정보가 없습니다.");
        }

        Offer acceptedOffer = offerRepository.findById(shipment.getAcceptedOfferId())
                .orElseThrow(() -> new RuntimeException("확정된 제안 정보를 찾을 수 없습니다."));
        int amount = acceptedOffer.getPrice() == null ? 0 : acceptedOffer.getPrice();
        String paymentMethod = request != null && request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()
                ? request.getPaymentMethod().trim()
                : "등록된 결제수단";

        shipment.setAgreedPrice(amount);
        shipment.setPaid(true);
        shipment.setPaymentMethod(paymentMethod);
        shipment.setPaymentCompletedAt(java.time.LocalDateTime.now());
        shipmentRepository.save(shipment);

        if (!moneyTransactionRepository.existsByShipmentAndType(shipment, TransactionType.SPEND)) {
            moneyTransactionRepository.save(MoneyTransaction.builder()
                    .user(shipment.getShipper())
                    .shipment(shipment)
                    .type(TransactionType.SPEND)
                    .grossAmount(amount)
                    .feeAmount(0)
                    .netAmount(amount)
                    .description("운송 결제 완료")
                    .paymentMethod(paymentMethod)
                    .build());
        }

        String amountText = String.format("%,d원", amount);
        notificationService.notifyUser(shipment.getShipper().getId(), "PAYMENT", "결제가 완료되었습니다.",
                shipment.getTitle() + " 건 결제가 완료되었습니다. 결제 금액은 " + amountText + "입니다.", "SHIPMENT", shipment.getId());
        if (shipment.getAssignedDriver() != null) {
            notificationService.notifyUser(shipment.getAssignedDriver().getId(), "PAYMENT", "결제 완료 알림",
                    shipment.getTitle() + " 건이 결제되었습니다. 결제 금액은 " + amountText + "입니다.", "SHIPMENT", shipment.getId());
        }

        return FinanceDtos.ShipmentPaymentResponse.builder()
                .shipmentId(shipment.getId())
                .shipmentTitle(shipment.getTitle())
                .amount(amount)
                .paid(true)
                .paidAt(shipment.getPaymentCompletedAt())
                .paymentMethod(paymentMethod)
                .message("결제가 완료되었습니다.")
                .build();
    }

    private FinanceDtos.MoneyTransactionResponse toResponse(MoneyTransaction tx) {
        return FinanceDtos.MoneyTransactionResponse.builder()
                .id(tx.getId())
                .shipmentId(tx.getShipment() != null ? tx.getShipment().getId() : null)
                .shipmentTitle(tx.getShipment() != null ? tx.getShipment().getTitle() : null)
                .type(tx.getType())
                .grossAmount(tx.getGrossAmount())
                .feeAmount(tx.getFeeAmount())
                .netAmount(tx.getNetAmount())
                .description(tx.getDescription())
                .paymentMethod(
                        tx.getPaymentMethod() != null
                                ? tx.getPaymentMethod()
                                : (tx.getShipment() != null ? tx.getShipment().getPaymentMethod() : null)
                )
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private int nvl(Integer value) {
        return value == null ? 0 : value;
    }

    public ReceiptDTO getReceipt(Long shipmentId) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        Integer price = 0;

        if (shipment.getAcceptedOfferId() != null) {
            Offer offer = offerRepository.findById(shipment.getAcceptedOfferId())
                    .orElseThrow(() -> new RuntimeException("Offer not found"));

            price = offer.getPrice();
        }

        return ReceiptDTO.builder()
                .receiptNumber(UUID.randomUUID().toString().substring(0, 10))
                .shipmentId(shipment.getId())
                .title(shipment.getTitle())
                .amount(price)
                .fee(0)
                .finalAmount(price)
                .createdAt(shipment.getCreatedAt())
                .build();
    }
}
