package com.cyvanta.affiliate_app.config;

import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@Order(1)
public class CheckIfBlocked extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Autowired
    public CheckIfBlocked(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            userId = request.getParameter("user_id");
        }
        if (userId == null || userId.isBlank()) {
            userId = request.getParameter("userId");
        }

        if (userId != null && !userId.isBlank()) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                boolean isBlocked = Boolean.TRUE.equals(user.getIsBlocked())
                        || (user.getIs_blocked() != null && user.getIs_blocked() == 1)
                        || "blocked".equalsIgnoreCase(user.getStatus());

                if (isBlocked) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"status\":false,\"message\":\"Your account is blocked by admin\",\"isBlocked\":true,\"is_blocked\":1}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
