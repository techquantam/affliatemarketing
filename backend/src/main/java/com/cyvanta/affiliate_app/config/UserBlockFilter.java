package com.cyvanta.affiliate_app.config;

import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
@RequiredArgsConstructor
public class UserBlockFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        // Allow public auth & admin management endpoints without blocking
        if (path.contains("/login") || path.contains("/register") || path.contains("/admin") ||
            path.contains("/verify-otp") || path.contains("/resend-otp") || path.contains("/forgot-password") ||
            path.contains("/reset-password") || path.contains("/health") ||
            path.contains("/block") || path.contains("/unblock")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if a user identifier is present in headers or query parameters
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            userId = request.getHeader("userId");
        }
        if (userId == null || userId.isBlank()) {
            userId = request.getParameter("userId");
        }

        if (userId != null && !userId.isBlank()) {
            Optional<User> userOpt = userRepository.findById(userId.trim());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (Boolean.TRUE.equals(user.getIsBlocked()) || "blocked".equalsIgnoreCase(user.getStatus())) {
                    log.warn("[Auth Middleware] Blocked user access denied: id={}, path={}", user.getId(), path);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"error\": \"Your account has been blocked by Admin\", \"isBlocked\": true, \"is_blocked\": 1, \"status\": 403}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
