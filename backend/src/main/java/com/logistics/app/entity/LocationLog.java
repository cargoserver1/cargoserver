package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class LocationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Shipment shipment;

    @ManyToOne(fetch = FetchType.LAZY)
    private User driver;

    private Double latitude;
    private Double longitude;
    private Integer remainingMinutes;
    private String roughLocation;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
