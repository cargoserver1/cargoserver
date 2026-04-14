package com.logistics.app.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class MailService {

    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter EXPIRES_AT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;

    public MailService(JavaMailSender mailSender,
                       @Value("${app.mail.from:${spring.mail.username:}}") String fromAddress,
                       @Value("${app.mail.from-name:want}") String fromName) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    public void sendPasswordResetCode(String to, String code, LocalDateTime expiresAt) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());

            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(new InternetAddress(fromAddress, fromName, StandardCharsets.UTF_8.name()).toString());
            }
            helper.setTo(to);
            helper.setSubject("[want] 비밀번호 재설정 인증코드");
            helper.setText(buildContent(code, expiresAt), false);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("메일 발송 중 오류가 발생했습니다.", e);
        }
    }

    private String buildContent(String code, LocalDateTime expiresAt) {
        String expiresAtText = expiresAt == null
                ? "발송 시점부터 5분"
                : expiresAt.atZone(KOREA_ZONE).format(EXPIRES_AT_FORMATTER) + " (KST)";

        return "안녕하세요.\n\n"
                + "비밀번호 재설정 인증코드는 아래와 같습니다.\n\n"
                + "인증코드: " + code + "\n"
                + "유효시간: " + expiresAtText + "까지\n\n"
                + "해당 시각이 지나면 인증코드는 만료됩니다.\n";
    }
}
