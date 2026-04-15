package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rounds_lite_room")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundsLiteRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 12)
    private String roomCode;

    @Column(nullable = false, length = 32)
    private String phase;

    @Column(nullable = false)
    @Builder.Default
    private Integer roundNo = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer targetWins = 3;

    private String pickerSeat;
    private String roundWinnerSeat;
    private String matchWinnerSeat;

    @Column(length = 1000)
    private String message;

    private LocalDateTime countdownEndsAt;
    private LocalDateTime lastTickAt;

    @Lob
    private String projectilesJson;

    @Lob
    private String cardOptionsJson;

    @Column(nullable = false)
    @Builder.Default
    private Boolean matchmakingRoom = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("seat asc")
    @Builder.Default
    private List<RoundsLitePlayer> players = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (phase == null) {
            phase = "WAITING";
        }
        if (roundNo == null) {
            roundNo = 1;
        }
        if (targetWins == null) {
            targetWins = 3;
        }
        if (matchmakingRoom == null) {
            matchmakingRoom = false;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (lastTickAt == null) {
            lastTickAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
