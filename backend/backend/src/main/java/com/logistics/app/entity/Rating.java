package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rating", uniqueConstraints = @UniqueConstraint(columnNames = {"shipment_id", "from_user_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_user_id")
    private User toUser;

    @Column(nullable = false)
    private Integer score;

    @Column(length = 500)
    private String comment;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
