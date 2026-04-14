package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Shipment shipment;

    @ManyToOne(fetch = FetchType.LAZY)
    private User driver;

    private Integer price;
    private String message;

    @Enumerated(EnumType.STRING)
    private OfferStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = OfferStatus.PENDING;
        }
    }
}
