package com.logistics.app.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReceiptDTO {
    private String receiptNumber;
    private Long shipmentId;
    private String title;
    private int amount;
    private int fee;
    private int finalAmount;
    private LocalDateTime createdAt;
}