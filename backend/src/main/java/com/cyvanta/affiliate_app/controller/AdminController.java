package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.AdminActivityLogRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.EmailService;
import com.cyvanta.affiliate_app.service.SmsService;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@Slf4j
public class AdminController {

    private final UserRepository userRepository;
    private final WalletService walletService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final AdminActivityLogRepository adminActivityLogRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AdminController(
            UserRepository userRepository,
            WalletService walletService,
            EmailService emailService,
            SmsService smsService,
            AdminActivityLogRepository adminActivityLogRepository
    ) {
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.adminActivityLogRepository = adminActivityLogRepository;
    }

    public AdminController(UserRepository userRepository, WalletService walletService) {
        this(userRepository, walletService, null, null, null);
    }

    @PostMapping({"/block/{id}", "/toggle-block/{id}"})
    public ResponseEntity<?> toggleBlockAdmin(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestHeader(name = "X-Admin-Id", required = false) String adminId) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(id);
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User admin = userOpt.get();

        if (User.Role.SUPER_ADMIN.equals(admin.getRole()) && "admin@cyvanta.com".equalsIgnoreCase(admin.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Master super admin account cannot be blocked"
            ));
        }

        boolean currentBlocked = Boolean.TRUE.equals(admin.getIsBlocked())
                || (admin.getIs_blocked() != null && admin.getIs_blocked() == 1)
                || "blocked".equalsIgnoreCase(admin.getStatus());

        if (currentBlocked) {
            admin.setStatus("active");
            admin.setIsBlocked(false);
            admin.setIs_blocked(0);
        } else {
            admin.setStatus("blocked");
            admin.setIsBlocked(true);
            admin.setIs_blocked(1);
        }

        User saved = userRepository.save(admin);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("id", saved.getId());
        resp.put("status", saved.getStatus());
        resp.put("isBlocked", saved.getIsBlocked());
        resp.put("is_blocked", saved.getIs_blocked());
        resp.put("message", currentBlocked ? "Admin unblocked successfully" : "Admin blocked successfully");

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                .body(resp);
    }

    @PutMapping({"/{id}", "/update/{id}"})
    public ResponseEntity<?> updateAdmin(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(name = "X-Admin-Id", required = false) String adminId) {

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(id);
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User admin = userOpt.get();

        if (body.containsKey("name") && body.get("name") != null) {
            admin.setName(String.valueOf(body.get("name")).trim());
        }
        if (body.containsKey("email") && body.get("email") != null) {
            admin.setEmail(String.valueOf(body.get("email")).trim().toLowerCase());
        }
        if (body.containsKey("phone") && body.get("phone") != null) {
            admin.setPhone(String.valueOf(body.get("phone")).trim());
        }
        if (body.containsKey("role") && body.get("role") != null) {
            String roleStr = String.valueOf(body.get("role")).toUpperCase();
            try {
                admin.setRole(User.Role.valueOf(roleStr));
            } catch (Exception e) {
                log.warn("Invalid role string: {}", roleStr);
            }
        }
        if (body.containsKey("password") && body.get("password") != null) {
            String rawPass = String.valueOf(body.get("password")).trim();
            if (!rawPass.isBlank()) {
                admin.setPasswordHash(passwordEncoder.encode(rawPass));
            }
        }

        User saved = userRepository.save(admin);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("id", saved.getId());
        resp.put("name", saved.getName());
        resp.put("email", saved.getEmail());
        resp.put("role", saved.getRole() != null ? saved.getRole().name() : "ADMIN");
        resp.put("message", "Admin updated successfully");

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                .body(resp);
    }

    @PostMapping({"/forgot-password", "/forgotpassword"})
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Admin account not found"));
        }

        User admin = userOpt.get();
        boolean isBlocked = Boolean.TRUE.equals(admin.getIsBlocked())
                || (admin.getIs_blocked() != null && admin.getIs_blocked() == 1)
                || "blocked".equalsIgnoreCase(admin.getStatus());

        if (isBlocked) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Your account is blocked"));
        }

        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        admin.setOtp(otp);
        admin.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(admin);

        if (emailService != null) {
            emailService.sendPasswordResetEmail(admin.getEmail(), otp);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset OTP sent to your email"));
    }

    @PostMapping({"/reset-password", "/resetpassword"})
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String identifier = body.getOrDefault("identifier", body.get("email"));
        String otp = body.get("otp");
        String password = body.get("password");

        if (identifier == null || otp == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Identifier, OTP, and new password are required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP"));
        }

        if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP has expired"));
        }

        user.setPasswordHash(passwordEncoder.encode(password));
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "Password has been successfully reset"));
    }

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
            user.setIs_blocked(1);
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
            user.setIs_blocked(0);
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
