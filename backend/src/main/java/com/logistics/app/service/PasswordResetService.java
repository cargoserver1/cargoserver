package com.logistics.app.service;

import com.logistics.app.dto.AuthDtos;
import com.logistics.app.entity.PasswordResetToken;
import com.logistics.app.entity.User;
import com.logistics.app.repository.PasswordResetTokenRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PasswordResetService {

    private static final int MAX_DAILY_REQUESTS = 10;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long CODE_EXPIRE_MINUTES = 5;
    private static final long LOCK_MINUTES = 30;
    private static final long RESET_TOKEN_EXPIRE_MINUTES = 10;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository passwordResetTokenRepository,
                                PasswordEncoder passwordEncoder,
                                MailService mailService) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    public AuthDtos.GenericMessageResponse sendCode(AuthDtos.PasswordResetSendCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return message("인증코드를 재전송했습니다.");
        }

        PasswordResetToken token = passwordResetTokenRepository.findByEmail(email)
                .orElseGet(() -> PasswordResetToken.builder().email(email).build());

        ensureDailyLimit(token);
        ensureNotLocked(token);

        String code = generateCode();
        LocalDateTime now = LocalDateTime.now();

        token.setCodeHash(passwordEncoder.encode(code));
        token.setExpiresAt(now.plusMinutes(CODE_EXPIRE_MINUTES));
        token.setFailedAttemptCount(0);
        token.setVerifiedAt(null);
        token.setResetToken(null);
        token.setResetTokenExpiresAt(null);
        token.setUsed(false);
        token.setLockedUntil(null);
        token.setLastSentAt(now);
        token.setDailyRequestCount((token.getDailyRequestCount() == null ? 0 : token.getDailyRequestCount()) + 1);
        token.setRequestCountDate(now.toLocalDate().atStartOfDay());

        passwordResetTokenRepository.save(token);
        mailService.sendPasswordResetCode(email, code, token.getExpiresAt());

        return message("인증코드를 재전송했습니다.");
    }

    public AuthDtos.PasswordResetVerifyResponse verifyCode(AuthDtos.PasswordResetVerifyCodeRequest request) {
        PasswordResetToken token = getUsableToken(normalizeEmail(request.getEmail()));
        ensureNotLocked(token);

        LocalDateTime now = LocalDateTime.now();
        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(now)) {
            throw new RuntimeException("인증코드가 만료되었습니다. 새 코드를 다시 요청해주세요.");
        }

        if (token.getCodeHash() == null || !passwordEncoder.matches(request.getCode(), token.getCodeHash())) {
            int failCount = (token.getFailedAttemptCount() == null ? 0 : token.getFailedAttemptCount()) + 1;
            token.setFailedAttemptCount(failCount);
            if (failCount >= MAX_FAILED_ATTEMPTS) {
                token.setLockedUntil(now.plusMinutes(LOCK_MINUTES));
                passwordResetTokenRepository.save(token);
                throw new RuntimeException("인증코드 입력을 5회 실패했습니다. 30분 후 다시 시도해주세요.");
            }
            passwordResetTokenRepository.save(token);
            throw new RuntimeException("인증코드가 올바르지 않습니다. 남은 시도 횟수: " + (MAX_FAILED_ATTEMPTS - failCount) + "회");
        }

        String resetToken = UUID.randomUUID().toString().replace("-", "");
        token.setFailedAttemptCount(0);
        token.setVerifiedAt(now);
        token.setResetToken(resetToken);
        token.setResetTokenExpiresAt(now.plusMinutes(RESET_TOKEN_EXPIRE_MINUTES));
        passwordResetTokenRepository.save(token);

        AuthDtos.PasswordResetVerifyResponse response = new AuthDtos.PasswordResetVerifyResponse();
        response.setMessage("이메일 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.");
        response.setResetToken(resetToken);
        return response;
    }

    public AuthDtos.GenericMessageResponse confirmReset(AuthDtos.PasswordResetConfirmRequest request) {
        String email = normalizeEmail(request.getEmail());
        PasswordResetToken token = getUsableToken(email);
        ensureNotLocked(token);

        LocalDateTime now = LocalDateTime.now();
        if (token.getVerifiedAt() == null || token.getResetToken() == null) {
            throw new RuntimeException("먼저 이메일 인증을 완료해주세요.");
        }
        if (token.getResetTokenExpiresAt() == null || token.getResetTokenExpiresAt().isBefore(now)) {
            throw new RuntimeException("비밀번호 재설정 세션이 만료되었습니다. 다시 인증해주세요.");
        }
        if (!token.getResetToken().equals(request.getResetToken())) {
            throw new RuntimeException("유효하지 않은 재설정 요청입니다.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        token.setCodeHash(null);
        token.setExpiresAt(null);
        token.setFailedAttemptCount(0);
        token.setVerifiedAt(null);
        token.setResetToken(null);
        token.setResetTokenExpiresAt(null);
        passwordResetTokenRepository.save(token);

        return message("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
    }

    private PasswordResetToken getUsableToken(String email) {
        PasswordResetToken token = passwordResetTokenRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("비밀번호 재설정 요청 내역이 없습니다. 먼저 인증코드를 요청해주세요."));
        if (Boolean.TRUE.equals(token.getUsed())) {
            throw new RuntimeException("새 인증코드를 다시 요청해주세요.");
        }
        return token;
    }

    private void ensureDailyLimit(PasswordResetToken token) {
        LocalDate today = LocalDate.now();
        LocalDate requestDate = token.getRequestCountDate() == null
                ? null
                : token.getRequestCountDate().toLocalDate();

        if (requestDate == null || !requestDate.equals(today)) {
            token.setDailyRequestCount(0);
            token.setRequestCountDate(today.atStartOfDay());
        }

        if ((token.getDailyRequestCount() == null ? 0 : token.getDailyRequestCount()) >= MAX_DAILY_REQUESTS) {
            throw new RuntimeException("같은 이메일은 하루에 최대 5회까지만 인증코드를 요청할 수 있습니다.");
        }
    }

    private void ensureNotLocked(PasswordResetToken token) {
        LocalDateTime lockedUntil = token.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())) {
            long minutes = Math.max(1, ChronoUnit.MINUTES.between(LocalDateTime.now(), lockedUntil));
            throw new RuntimeException("계정 보호를 위해 잠시 잠금 처리되었습니다. 약 " + minutes + "분 후 다시 시도해주세요.");
        }
        if (lockedUntil != null && lockedUntil.isBefore(LocalDateTime.now())) {
            token.setLockedUntil(null);
            token.setFailedAttemptCount(0);
        }
    }

    private String generateCode() {
        int number = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(number);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private AuthDtos.GenericMessageResponse message(String value) {
        AuthDtos.GenericMessageResponse response = new AuthDtos.GenericMessageResponse();
        response.setMessage(value);
        return response;
    }
}
