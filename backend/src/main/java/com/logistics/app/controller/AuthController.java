package com.logistics.app.controller;

import com.logistics.app.dto.AuthDtos;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/signup")
    public AuthDtos.AuthResponse signup(@Valid @RequestBody AuthDtos.SignUpRequest request) {
        return authService.signUp(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/password-reset/send-code")
    public AuthDtos.GenericMessageResponse sendPasswordResetCode(
            @Valid @RequestBody AuthDtos.PasswordResetSendCodeRequest request
    ) {
        return passwordResetService.sendCode(request);
    }

    @PostMapping("/password-reset/verify-code")
    public AuthDtos.PasswordResetVerifyResponse verifyPasswordResetCode(
            @Valid @RequestBody AuthDtos.PasswordResetVerifyCodeRequest request
    ) {
        return passwordResetService.verifyCode(request);
    }

    @PostMapping("/password-reset/confirm")
    public AuthDtos.GenericMessageResponse confirmPasswordReset(
            @Valid @RequestBody AuthDtos.PasswordResetConfirmRequest request
    ) {
        return passwordResetService.confirmReset(request);
    }
}
