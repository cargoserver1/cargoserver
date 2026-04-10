package com.logistics.app.controller;

import com.logistics.app.dto.ChatDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.ChatService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    public ChatController(ChatService chatService, AuthService authService) {
        this.chatService = chatService;
        this.authService = authService;
    }

    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public List<ChatDtos.ChatRoomSummaryRow> rooms(Authentication authentication) {
        return chatService.getRooms(currentUser(authentication));
    }

    @GetMapping("/rooms/{targetUserId}")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public ChatDtos.ChatRoomResponse room(@PathVariable Long targetUserId, Authentication authentication) {
        return chatService.getRoom(currentUser(authentication), targetUserId);
    }

    @PostMapping("/rooms/{targetUserId}/read")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public Map<String, Object> markRead(@PathVariable Long targetUserId, Authentication authentication) {
        chatService.markRoomAsRead(currentUser(authentication), targetUserId);
        return Map.of("success", true);
    }

    @PostMapping("/rooms/{targetUserId}/messages")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public ChatDtos.ChatMessageRow send(@PathVariable Long targetUserId,
                                        @RequestBody ChatDtos.SendMessageRequest request,
                                        Authentication authentication) {
        return chatService.sendMessage(currentUser(authentication), targetUserId, request.getContent());
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
