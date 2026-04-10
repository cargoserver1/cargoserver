package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Shipment shipment;

    @ManyToOne(optional = false)
    private User shipper;

    @ManyToOne(optional = false)
    private User driver;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false, length = 3000)
    private String detail;

    @Column(nullable = false)
    private String status;

    @ManyToOne
    private User resolvedBy;

    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "OPEN";
    }
}
