package com.logistics.app.controller;

import com.logistics.app.dto.UserNotificationDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {

    private final NotificationService notificationService;
    private final AuthService authService;

    public InteractionController(NotificationService notificationService, AuthService authService) {
        this.notificationService = notificationService;
        this.authService = authService;
    }

    @GetMapping("/notifications")
    public UserNotificationDtos.NotificationSummary getNotifications(Authentication authentication) {
        User currentUser = authService.getCurrentUser(authentication.getName());
        return notificationService.getUnreadSummary(currentUser.getId());
    }

    @GetMapping("/notifications/all")
    public List<UserNotificationDtos.NotificationItem> getAllNotifications(Authentication authentication) {
        User currentUser = authService.getCurrentUser(authentication.getName());
        return notificationService.getAllNotifications(currentUser.getId());
    }

    @PostMapping("/notifications/{id}/read")
    public Map<String, Object> markNotificationRead(@PathVariable Long id, Authentication authentication) {
        User currentUser = authService.getCurrentUser(authentication.getName());
        notificationService.markRead(currentUser.getId(), id);
        return Map.of("success", true);
    }

    @PostMapping("/notifications/read-all")
    public Map<String, Object> markAllNotificationsRead(Authentication authentication) {
        User currentUser = authService.getCurrentUser(authentication.getName());
        notificationService.markAllRead(currentUser.getId());
        return Map.of("success", true);
    }
}