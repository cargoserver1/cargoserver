package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_token")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String codeHash;

    private LocalDateTime expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private Integer dailyRequestCount = 0;

    private LocalDateTime requestCountDate;

    @Builder.Default
    @Column(nullable = false)
    private Integer failedAttemptCount = 0;

    private LocalDateTime lockedUntil;

    private LocalDateTime verifiedAt;

    private String resetToken;

    private LocalDateTime resetTokenExpiresAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean used = false;

    private LocalDateTime lastSentAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (dailyRequestCount == null) {
            dailyRequestCount = 0;
        }
        if (failedAttemptCount == null) {
            failedAttemptCount = 0;
        }
        if (used == null) {
            used = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
