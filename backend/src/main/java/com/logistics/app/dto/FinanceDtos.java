package com.logistics.app.dto;

import com.logistics.app.entity.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class FinanceDtos {

    @Data
    @Builder
    public static class FinanceSummaryResponse {
        private String role;
        private Integer serviceFeeRate;
        private Integer totalSpent;
        private Integer totalGrossEarned;
        private Integer totalNetEarned;
        private Integer totalFeePaid;
        private Integer totalPlatformRevenue;
        private Integer transactionCount;
        private Integer completedShipmentCount;
        private List<MoneyTransactionResponse> recentTransactions;
    }


    @Data
    public static class ShipmentPaymentRequest {
        private String paymentMethod;
    }

    @Data
    @Builder
    public static class ShipmentPaymentResponse {
        private Long shipmentId;
        private String shipmentTitle;
        private Integer amount;
        private boolean paid;
        private LocalDateTime paidAt;
        private String paymentMethod;
        private String message;
    }

    @Data
    @Builder
    public static class MoneyTransactionResponse {
        private Long id;
        private Long shipmentId;
        private String shipmentTitle;
        private TransactionType type;
        private Integer grossAmount;
        private Integer feeAmount;
        private Integer netAmount;
        private String description;
        private String paymentMethod;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class ReceiptResponse {
        private String receiptNumber;
        private Long shipmentId;
        private String shipmentTitle;
        private TransactionType transactionType;
        private Integer grossAmount;
        private Integer feeAmount;
        private Integer netAmount;
        private String description;
        private String paymentMethod;
        private LocalDateTime createdAt;
        private String originAddress;
        private String destinationAddress;
        private String shipperName;
        private String driverName;
        private String viewerRole;
    }
}
