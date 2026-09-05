package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@Slf4j
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final WalletService walletService;

    @PostMapping({"/users/{id}/block", "/block-user/{id}", "/block-user"})
    @PutMapping({"/users/{id}/block", "/block-user/{id}", "/block-user"})
    public ResponseEntity<?> blockUser(
            @PathVariable(required = false) String id,
            @RequestBody(required = false) Map<String, Object> body) {
        String targetId = id;
        if ((targetId == null || targetId.isBlank()) && body != null) {
            targetId = (String) body.getOrDefault("userId", body.get("id"));
        }
        if (targetId == null || targetId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
        }

        String trimmedId = targetId.trim();
        Optional<User> userOpt = userRepository.findById(trimmedId);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(trimmedId.toLowerCase());
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByPhone(trimmedId);
            }
        }

        return userOpt.map(user -> {
            user.setStatus("blocked");
            user.setIsBlocked(true);
            User saved = userRepository.save(user);
            log.info("[AdminController] User blocked successfully: id={}, email={}", saved.getId(), saved.getEmail());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                    .body(Map.of(
                            "message", "User has been blocked successfully",
                            "id", saved.getId(),
                            "_id", saved.getId(),
                            "status", "blocked",
                            "isBlocked", true,
                            "is_blocked", 1
                    ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping({"/users/{id}/unblock", "/unblock-user/{id}", "/unblock-user"})
    @PutMapping({"/users/{id}/unblock", "/unblock-user/{id}", "/unblock-user"})
    public ResponseEntity<?> unblockUser(
            @PathVariable(required = false) String id,
            @RequestBody(required = false) Map<String, Object> body) {
        String targetId = id;
        if ((targetId == null || targetId.isBlank()) && body != null) {
            targetId = (String) body.getOrDefault("userId", body.get("id"));
        }
        if (targetId == null || targetId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
        }

        String trimmedId = targetId.trim();
        Optional<User> userOpt = userRepository.findById(trimmedId);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(trimmedId.toLowerCase());
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByPhone(trimmedId);
            }
        }

        return userOpt.map(user -> {
            user.setStatus("active");
            user.setIsBlocked(false);
            User saved = userRepository.save(user);
            log.info("[AdminController] User unblocked successfully: id={}, email={}", saved.getId(), saved.getEmail());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                    .body(Map.of(
                            "message", "User has been unblocked successfully",
                            "id", saved.getId(),
                            "_id", saved.getId(),
                            "status", "active",
                            "isBlocked", false,
                            "is_blocked", 0
                    ));
        }).orElse(ResponseEntity.notFound().build());
    }
}
