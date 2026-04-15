package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quick_draw_room")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickDrawRoomEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 6)
    private String roomCode;

    @Column(nullable = false, length = 30)
    private String phase;

    @Column(length = 2)
    private String winnerSeat;

    @Column(nullable = false, length = 300)
    private String lastRoundMessage;

    @Column(nullable = false)
    private Integer targetScore;

    private LocalDateTime drawAt;

    @Column(nullable = false)
    private Boolean active;

    @Version
    private Long version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuickDrawParticipantEntity> participants = new ArrayList<>();

    public void addParticipant(QuickDrawParticipantEntity participant) {
        participants.add(participant);
        participant.setRoom(this);
    }

    public void removeParticipant(QuickDrawParticipantEntity participant) {
        participants.remove(participant);
        participant.setRoom(null);
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (phase == null) {
            phase = "WAITING";
        }
        if (lastRoundMessage == null || lastRoundMessage.isBlank()) {
            lastRoundMessage = "방이 생성되었습니다. 상대를 기다립니다.";
        }
        if (targetScore == null) {
            targetScore = 3;
        }
        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
