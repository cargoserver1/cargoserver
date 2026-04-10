package com.logistics.app.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // 🔥 🔥 🔥 핵심: permitAll 경로는 JWT 검사 자체를 건너뜀
        if (path.equals("/") ||
            path.startsWith("/auth") ||
            path.startsWith("/public") ||
            path.startsWith("/ws") ||
            path.startsWith("/uploads")) {

            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtUtil.parse(token);

                String email = claims.getSubject();
                String role = String.valueOf(claims.get("role"));

                if (email != null && !email.isBlank()) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    role == null || role.isBlank()
                                            ? List.of()
                                            : List.of(new SimpleGrantedAuthority("ROLE_" + role))
                            );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // 🔥 토큰 이상하면 인증 제거 (에러 던지지 않음)
                SecurityContextHolder.clearContext();
            }
        }

        // 🔥 필터 계속 진행 (이게 있어야 403 안 걸림)
        filterChain.doFilter(request, response);
    }
}