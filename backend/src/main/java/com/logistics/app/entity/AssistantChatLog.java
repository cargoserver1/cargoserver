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
public class AssistantChatLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 2000)
    private String question;

    @Column(nullable = false, length = 8000)
    private String answer;

    @Column(nullable = false, length = 50)
    private String mode;

    @Column(name = "response_mode", nullable = false, length = 50)
    @Builder.Default
    private String responseMode = "FALLBACK";

    @Column(nullable = false)
    private boolean usedAi;

    @Column(name = "fallback_used", nullable = false)
    @Builder.Default
    private boolean fallbackUsed = false;

    @Column(length = 5000)
    private String matchedKnowledge;

    @Column(length = 30)
    private String reviewStatus;

    @Column(length = 4000)
    private String adminMemo;

    @Column(length = 8000)
    private String recommendedAnswer;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.reviewStatus == null || this.reviewStatus.isBlank()) {
            this.reviewStatus = "NEW";
        }
        if (this.mode == null || this.mode.isBlank()) {
            this.mode = "FALLBACK";
        }
        if (this.responseMode == null || this.responseMode.isBlank()) {
            this.responseMode = this.mode;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
