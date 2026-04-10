package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentCancelHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Shipment shipment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User canceledBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CancelReason cancelReason;

    @Column(nullable = false, length = 3000)
    private String detail;

    @Column(nullable = false)
    private LocalDateTime canceledAt;

    private LocalDateTime scheduledStartAt;

    @Column(nullable = false)
    private Integer timingPenaltyScore;

    @Column(nullable = false)
    private Integer finalPenaltyScore;

    @Column(nullable = false)
    private boolean disputed;

    @ManyToOne(fetch = FetchType.LAZY)
    private User disputeTargetUser;

    private String penaltyActionSummary;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (canceledAt == null) {
            canceledAt = LocalDateTime.now();
        }
    }
}
