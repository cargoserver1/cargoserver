package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "block_user", uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BlockUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocker_id")
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blocked_id")
    private User blocked;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
