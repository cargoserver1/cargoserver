package com.logistics.app.service;

import com.logistics.app.dto.GameDtos;
import com.logistics.app.entity.QuickDrawParticipantEntity;
import com.logistics.app.entity.QuickDrawRoomEntity;
import com.logistics.app.entity.User;
import com.logistics.app.repository.QuickDrawParticipantRepository;
import com.logistics.app.repository.QuickDrawRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class QuickDrawGameService {

    private static final int TARGET_SCORE = 3;
    private static final int MIN_DELAY_MS = 2500;
    private static final int MAX_DELAY_MS = 5200;

    private final QuickDrawRoomRepository roomRepository;
    private final QuickDrawParticipantRepository participantRepository;

    public QuickDrawGameService(
            QuickDrawRoomRepository roomRepository,
            QuickDrawParticipantRepository participantRepository
    ) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public GameDtos.QuickDrawRoomResponse createRoom(User user) {
        clearExistingSeat(user.getId(), null);

        String roomCode;
        do {
            roomCode = generateRoomCode();
        } while (roomRepository.existsByRoomCode(roomCode));

        QuickDrawRoomEntity room = QuickDrawRoomEntity.builder()
                .roomCode(roomCode)
                .phase("WAITING")
                .winnerSeat(null)
                .lastRoundMessage("방이 생성되었습니다. 상대를 기다립니다.")
                .targetScore(TARGET_SCORE)
                .drawAt(null)
                .active(true)
                .build();

        QuickDrawParticipantEntity host = QuickDrawParticipantEntity.builder()
                .user(user)
                .seat("P1")
                .ready(false)
                .score(0)
                .shotAt(null)
                .build();

        room.addParticipant(host);
        roomRepository.save(room);

        return toResponse(room, user.getId());
    }

    @Transactional
    public GameDtos.QuickDrawRoomResponse joinRoom(String roomCode, User user) {
        String normalizedCode = normalizeCode(roomCode);
        clearExistingSeat(user.getId(), normalizedCode);

        QuickDrawRoomEntity room = getRoomForUpdate(normalizedCode);
        refreshRoom(room);

        QuickDrawParticipantEntity existing = findPlayer(room, user.getId());
        if (existing != null) {
            return toResponse(room, user.getId());
        }
        if (room.getParticipants().size() >= 2) {
            throw new IllegalStateException("이미 가득 찬 방입니다.");
        }

        QuickDrawParticipantEntity participant = QuickDrawParticipantEntity.builder()
                .user(user)
                .seat("P2")
                .ready(false)
                .score(0)
                .shotAt(null)
                .build();

        room.addParticipant(participant);
        room.setPhase("WAITING");
        room.setWinnerSeat(null);
        room.setDrawAt(null);
        room.setLastRoundMessage("두 플레이어가 준비하면 대결이 시작됩니다.");

        return toResponse(room, user.getId());
    }

    @Transactional
    public GameDtos.QuickDrawRoomResponse getRoomState(String roomCode, User user) {
        QuickDrawRoomEntity room = getRoomForUpdate(roomCode);
        refreshRoom(room);
        return toResponse(room, user.getId());
    }

    @Transactional
    public GameDtos.QuickDrawRoomResponse ready(String roomCode, User user) {
        QuickDrawRoomEntity room = getRoomForUpdate(roomCode);
        refreshRoom(room);

        QuickDrawParticipantEntity me = requirePlayer(room, user.getId());
        if (room.getParticipants().size() < 2) {
            throw new IllegalStateException("상대가 참가해야 준비할 수 있습니다.");
        }
        if ("COUNTDOWN".equals(room.getPhase()) || "DRAWABLE".equals(room.getPhase())) {
            throw new IllegalStateException("현재 라운드가 이미 진행 중입니다.");
        }
        if ("MATCH_END".equals(room.getPhase())) {
            throw new IllegalStateException("매치가 끝났습니다. 새 게임 버튼을 눌러주세요.");
        }

        me.setReady(true);
        room.setLastRoundMessage(me.getUser().getName() + " 님이 준비했습니다.");

        boolean allReady = room.getParticipants().stream().allMatch(QuickDrawParticipantEntity::isReady);
        if (allReady) {
            startCountdown(room);
        }

        return toResponse(room, user.getId());
    }

    @Transactional
    public GameDtos.QuickDrawRoomResponse shoot(String roomCode, User user) {
        QuickDrawRoomEntity room = getRoomForUpdate(roomCode);
        refreshRoom(room);

        QuickDrawParticipantEntity me = requirePlayer(room, user.getId());
        QuickDrawParticipantEntity opponent = findOpponent(room, user.getId());

        if (opponent == null) {
            throw new IllegalStateException("상대가 아직 없습니다.");
        }
        if (me.getShotAt() != null) {
            throw new IllegalStateException("이미 발사했습니다.");
        }
        if ("WAITING".equals(room.getPhase())) {
            throw new IllegalStateException("두 플레이어가 준비해야 합니다.");
        }
        if ("ROUND_END".equals(room.getPhase()) || "MATCH_END".equals(room.getPhase())) {
            throw new IllegalStateException("라운드가 이미 종료되었습니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        me.setShotAt(now);

        if (!"DRAWABLE".equals(room.getPhase())) {
            finishRound(room, opponent.getSeat(), me.getUser().getName() + " 님이 성급하게 발사해서 반칙 패배했습니다.");
            return toResponse(room, user.getId());
        }

        if (opponent.getShotAt() == null || now.isBefore(opponent.getShotAt())) {
            finishRound(room, me.getSeat(), me.getUser().getName() + " 님이 더 빨리 발사해 승리했습니다.");
        } else if (now.isEqual(opponent.getShotAt())) {
            finishDraw(room, "동시에 발사했습니다. 이번 라운드는 무승부입니다.");
        } else {
            finishRound(room, opponent.getSeat(), opponent.getUser().getName() + " 님이 더 빨리 발사해 승리했습니다.");
        }

        return toResponse(room, user.getId());
    }

    @Transactional
    public GameDtos.QuickDrawRoomResponse resetRoom(String roomCode, User user) {
        QuickDrawRoomEntity room = getRoomForUpdate(roomCode);
        requirePlayer(room, user.getId());

        for (QuickDrawParticipantEntity participant : room.getParticipants()) {
            participant.setScore(0);
            participant.setReady(false);
            participant.setShotAt(null);
        }

        room.setPhase("WAITING");
        room.setDrawAt(null);
        room.setWinnerSeat(null);
        room.setLastRoundMessage("새 매치가 초기화되었습니다. 다시 준비해 주세요.");

        return toResponse(room, user.getId());
    }

    @Transactional
    public void leaveRoom(String roomCode, User user) {
        QuickDrawRoomEntity room = getRoomForUpdate(roomCode);
        QuickDrawParticipantEntity me = requirePlayer(room, user.getId());

        room.removeParticipant(me);

        if (room.getParticipants().isEmpty()) {
            room.setActive(false);
            room.setPhase("WAITING");
            room.setDrawAt(null);
            room.setWinnerSeat(null);
            room.setLastRoundMessage("방이 종료되었습니다.");
            return;
        }

        normalizeSingleSurvivor(room);
    }

    @Transactional
    public void clearExistingSeat(Long userId, String excludedRoomCode) {
        List<QuickDrawParticipantEntity> activeSeats = participantRepository.findAllActiveByUserId(userId);
        for (QuickDrawParticipantEntity activeSeat : activeSeats) {
            QuickDrawRoomEntity room = roomRepository
                    .findActiveRoomForUpdate(activeSeat.getRoom().getRoomCode())
                    .orElse(null);

            if (room == null) {
                continue;
            }
            if (excludedRoomCode != null && room.getRoomCode().equals(excludedRoomCode)) {
                continue;
            }

            QuickDrawParticipantEntity participant = findPlayer(room, userId);
            if (participant == null) {
                continue;
            }

            room.removeParticipant(participant);

            if (room.getParticipants().isEmpty()) {
                room.setActive(false);
                room.setPhase("WAITING");
                room.setDrawAt(null);
                room.setWinnerSeat(null);
                room.setLastRoundMessage("방이 종료되었습니다.");
            } else {
                normalizeSingleSurvivor(room);
            }
        }
    }

    private void normalizeSingleSurvivor(QuickDrawRoomEntity room) {
        QuickDrawParticipantEntity survivor = room.getParticipants().stream()
                .min(Comparator.comparing(QuickDrawParticipantEntity::getJoinedAt))
                .orElseThrow(() -> new IllegalStateException("참가자를 찾을 수 없습니다."));

        survivor.setSeat("P1");
        survivor.setReady(false);
        survivor.setShotAt(null);
        survivor.setScore(0);

        room.setPhase("WAITING");
        room.setDrawAt(null);
        room.setWinnerSeat(null);
        room.setLastRoundMessage("상대가 방을 나갔습니다. 새 상대를 기다립니다.");
    }

    private void refreshRoom(QuickDrawRoomEntity room) {
        if ("COUNTDOWN".equals(room.getPhase())
                && room.getDrawAt() != null
                && !LocalDateTime.now().isBefore(room.getDrawAt())) {
            room.setPhase("DRAWABLE");
            room.setLastRoundMessage("지금 발사할 수 있습니다.");
        }
    }

    private void startCountdown(QuickDrawRoomEntity room) {
        for (QuickDrawParticipantEntity participant : room.getParticipants()) {
            participant.setShotAt(null);
        }
        room.setWinnerSeat(null);
        room.setPhase("COUNTDOWN");
        room.setDrawAt(LocalDateTime.now().plusNanos(randomDelayMs() * 1_000_000L));
        room.setLastRoundMessage("신호가 뜨면 발사하세요. 먼저 누르면 반칙입니다.");
    }

    private void finishRound(QuickDrawRoomEntity room, String winnerSeat, String message) {
        room.setPhase("ROUND_END");
        room.setWinnerSeat(winnerSeat);
        room.setDrawAt(null);

        QuickDrawParticipantEntity winner = room.getParticipants().stream()
                .filter(participant -> winnerSeat.equals(participant.getSeat()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("승리 플레이어를 찾을 수 없습니다."));

        winner.setScore(winner.getScore() + 1);
        room.setLastRoundMessage(message);

        if (winner.getScore() >= room.getTargetScore()) {
            room.setPhase("MATCH_END");
            room.setLastRoundMessage(winner.getUser().getName() + " 님이 매치에서 승리했습니다.");
        }

        resetReadyForNextRound(room);
    }

    private void finishDraw(QuickDrawRoomEntity room, String message) {
        room.setPhase("ROUND_END");
        room.setWinnerSeat(null);
        room.setDrawAt(null);
        room.setLastRoundMessage(message);
        resetReadyForNextRound(room);
    }

    private void resetReadyForNextRound(QuickDrawRoomEntity room) {
        for (QuickDrawParticipantEntity participant : room.getParticipants()) {
            participant.setReady(false);
        }
    }

    private QuickDrawRoomEntity getRoomForUpdate(String roomCode) {
        return roomRepository.findActiveRoomForUpdate(normalizeCode(roomCode))
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 방입니다."));
    }

    private QuickDrawParticipantEntity findPlayer(QuickDrawRoomEntity room, Long userId) {
        return room.getParticipants().stream()
                .filter(participant -> Objects.equals(participant.getUser().getId(), userId))
                .findFirst()
                .orElse(null);
    }

    private QuickDrawParticipantEntity requirePlayer(QuickDrawRoomEntity room, Long userId) {
        QuickDrawParticipantEntity player = findPlayer(room, userId);
        if (player == null) {
            throw new IllegalStateException("이 방의 참가자가 아닙니다.");
        }
        return player;
    }

    private QuickDrawParticipantEntity findOpponent(QuickDrawRoomEntity room, Long userId) {
        return room.getParticipants().stream()
                .filter(participant -> !Objects.equals(participant.getUser().getId(), userId))
                .findFirst()
                .orElse(null);
    }

    private int randomDelayMs() {
        return ThreadLocalRandom.current().nextInt(MIN_DELAY_MS, MAX_DELAY_MS + 1);
    }

    private String generateRoomCode() {
        String letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            int index = ThreadLocalRandom.current().nextInt(letters.length());
            builder.append(letters.charAt(index));
        }
        return builder.toString();
    }

    private String normalizeCode(String roomCode) {
        return roomCode == null ? "" : roomCode.trim().toUpperCase();
    }

    private GameDtos.QuickDrawRoomResponse toResponse(QuickDrawRoomEntity room, Long currentUserId) {
        List<QuickDrawParticipantEntity> sortedParticipants = room.getParticipants().stream()
                .sorted(Comparator.comparing(QuickDrawParticipantEntity::getSeat))
                .toList();

        String mySeat = sortedParticipants.stream()
                .filter(participant -> Objects.equals(participant.getUser().getId(), currentUserId))
                .map(QuickDrawParticipantEntity::getSeat)
                .findFirst()
                .orElse(null);

        return GameDtos.QuickDrawRoomResponse.builder()
                .roomCode(room.getRoomCode())
                .phase(room.getPhase())
                .mySeat(mySeat)
                .winnerSeat(room.getWinnerSeat())
                .lastRoundMessage(room.getLastRoundMessage())
                .targetScore(room.getTargetScore())
                .drawAt(room.getDrawAt())
                .players(sortedParticipants.stream()
                        .map(participant -> GameDtos.QuickDrawPlayerView.builder()
                                .userId(participant.getUser().getId())
                                .seat(participant.getSeat())
                                .name(participant.getUser().getName())
                                .ready(participant.isReady())
                                .score(participant.getScore())
                                .shotAt(participant.getShotAt())
                                .build())
                        .toList())
                .build();
    }
}
