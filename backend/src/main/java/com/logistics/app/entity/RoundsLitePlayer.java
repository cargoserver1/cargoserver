package com.logistics.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rounds_lite_player")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundsLitePlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private RoundsLiteRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 4)
    private String seat;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ready = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer wins = 0;

    @Column(nullable = false)
    @Builder.Default
    private Double x = 0d;

    @Column(nullable = false)
    @Builder.Default
    private Double y = 0d;

    @Column(nullable = false)
    @Builder.Default
    private Double vx = 0d;

    @Column(nullable = false)
    @Builder.Default
    private Double vy = 0d;

    @Column(nullable = false)
    @Builder.Default
    private Integer hp = 100;

    @Column(nullable = false)
    @Builder.Default
    private Integer maxHp = 100;

    @Column(nullable = false)
    @Builder.Default
    private Double moveSpeed = 280d;

    @Column(nullable = false)
    @Builder.Default
    private Double jumpPower = 620d;

    @Column(nullable = false)
    @Builder.Default
    private Double bulletSpeed = 540d;

    @Column(nullable = false)
    @Builder.Default
    private Integer bulletDamage = 22;

    @Column(nullable = false)
    @Builder.Default
    private Integer cooldownMs = 500;

    @Column(nullable = false)
    @Builder.Default
    private Double projectileRadius = 10d;

    @Column(nullable = false)
    @Builder.Default
    private Double knockback = 210d;

    @Column(nullable = false)
    @Builder.Default
    private Integer projectileCount = 1;

    @Column(nullable = false)
    @Builder.Default
    private Double spreadDeg = 0d;

    @Column(nullable = false)
    @Builder.Default
    private Boolean facingRight = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean onGround = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean moveLeft = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean moveRight = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean jumpPressed = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean shootPressed = false;

    private LocalDateTime lastShotAt;

    @Column(length = 1000)
    private String selectedCardsCsv;
}
