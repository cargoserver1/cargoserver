package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User admin;

    @Column(nullable = false)
    private String targetType;

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false)
    private String actionType;

    @Column(nullable = false, length = 1000)
    private String description;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
