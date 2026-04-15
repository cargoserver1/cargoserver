package com.logistics.app.controller;

import com.logistics.app.dto.GameDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.RoundsLiteService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game/rounds-lite")
public class RoundsLiteController {

    private final RoundsLiteService roundsLiteService;
    private final AuthService authService;

    public RoundsLiteController(RoundsLiteService roundsLiteService, AuthService authService) {
        this.roundsLiteService = roundsLiteService;
        this.authService = authService;
    }

    @PostMapping("/rooms")
    public GameDtos.RoundsLiteRoomResponse createRoom(Authentication authentication) {
        return roundsLiteService.createRoom(currentUser(authentication));
    }

    @PostMapping("/matchmaking/join")
    public GameDtos.RoundsLiteRoomResponse joinMatchmaking(Authentication authentication) {
        return roundsLiteService.joinMatchmaking(currentUser(authentication));
    }

    @PostMapping("/matchmaking/{roomCode}/cancel")
    public void cancelMatchmaking(@PathVariable String roomCode, Authentication authentication) {
        roundsLiteService.cancelMatchmaking(roomCode, currentUser(authentication));
    }

    @PostMapping("/rooms/join")
    public GameDtos.RoundsLiteRoomResponse joinRoom(
            @RequestBody GameDtos.JoinRoomRequest request,
            Authentication authentication
    ) {
        return roundsLiteService.joinRoom(request.getRoomCode(), currentUser(authentication));
    }

    @GetMapping("/rooms/{roomCode}")
    public GameDtos.RoundsLiteRoomResponse getState(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return roundsLiteService.getState(roomCode, currentUser(authentication));
    }

    @PostMapping("/rooms/{roomCode}/ready")
    public GameDtos.RoundsLiteRoomResponse ready(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return roundsLiteService.ready(roomCode, currentUser(authentication));
    }

    @PostMapping("/rooms/{roomCode}/input")
    public GameDtos.RoundsLiteRoomResponse input(
            @PathVariable String roomCode,
            @RequestBody GameDtos.RoundsLiteInputRequest request,
            Authentication authentication
    ) {
        return roundsLiteService.applyInput(roomCode, currentUser(authentication), request);
    }

    @PostMapping("/rooms/{roomCode}/select-card")
    public GameDtos.RoundsLiteRoomResponse selectCard(
            @PathVariable String roomCode,
            @RequestBody GameDtos.RoundsLiteSelectCardRequest request,
            Authentication authentication
    ) {
        return roundsLiteService.selectCard(roomCode, currentUser(authentication), request.getCardKey());
    }

    @PostMapping("/rooms/{roomCode}/reset")
    public GameDtos.RoundsLiteRoomResponse reset(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return roundsLiteService.resetMatch(roomCode, currentUser(authentication));
    }

    @DeleteMapping("/rooms/{roomCode}")
    public void leave(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        roundsLiteService.leaveRoom(roomCode, currentUser(authentication));
    }

    @GetMapping("/health")
    public String health() {
        return "rounds-lite-ok";
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("로그인이 필요합니다. 다시 로그인해 주세요.");
        }

        User user = authService.getCurrentUser(authentication.getName());
        if (user == null) {
            throw new RuntimeException("로그인 사용자를 찾을 수 없습니다. 다시 로그인해 주세요.");
        }
        return user;
    }
}
