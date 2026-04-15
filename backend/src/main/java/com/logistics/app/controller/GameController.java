package com.logistics.app.controller;

import com.logistics.app.dto.GameDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.QuickDrawGameService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game/quickdraw")
public class GameController {

    private final QuickDrawGameService quickDrawGameService;
    private final AuthService authService;

    public GameController(QuickDrawGameService quickDrawGameService, AuthService authService) {
        this.quickDrawGameService = quickDrawGameService;
        this.authService = authService;
    }

    @PostMapping("/rooms")
    public GameDtos.QuickDrawRoomResponse createRoom(Authentication authentication) {
        return quickDrawGameService.createRoom(currentUser(authentication));
    }

    @PostMapping("/rooms/join")
    public GameDtos.QuickDrawRoomResponse joinRoom(
            @RequestBody GameDtos.JoinRoomRequest request,
            Authentication authentication
    ) {
        return quickDrawGameService.joinRoom(request.getRoomCode(), currentUser(authentication));
    }

    @GetMapping("/rooms/{roomCode}")
    public GameDtos.QuickDrawRoomResponse getRoomState(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return quickDrawGameService.getRoomState(roomCode, currentUser(authentication));
    }

    @PostMapping("/rooms/{roomCode}/ready")
    public GameDtos.QuickDrawRoomResponse ready(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return quickDrawGameService.ready(roomCode, currentUser(authentication));
    }

    @PostMapping("/rooms/{roomCode}/shoot")
    public GameDtos.QuickDrawRoomResponse shoot(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return quickDrawGameService.shoot(roomCode, currentUser(authentication));
    }

    @PostMapping("/rooms/{roomCode}/reset")
    public GameDtos.QuickDrawRoomResponse reset(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        return quickDrawGameService.resetRoom(roomCode, currentUser(authentication));
    }

    @DeleteMapping("/rooms/{roomCode}")
    public void leave(@PathVariable String roomCode, Authentication authentication) {
        quickDrawGameService.leaveRoom(roomCode, currentUser(authentication));
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("로그인이 필요합니다. 다시 로그인해 주세요.");
        }
        return authService.getCurrentUser(authentication.getName());
    }
}
