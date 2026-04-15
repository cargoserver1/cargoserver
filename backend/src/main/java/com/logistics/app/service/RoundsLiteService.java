package com.logistics.app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logistics.app.dto.GameDtos;
import com.logistics.app.entity.RoundsLitePlayer;
import com.logistics.app.entity.RoundsLiteRoom;
import com.logistics.app.entity.User;
import com.logistics.app.repository.RoundsLitePlayerRepository;
import com.logistics.app.repository.RoundsLiteRoomRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoundsLiteService {

    private static final double ARENA_WIDTH = 960d;
    private static final double ARENA_HEIGHT = 540d;
    private static final double FLOOR_Y = 500d;
    private static final double PLAYER_WIDTH = 52d;
    private static final double PLAYER_HEIGHT = 84d;
    private static final double GRAVITY = 1500d;
    private static final double TICK_SECONDS = 0.05d;
    private static final double MAX_SIM_SECONDS = 1.0d;
    private static final int TARGET_WINS = 3;

    private final RoundsLiteRoomRepository roomRepository;
    private final RoundsLitePlayerRepository playerRepository;
    private final ObjectMapper objectMapper;

    public RoundsLiteService(RoundsLiteRoomRepository roomRepository,
                             RoundsLitePlayerRepository playerRepository,
                             ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.playerRepository = playerRepository;
        this.objectMapper = objectMapper;
    }

    public GameDtos.RoundsLiteRoomResponse createRoom(User user) {
        detachUserFromExistingRoom(user.getId());

        String roomCode;
        do {
            roomCode = generateRoomCode();
        } while (roomRepository.findByRoomCode(roomCode).isPresent());

        RoundsLiteRoom room = RoundsLiteRoom.builder()
                .roomCode(roomCode)
                .phase("WAITING")
                .roundNo(1)
                .targetWins(TARGET_WINS)
                .message("상대가 참가하면 준비 버튼으로 라운드를 시작하세요.")
                .projectilesJson("[]")
                .cardOptionsJson("[]")
                .matchmakingRoom(false)
                .lastTickAt(LocalDateTime.now())
                .build();

        RoundsLitePlayer player = createBasePlayer(room, user, "P1");
        player.setX(180d);
        player.setY(FLOOR_Y - PLAYER_HEIGHT);
        player.setFacingRight(true);
        room.getPlayers().add(player);

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse joinMatchmaking(User user) {
        detachUserFromExistingRoom(user.getId());

        List<RoundsLiteRoom> waitingRooms = roomRepository.findByMatchmakingRoomTrueOrderByCreatedAtAsc();
        for (RoundsLiteRoom room : waitingRooms) {
            simulateRoom(room);
            if (room.getPlayers().size() != 1) {
                continue;
            }

            boolean alreadyInRoom = room.getPlayers().stream()
                    .anyMatch(player -> Objects.equals(player.getUser().getId(), user.getId()));
            if (alreadyInRoom) {
                return toResponse(room, user.getId());
            }

            RoundsLitePlayer player = createBasePlayer(room, user, "P2");
            player.setX(ARENA_WIDTH - 180d - PLAYER_WIDTH);
            player.setY(FLOOR_Y - PLAYER_HEIGHT);
            player.setFacingRight(false);
            room.getPlayers().add(player);
            room.setMatchmakingRoom(false);
            room.setMessage("자동 매칭 완료. 두 플레이어가 준비하면 결투가 시작됩니다.");

            roomRepository.saveAndFlush(room);
            return toResponse(room, user.getId());
        }

        String roomCode;
        do {
            roomCode = generateRoomCode();
        } while (roomRepository.findByRoomCode(roomCode).isPresent());

        RoundsLiteRoom room = RoundsLiteRoom.builder()
                .roomCode(roomCode)
                .phase("WAITING")
                .roundNo(1)
                .targetWins(TARGET_WINS)
                .message("자동 매칭 상대를 찾는 중입니다.")
                .projectilesJson("[]")
                .cardOptionsJson("[]")
                .matchmakingRoom(true)
                .lastTickAt(LocalDateTime.now())
                .build();

        RoundsLitePlayer player = createBasePlayer(room, user, "P1");
        player.setX(180d);
        player.setY(FLOOR_Y - PLAYER_HEIGHT);
        player.setFacingRight(true);
        room.getPlayers().add(player);

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public void cancelMatchmaking(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        RoundsLitePlayer me = requireMember(room, user.getId());

        if (!Boolean.TRUE.equals(room.getMatchmakingRoom())) {
            return;
        }

        room.getPlayers().removeIf(player -> Objects.equals(player.getId(), me.getId()));
        if (room.getPlayers().isEmpty()) {
            roomRepository.delete(room);
            return;
        }

        room.setMatchmakingRoom(false);
        room.setMessage("매칭이 취소되었습니다.");
        roomRepository.saveAndFlush(room);
    }

    public GameDtos.RoundsLiteRoomResponse joinRoom(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);

        Optional<RoundsLitePlayer> existing = room.getPlayers().stream()
                .filter(player -> Objects.equals(player.getUser().getId(), user.getId()))
                .findFirst();
        if (existing.isPresent()) {
            return toResponse(room, user.getId());
        }
        if (Boolean.TRUE.equals(room.getMatchmakingRoom())) {
            throw new RuntimeException("이 방은 자동 매칭 대기 중입니다. 자동 매칭 버튼을 사용하세요.");
        }
        if (room.getPlayers().size() >= 2) {
            throw new RuntimeException("이미 가득 찬 방입니다.");
        }

        detachUserFromExistingRoom(user.getId());

        RoundsLitePlayer player = createBasePlayer(room, user, "P2");
        player.setX(ARENA_WIDTH - 180d - PLAYER_WIDTH);
        player.setY(FLOOR_Y - PLAYER_HEIGHT);
        player.setFacingRight(false);
        room.getPlayers().add(player);
        room.setMessage("두 플레이어가 준비하면 결투가 시작됩니다.");

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse getState(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        requireMember(room, user.getId());
        simulateRoom(room);
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse ready(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);
        RoundsLitePlayer me = requireMember(room, user.getId());

        if (room.getPlayers().size() < 2) {
            throw new RuntimeException("상대가 참가해야 준비할 수 있습니다.");
        }
        if ("COUNTDOWN".equals(room.getPhase()) || "ACTIVE".equals(room.getPhase()) || "CARD_PICK".equals(room.getPhase())) {
            throw new RuntimeException("현재 준비할 수 없는 상태입니다.");
        }

        me.setReady(Boolean.TRUE);
        room.setMessage(me.getName() + " 님이 준비했습니다.");
        if (room.getPlayers().stream().allMatch(player -> Boolean.TRUE.equals(player.getReady()))) {
            prepareRound(room);
        }
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse applyInput(String roomCode, User user, GameDtos.RoundsLiteInputRequest request) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);
        RoundsLitePlayer me = requireMember(room, user.getId());

        me.setMoveLeft(request.isLeft());
        me.setMoveRight(request.isRight());
        me.setJumpPressed(request.isJump());
        me.setShootPressed(request.isShoot());

        simulateRoom(room);
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse selectCard(String roomCode, User user, String cardKey) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);
        RoundsLitePlayer me = requireMember(room, user.getId());

        if (!"CARD_PICK".equals(room.getPhase())) {
            throw new RuntimeException("지금은 카드를 선택할 수 없습니다.");
        }
        if (!Objects.equals(room.getPickerSeat(), me.getSeat())) {
            throw new RuntimeException("이번 라운드 승리자만 카드를 선택할 수 있습니다.");
        }

        List<CardOption> options = readCards(room.getCardOptionsJson());
        CardOption selected = options.stream()
                .filter(option -> option.getKey().equals(cardKey))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("선택한 카드를 찾을 수 없습니다."));

        applyCard(me, selected);
        me.setSelectedCardsCsv(appendCard(me.getSelectedCardsCsv(), selected.getTitle()));

        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundNo(room.getRoundNo() + 1);
        room.setRoundWinnerSeat(null);

        if (room.getPlayers().stream().anyMatch(player -> player.getWins() >= room.getTargetWins())) {
            room.setPhase("MATCH_END");
            room.setMatchWinnerSeat(me.getSeat());
            room.setMessage(me.getName() + " 님이 매치에서 승리했습니다.");
        } else {
            prepareRound(room);
            room.setMessage(selected.getTitle() + " 카드를 적용했습니다. 다음 라운드를 준비합니다.");
        }

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse resetMatch(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        requireMember(room, user.getId());
        resetEntireMatch(room);
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public void leaveRoom(String roomCode, User user) {
        RoundsLiteRoom room = roomRepository.findByRoomCode(normalize(roomCode)).orElse(null);
        if (room == null) {
            return;
        }
        room.getPlayers().removeIf(player -> Objects.equals(player.getUser().getId(), user.getId()));
        if (room.getPlayers().isEmpty()) {
            roomRepository.delete(room);
            return;
        }

        normalizeSeats(room);
        resetRoomAfterLeave(room);
        roomRepository.saveAndFlush(room);
    }

    private void detachUserFromExistingRoom(Long userId) {
        Optional<RoundsLitePlayer> existing = playerRepository.findByUserId(userId);
        if (existing.isEmpty()) {
            return;
        }
        RoundsLitePlayer player = existing.get();
        RoundsLiteRoom room = player.getRoom();
        room.getPlayers().removeIf(item -> Objects.equals(item.getUser().getId(), userId));
        if (room.getPlayers().isEmpty()) {
            roomRepository.delete(room);
            return;
        }
        normalizeSeats(room);
        resetRoomAfterLeave(room);
        roomRepository.saveAndFlush(room);
    }

    private void resetRoomAfterLeave(RoundsLiteRoom room) {
        room.setPhase("WAITING");
        room.setCountdownEndsAt(null);
        room.setProjectilesJson("[]");
        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);
        room.setMatchWinnerSeat(null);
        room.setMessage("상대가 방을 나갔습니다. 새 상대를 기다립니다.");
        room.setMatchmakingRoom(false);
        room.setLastTickAt(LocalDateTime.now());
        for (RoundsLitePlayer player : room.getPlayers()) {
            player.setReady(false);
            resetPlayerPosition(player);
            player.setHp(player.getMaxHp());
            player.setMoveLeft(false);
            player.setMoveRight(false);
            player.setJumpPressed(false);
            player.setShootPressed(false);
            player.setVx(0d);
            player.setVy(0d);
            player.setWins(0);
        }
        room.setRoundNo(1);
    }

    private void resetEntireMatch(RoundsLiteRoom room) {
        room.setPhase("WAITING");
        room.setRoundNo(1);
        room.setCountdownEndsAt(null);
        room.setProjectilesJson("[]");
        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);
        room.setMatchWinnerSeat(null);
        room.setMessage("새 매치를 시작했습니다. 두 플레이어가 준비해 주세요.");
        room.setMatchmakingRoom(false);
        room.setLastTickAt(LocalDateTime.now());
        for (RoundsLitePlayer player : room.getPlayers()) {
            player.setReady(false);
            player.setWins(0);
            player.setMaxHp(100);
            player.setHp(100);
            player.setMoveSpeed(280d);
            player.setJumpPower(620d);
            player.setBulletSpeed(540d);
            player.setBulletDamage(22);
            player.setCooldownMs(500);
            player.setProjectileRadius(10d);
            player.setKnockback(210d);
            player.setProjectileCount(1);
            player.setSpreadDeg(0d);
            player.setSelectedCardsCsv("");
            player.setLastShotAt(null);
            player.setMoveLeft(false);
            player.setMoveRight(false);
            player.setJumpPressed(false);
            player.setShootPressed(false);
            resetPlayerPosition(player);
        }
    }

    private void prepareRound(RoundsLiteRoom room) {
        room.setPhase("COUNTDOWN");
        room.setCountdownEndsAt(LocalDateTime.now().plusSeconds(2));
        room.setProjectilesJson("[]");
        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);
        room.setMatchWinnerSeat(null);
        room.setLastTickAt(LocalDateTime.now());
        room.setMessage("3초 후 결투가 시작됩니다.");
        for (RoundsLitePlayer player : room.getPlayers()) {
            player.setReady(false);
            player.setHp(player.getMaxHp());
            player.setMoveLeft(false);
            player.setMoveRight(false);
            player.setJumpPressed(false);
            player.setShootPressed(false);
            player.setLastShotAt(null);
            resetPlayerPosition(player);
        }
    }

    private void resetPlayerPosition(RoundsLitePlayer player) {
        if ("P1".equals(player.getSeat())) {
            player.setX(180d);
            player.setFacingRight(true);
        } else {
            player.setX(ARENA_WIDTH - 180d - PLAYER_WIDTH);
            player.setFacingRight(false);
        }
        player.setY(FLOOR_Y - PLAYER_HEIGHT);
        player.setVx(0d);
        player.setVy(0d);
        player.setOnGround(true);
    }

    private void simulateRoom(RoundsLiteRoom room) {
        LocalDateTime now = LocalDateTime.now();
        if (room.getLastTickAt() == null) {
            room.setLastTickAt(now);
        }

        if ("COUNTDOWN".equals(room.getPhase()) && room.getCountdownEndsAt() != null && !now.isBefore(room.getCountdownEndsAt())) {
            room.setPhase("ACTIVE");
            room.setMessage("결투 시작! A/D 이동, W 점프, 스페이스 발사");
        }

        if (!"ACTIVE".equals(room.getPhase())) {
            room.setLastTickAt(now);
            return;
        }

        double elapsed = Math.min(MAX_SIM_SECONDS, millisBetween(room.getLastTickAt(), now) / 1000d);
        if (elapsed <= 0d) {
            return;
        }

        List<ProjectileState> projectiles = readProjectiles(room.getProjectilesJson());
        int steps = Math.max(1, (int) Math.ceil(elapsed / TICK_SECONDS));
        double dt = elapsed / steps;

        for (int i = 0; i < steps; i++) {
            for (RoundsLitePlayer player : room.getPlayers()) {
                updatePlayerInput(player, dt);
                maybeFireProjectile(player, room, projectiles);
            }
            updateProjectiles(room, projectiles, dt);
            if (!"ACTIVE".equals(room.getPhase())) {
                break;
            }
        }

        room.setProjectilesJson(writeJson(projectiles));
        room.setLastTickAt(now);
    }

    private void updatePlayerInput(RoundsLitePlayer player, double dt) {
        double vx = 0d;
        if (Boolean.TRUE.equals(player.getMoveLeft())) {
            vx -= player.getMoveSpeed();
            player.setFacingRight(false);
        }
        if (Boolean.TRUE.equals(player.getMoveRight())) {
            vx += player.getMoveSpeed();
            player.setFacingRight(true);
        }
        player.setVx(vx);

        if (Boolean.TRUE.equals(player.getJumpPressed()) && Boolean.TRUE.equals(player.getOnGround())) {
            player.setVy(-player.getJumpPower());
            player.setOnGround(false);
        }

        player.setVy(player.getVy() + GRAVITY * dt);
        player.setX(clamp(player.getX() + player.getVx() * dt, 0d, ARENA_WIDTH - PLAYER_WIDTH));
        player.setY(player.getY() + player.getVy() * dt);

        resolveVerticalCollision(player);
    }

    private void resolveVerticalCollision(RoundsLitePlayer player) {
        List<Platform> platforms = platforms();
        boolean grounded = false;
        for (Platform platform : platforms) {
            double playerBottom = player.getY() + PLAYER_HEIGHT;
            double previousBottom = playerBottom - player.getVy() * TICK_SECONDS;
            boolean overlapsX = player.getX() + PLAYER_WIDTH > platform.x && player.getX() < platform.x + platform.w;
            if (overlapsX && player.getVy() >= 0d && previousBottom <= platform.y && playerBottom >= platform.y) {
                player.setY(platform.y - PLAYER_HEIGHT);
                player.setVy(0d);
                grounded = true;
            }
        }
        if (player.getY() + PLAYER_HEIGHT >= FLOOR_Y) {
            player.setY(FLOOR_Y - PLAYER_HEIGHT);
            player.setVy(0d);
            grounded = true;
        }
        player.setOnGround(grounded);
    }

    private void maybeFireProjectile(RoundsLitePlayer player, RoundsLiteRoom room, List<ProjectileState> projectiles) {
        if (!Boolean.TRUE.equals(player.getShootPressed())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        if (player.getLastShotAt() != null && millisBetween(player.getLastShotAt(), now) < player.getCooldownMs()) {
            return;
        }
        player.setLastShotAt(now);

        int count = Math.max(1, player.getProjectileCount());
        double baseAngle = player.getFacingRight() ? 0d : Math.PI;
        for (int i = 0; i < count; i++) {
            double angleOffsetDeg = count == 1 ? 0d : (i - (count - 1) / 2d) * player.getSpreadDeg();
            double angle = baseAngle + Math.toRadians(angleOffsetDeg);
            double speed = player.getBulletSpeed();
            double vx = Math.cos(angle) * speed;
            double vy = Math.sin(angle) * speed;
            double startX = player.getX() + (player.getFacingRight() ? PLAYER_WIDTH + 8d : -8d);
            double startY = player.getY() + PLAYER_HEIGHT * 0.45d;
            projectiles.add(ProjectileState.builder()
                    .id(UUID.randomUUID().toString())
                    .ownerSeat(player.getSeat())
                    .x(startX)
                    .y(startY)
                    .vx(vx)
                    .vy(vy)
                    .radius(player.getProjectileRadius())
                    .damage(player.getBulletDamage())
                    .knockback(player.getKnockback())
                    .ttl(2.2d)
                    .build());
        }
    }

    private void updateProjectiles(RoundsLiteRoom room, List<ProjectileState> projectiles, double dt) {
        Iterator<ProjectileState> iterator = projectiles.iterator();
        while (iterator.hasNext()) {
            ProjectileState projectile = iterator.next();
            projectile.setX(projectile.getX() + projectile.getVx() * dt);
            projectile.setY(projectile.getY() + projectile.getVy() * dt);
            projectile.setTtl(projectile.getTtl() - dt);

            if (projectile.getTtl() <= 0d || projectile.getX() < -50d || projectile.getX() > ARENA_WIDTH + 50d || projectile.getY() < -50d || projectile.getY() > ARENA_HEIGHT + 50d) {
                iterator.remove();
                continue;
            }

            for (RoundsLitePlayer target : room.getPlayers()) {
                if (projectile.getOwnerSeat().equals(target.getSeat())) {
                    continue;
                }
                if (intersects(projectile, target)) {
                    target.setHp(Math.max(0, target.getHp() - projectile.getDamage()));
                    double direction = projectile.getVx() >= 0 ? 1d : -1d;
                    target.setVx(direction * projectile.getKnockback());
                    target.setVy(-projectile.getKnockback() * 0.45d);
                    target.setOnGround(false);
                    iterator.remove();

                    if (target.getHp() <= 0) {
                        handleRoundWin(room, projectile.getOwnerSeat());
                    }
                    break;
                }
            }
        }
    }

    private void handleRoundWin(RoundsLiteRoom room, String winnerSeat) {
        if (!"ACTIVE".equals(room.getPhase())) {
            return;
        }
        RoundsLitePlayer winner = room.getPlayers().stream()
                .filter(player -> winnerSeat.equals(player.getSeat()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("승자 정보를 찾을 수 없습니다."));
        winner.setWins(winner.getWins() + 1);
        room.setRoundWinnerSeat(winnerSeat);

        if (winner.getWins() >= room.getTargetWins()) {
            room.setPhase("MATCH_END");
            room.setMatchWinnerSeat(winnerSeat);
            room.setPickerSeat(null);
            room.setCardOptionsJson("[]");
            room.setMessage(winner.getName() + " 님이 최종 승리했습니다.");
            return;
        }

        room.setPhase("CARD_PICK");
        room.setPickerSeat(winnerSeat);
        room.setCardOptionsJson(writeJson(drawCards()));
        room.setProjectilesJson("[]");
        room.setMessage(winner.getName() + " 님이 라운드 승리! 카드 1장을 선택하세요.");
    }

    private List<CardOption> drawCards() {
        List<CardOption> pool = new ArrayList<>(cardPool());
        Collections.shuffle(pool);
        return pool.subList(0, Math.min(3, pool.size()));
    }

    private void applyCard(RoundsLitePlayer player, CardOption card) {
        switch (card.getKey()) {
            case "POWER_SHOT" -> player.setBulletDamage(player.getBulletDamage() + 8);
            case "RAPID_FIRE" -> player.setCooldownMs(Math.max(180, player.getCooldownMs() - 110));
            case "LIGHT_FEET" -> player.setMoveSpeed(player.getMoveSpeed() + 45d);
            case "HIGH_JUMP" -> player.setJumpPower(player.getJumpPower() + 90d);
            case "BIG_ROUND" -> player.setProjectileRadius(player.getProjectileRadius() + 4d);
            case "DOUBLE_SHOT" -> {
                player.setProjectileCount(Math.min(3, player.getProjectileCount() + 1));
                player.setSpreadDeg(Math.max(10d, player.getSpreadDeg() + 12d));
            }
            case "IRON_BODY" -> {
                player.setMaxHp(player.getMaxHp() + 20);
                player.setHp(player.getMaxHp());
            }
            case "HEAVY_HIT" -> player.setKnockback(player.getKnockback() + 70d);
            default -> throw new RuntimeException("지원하지 않는 카드입니다.");
        }
    }

    private boolean intersects(ProjectileState projectile, RoundsLitePlayer player) {
        double closestX = clamp(projectile.getX(), player.getX(), player.getX() + PLAYER_WIDTH);
        double closestY = clamp(projectile.getY(), player.getY(), player.getY() + PLAYER_HEIGHT);
        double dx = projectile.getX() - closestX;
        double dy = projectile.getY() - closestY;
        return dx * dx + dy * dy <= projectile.getRadius() * projectile.getRadius();
    }

    private RoundsLiteRoom getRoom(String roomCode) {
        return roomRepository.findByRoomCode(normalize(roomCode))
                .orElseThrow(() -> new RuntimeException("존재하지 않는 방입니다."));
    }

    private RoundsLitePlayer requireMember(RoundsLiteRoom room, Long userId) {
        return room.getPlayers().stream()
                .filter(player -> Objects.equals(player.getUser().getId(), userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("이 방에 참가한 사용자만 접근할 수 있습니다."));
    }

    private RoundsLitePlayer createBasePlayer(RoundsLiteRoom room, User user, String seat) {
        return RoundsLitePlayer.builder()
                .room(room)
                .user(user)
                .seat(seat)
                .name(resolveDisplayName(user))
                .ready(false)
                .wins(0)
                .x(0d)
                .y(0d)
                .vx(0d)
                .vy(0d)
                .hp(100)
                .maxHp(100)
                .moveSpeed(280d)
                .jumpPower(620d)
                .bulletSpeed(540d)
                .bulletDamage(22)
                .cooldownMs(500)
                .projectileRadius(10d)
                .knockback(210d)
                .projectileCount(1)
                .spreadDeg(0d)
                .facingRight("P1".equals(seat))
                .onGround(true)
                .moveLeft(false)
                .moveRight(false)
                .jumpPressed(false)
                .shootPressed(false)
                .selectedCardsCsv("")
                .build();
    }


    private String resolveDisplayName(User user) {
        if (user == null) {
            return "Player";
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        return "Player";
    }

    private GameDtos.RoundsLiteRoomResponse toResponse(RoundsLiteRoom room, Long userId) {
        String mySeat = room.getPlayers().stream()
                .filter(player -> Objects.equals(player.getUser().getId(), userId))
                .map(RoundsLitePlayer::getSeat)
                .findFirst()
                .orElse(null);

        List<GameDtos.RoundsLitePlayerView> players = room.getPlayers().stream()
                .map(player -> GameDtos.RoundsLitePlayerView.builder()
                        .userId(player.getUser().getId())
                        .seat(player.getSeat())
                        .name(player.getName())
                        .ready(Boolean.TRUE.equals(player.getReady()))
                        .wins(player.getWins())
                        .hp(player.getHp())
                        .maxHp(player.getMaxHp())
                        .x(player.getX())
                        .y(player.getY())
                        .width(PLAYER_WIDTH)
                        .height(PLAYER_HEIGHT)
                        .facingRight(Boolean.TRUE.equals(player.getFacingRight()))
                        .selectedCards(parseCards(player.getSelectedCardsCsv()))
                        .build())
                .collect(Collectors.toList());

        List<GameDtos.RoundsLiteProjectileView> projectiles = readProjectiles(room.getProjectilesJson()).stream()
                .map(projectile -> GameDtos.RoundsLiteProjectileView.builder()
                        .id(projectile.getId())
                        .ownerSeat(projectile.getOwnerSeat())
                        .x(projectile.getX())
                        .y(projectile.getY())
                        .radius(projectile.getRadius())
                        .build())
                .collect(Collectors.toList());

        List<GameDtos.RoundsLiteCardOptionView> cardOptions = readCards(room.getCardOptionsJson()).stream()
                .map(card -> GameDtos.RoundsLiteCardOptionView.builder()
                        .key(card.getKey())
                        .title(card.getTitle())
                        .description(card.getDescription())
                        .build())
                .collect(Collectors.toList());

        return GameDtos.RoundsLiteRoomResponse.builder()
                .roomCode(room.getRoomCode())
                .phase(room.getPhase())
                .mySeat(mySeat)
                .pickerSeat(room.getPickerSeat())
                .roundWinnerSeat(room.getRoundWinnerSeat())
                .matchWinnerSeat(room.getMatchWinnerSeat())
                .message(room.getMessage())
                .roundNo(room.getRoundNo())
                .targetWins(room.getTargetWins())
                .countdownEndsAt(room.getCountdownEndsAt())
                .matchmakingRoom(Boolean.TRUE.equals(room.getMatchmakingRoom()))
                .matchmakingQueued(Boolean.TRUE.equals(room.getMatchmakingRoom()) && room.getPlayers().size() < 2)
                .players(players)
                .projectiles(projectiles)
                .cardOptions(cardOptions)
                .build();
    }

    private List<Platform> platforms() {
        return List.of(
                new Platform(0d, FLOOR_Y, ARENA_WIDTH, ARENA_HEIGHT - FLOOR_Y),
                new Platform(200d, 360d, 180d, 18d),
                new Platform(580d, 300d, 180d, 18d),
                new Platform(390d, 420d, 180d, 18d)
        );
    }

    private List<CardOption> cardPool() {
        return List.of(
                new CardOption("POWER_SHOT", "강한 탄환", "투사체 피해량 +8"),
                new CardOption("RAPID_FIRE", "속사", "발사 쿨타임 감소"),
                new CardOption("LIGHT_FEET", "경량화", "이동 속도 증가"),
                new CardOption("HIGH_JUMP", "고공 도약", "점프력이 더 높아짐"),
                new CardOption("BIG_ROUND", "대구경", "탄 크기 증가"),
                new CardOption("DOUBLE_SHOT", "더블 샷", "탄 1발 추가 발사"),
                new CardOption("IRON_BODY", "강철 몸체", "최대 체력 +20"),
                new CardOption("HEAVY_HIT", "강한 넉백", "맞췄을 때 밀어내는 힘 증가")
        );
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(ThreadLocalRandom.current().nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String normalize(String roomCode) {
        return roomCode == null ? "" : roomCode.trim().toUpperCase();
    }

    private void normalizeSeats(RoundsLiteRoom room) {
        List<RoundsLitePlayer> ordered = new ArrayList<>(room.getPlayers());
        ordered.sort(Comparator.comparing(RoundsLitePlayer::getSeat));
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSeat(i == 0 ? "P1" : "P2");
            resetPlayerPosition(ordered.get(i));
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private long millisBetween(LocalDateTime start, LocalDateTime end) {
        return java.time.Duration.between(start, end).toMillis();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new RuntimeException("게임 상태 저장 중 오류가 발생했습니다.");
        }
    }

    private List<ProjectileState> readProjectiles(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<ProjectileState>>() {
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<CardOption> readCards(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<CardOption>>() {
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String appendCard(String csv, String title) {
        if (csv == null || csv.isBlank()) {
            return title;
        }
        return csv + "," + title;
    }

    private List<String> parseCards(String csv) {
        if (csv == null || csv.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    private static class ProjectileState {
        private String id;
        private String ownerSeat;
        private double x;
        private double y;
        private double vx;
        private double vy;
        private double radius;
        private int damage;
        private double knockback;
        private double ttl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class CardOption {
        private String key;
        private String title;
        private String description;
    }

    private record Platform(double x, double y, double w, double h) {}
}
