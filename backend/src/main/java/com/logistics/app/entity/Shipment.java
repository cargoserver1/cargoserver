package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User shipper;

    private String title;
    private String cargoType;
    private Double weightKg;
    private String description;

    private String originAddress;
    private Double originLat;
    private Double originLng;

    private String destinationAddress;
    private Double destinationLat;
    private Double destinationLng;

    private Integer estimatedMinutes;
    private Double estimatedDistanceKm;

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    private User assignedDriver;

    private Long acceptedOfferId;
    private Integer agreedPrice;

    @Column(nullable = false)
    private boolean paid = false;
    private String paymentMethod;
    private LocalDateTime paymentCompletedAt;
    private LocalDateTime scheduledStartAt;
    private LocalDateTime startedAt;
    private LocalDateTime estimatedArrivalAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = ShipmentStatus.REQUESTED;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
