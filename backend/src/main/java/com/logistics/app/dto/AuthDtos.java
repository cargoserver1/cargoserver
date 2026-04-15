package com.logistics.app.dto;

import com.logistics.app.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDtos {
    @Data
    public static class SignUpRequest {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String name;
        private String phone;
        private String companyName;
        private String vehicleType;
        private UserRole role;
    }

    @Data
    public static class LoginRequest {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class PasswordResetSendCodeRequest {
        @Email
        @NotBlank
        private String email;
    }

    @Data
    public static class PasswordResetVerifyCodeRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "인증코드는 6자리 숫자여야 합니다.")
        private String code;
    }

    @Data
    public static class PasswordResetConfirmRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String resetToken;

        @NotBlank
        @Size(min = 4, max = 100)
        private String newPassword;
    }

    @Data
    public static class PasswordResetVerifyResponse {
        private String message;
        private String resetToken;
    }

    @Data
    public static class GenericMessageResponse {
        private String message;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String email;
        private String name;
        private UserRole role;
        private Boolean profileCompleted;
    }
}
