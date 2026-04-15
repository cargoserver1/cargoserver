package com.logistics.app.service;

import com.logistics.app.dto.AuthDtos;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.entity.UserStatus;
import com.logistics.app.repository.UserRepository;
import com.logistics.app.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthDtos.AuthResponse signUp(AuthDtos.SignUpRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        });

        UserRole role = request.getRole() == null ? UserRole.SHIPPER : request.getRole();

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .companyName(request.getCompanyName())
                .vehicleType(request.getVehicleType())
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(user);
        return makeAuthResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DELETED) {
            throw new RuntimeException("사용이 제한된 계정입니다.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 올바르지 않습니다.");
        }
        return makeAuthResponse(user);
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    private AuthDtos.AuthResponse makeAuthResponse(User user) {
        AuthDtos.AuthResponse response = new AuthDtos.AuthResponse();
        response.setToken(jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole());
        response.setProfileCompleted(Boolean.TRUE.equals(user.getProfileCompleted()));
        return response;
    }
}
