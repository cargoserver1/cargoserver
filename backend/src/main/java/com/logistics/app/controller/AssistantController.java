package com.logistics.app.controller;

import com.logistics.app.dto.AssistantDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AssistantService;
import com.logistics.app.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final AuthService authService;

    public AssistantController(AssistantService assistantService, AuthService authService) {
        this.assistantService = assistantService;
        this.authService = authService;
    }

    @PostMapping("/chat")
    public AssistantDtos.ChatResponse chat(@RequestBody AssistantDtos.ChatRequest request,
                                           Authentication authentication) {
        return assistantService.chat(currentUser(authentication), request);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return authService.getCurrentUser(authentication.getName());
    }
}
