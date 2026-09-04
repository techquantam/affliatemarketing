package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.AdminActivityLog;
import com.cyvanta.affiliate_app.model.AdminLoginHistory;
import com.cyvanta.affiliate_app.model.AdminPermissions;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.model.Notification;
import com.cyvanta.affiliate_app.repository.AdminActivityLogRepository;
import com.cyvanta.affiliate_app.repository.AdminLoginHistoryRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.repository.NotificationRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import com.cyvanta.affiliate_app.service.EmailService;
import com.cyvanta.affiliate_app.service.SmsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/users")
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AdminActivityLogRepository adminActivityLogRepository;
    private final AdminLoginHistoryRepository adminLoginHistoryRepository;
    private final WalletService walletService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationRepository notificationRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "message", "User Controller is reachable"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            Wallet wallet = walletService.getOrCreateWallet(user.getId());
            return ResponseEntity.ok(buildUserResponse(user, wallet));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<User> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            if (body.containsKey("status")) {
                user.setStatus(body.get("status"));
            }
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        return userRepository.findById(id).map(user -> {
            if (updatedUser.getName() != null) user.setName(updatedUser.getName());
            if (updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
            if (updatedUser.getPhone() != null) user.setPhone(updatedUser.getPhone());
            if (updatedUser.getStatus() != null) user.setStatus(updatedUser.getStatus());
            if (updatedUser.getRole() != null && updatedUser.getRole() != user.getRole()) {
                user.setRole(updatedUser.getRole());
                user.setPermissions(AdminPermissions.defaultForRole(updatedUser.getRole()));
            }
            if (updatedUser.getPermissions() != null) {
                user.setPermissions(updatedUser.getPermissions());
            }
            // Handle null explicitly if sharedCommissionRate is meant to be reset
            user.setSharedCommissionRate(updatedUser.getSharedCommissionRate());

            // Profile Fields
            if (updatedUser.getDob() != null) user.setDob(updatedUser.getDob());
            if (updatedUser.getGender() != null) user.setGender(updatedUser.getGender());
            if (updatedUser.getAddress() != null) user.setAddress(updatedUser.getAddress());
            if (updatedUser.getCity() != null) user.setCity(updatedUser.getCity());
            if (updatedUser.getState() != null) user.setState(updatedUser.getState());
            if (updatedUser.getPincode() != null) user.setPincode(updatedUser.getPincode());
            if (updatedUser.getIsProfileComplete() != null) user.setIsProfileComplete(updatedUser.getIsProfileComplete());

            // E-KYC Fields
            if (updatedUser.getAadhaarNumber() != null) user.setAadhaarNumber(updatedUser.getAadhaarNumber());
            if (updatedUser.getPanNumber() != null) user.setPanNumber(updatedUser.getPanNumber());
            if (updatedUser.getAadhaarFrontUrl() != null) user.setAadhaarFrontUrl(updatedUser.getAadhaarFrontUrl());
            if (updatedUser.getAadhaarBackUrl() != null) user.setAadhaarBackUrl(updatedUser.getAadhaarBackUrl());
            if (updatedUser.getPanCardUrl() != null) user.setPanCardUrl(updatedUser.getPanCardUrl());
            if (updatedUser.getSelfieUrl() != null) user.setSelfieUrl(updatedUser.getSelfieUrl());
            if (updatedUser.getKycStatus() != null) {
                user.setKycStatus(updatedUser.getKycStatus());
            } else if (!"approved".equalsIgnoreCase(user.getKycStatus())) {
                // Auto-submit KYC to pending if all mandatory docs are provided
                if (user.getAadhaarNumber() != null && !user.getAadhaarNumber().trim().isEmpty() &&
                    user.getPanNumber() != null && !user.getPanNumber().trim().isEmpty() &&
                    user.getAadhaarFrontUrl() != null && !user.getAadhaarFrontUrl().trim().isEmpty() &&
                    user.getPanCardUrl() != null && !user.getPanCardUrl().trim().isEmpty() &&
                    user.getSelfieUrl() != null && !user.getSelfieUrl().trim().isEmpty()) {
                    user.setKycStatus("pending");
                    user.setKycRemarks(null);
                }
            }
            if (updatedUser.getKycRemarks() != null) user.setKycRemarks(updatedUser.getKycRemarks());
            
            if (updatedUser.getUpiId() != null) user.setUpiId(updatedUser.getUpiId());
            if (updatedUser.getBankAccountName() != null) user.setBankAccountName(updatedUser.getBankAccountName());
            if (updatedUser.getBankAccountNumber() != null) user.setBankAccountNumber(updatedUser.getBankAccountNumber());
            if (updatedUser.getBankIfsc() != null) user.setBankIfsc(updatedUser.getBankIfsc());
            if (updatedUser.getBankName() != null) user.setBankName(updatedUser.getBankName());
            if (updatedUser.getPaymentDetailsStatus() != null) user.setPaymentDetailsStatus(updatedUser.getPaymentDetailsStatus());
            if (updatedUser.getPaymentDetailsRemarks() != null) user.setPaymentDetailsRemarks(updatedUser.getPaymentDetailsRemarks());

            User saved = userRepository.save(user);
            Wallet wallet = walletService.getOrCreateWallet(saved.getId());
            return ResponseEntity.ok(buildUserResponse(saved, wallet));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/kyc")
    public ResponseEntity<?> updateKycStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String kycStatus = body.get("status");
            String remarks = body.get("remarks");
            if (kycStatus != null) {
                user.setKycStatus(kycStatus.toLowerCase());
            }
            if (remarks != null) {
                user.setKycRemarks(remarks);
            }
            User saved = userRepository.save(user);

            if (kycStatus != null) {
                try {
                    String title = "KYC Verification Update";
                    String msg = "approved".equalsIgnoreCase(kycStatus) 
                        ? "Congratulations! Your E-KYC verification has been approved. You can now request payouts." 
                        : "Your E-KYC verification has been rejected. Reason: " + (remarks != null && !remarks.isEmpty() ? remarks : "Please re-upload clear document copies.");
                    
                    Notification notif = Notification.builder()
                        .userId(user.getId())
                        .title(title)
                        .message(msg)
                        .type("KYC")
                        .read(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                    notificationRepository.save(notif);
                } catch (Exception e) {
                    log.warn("Failed to save KYC notification for user " + id, e);
                }
            }

            Wallet wallet = walletService.getOrCreateWallet(saved.getId());
            return ResponseEntity.ok(buildUserResponse(saved, wallet));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- User Registration ---

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> body) {
        String rawName = body.get("name");
        String rawEmail = body.get("email");
        String rawPhone = body.get("phone");
        String rawIdentifier = body.get("identifier");
        String rawPassword = body.get("password");

        log.info("[REGISTER] Attempting registration for rawIdentifier={}", rawIdentifier);

        String name = normalize(rawName);
        String email = normalizeEmail(rawEmail);
        String phone = normalizePhone(rawPhone);
        String password = normalize(rawPassword);

        // Logic for mixed identifier (email OR phone in one field)
        if (rawIdentifier != null && (email == null && phone == null)) {
            String normalizedId = normalizeIdentifier(rawIdentifier);
            if (normalizedId != null) {
                if (normalizedId.contains("@")) email = normalizedId;
                else phone = normalizedId;
            }
        }

        if ((email == null && phone == null) || password == null) {
            log.warn("[REGISTER] Validation failed: email={}, phone={}, password={}", email, phone, password != null ? "PRESENT" : "NULL");
            return ResponseEntity.badRequest().body(Map.of("error", "Email/Phone and password are required"));
        }

        // Check if user already exists
        Optional<User> existingUserOpt = email != null ? userRepository.findByEmail(email) : findUserByPhone(phone);
        
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (Boolean.TRUE.equals(existingUser.getIsVerified()) || !"pending".equals(existingUser.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "User already exists"));
            } else {
                // User exists but pending, resend OTP
                String otp = String.format("%06d", new Random().nextInt(999999));
                existingUser.setOtp(otp);
                existingUser.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
                existingUser.setPasswordHash(passwordEncoder.encode(password));
                userRepository.save(existingUser);
                sendOtp(existingUser, otp);
                return ResponseEntity.ok(Map.of("requireOtp", true, "message", "OTP resent", "identifier", email != null ? email : phone));
            }
        }

        // Generate a unique referral code
        String referralCode = generateReferralCode(name);
        String referredBy = body.getOrDefault("referredBy", null);
        String otp = String.format("%06d", new Random().nextInt(999999));

        User user = User.builder()
                .name(name != null ? name : (email != null ? email.split("@")[0] : "User-" + phone.substring(phone.length() - 4)))
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .referralCode(referralCode)
                .referredBy(referredBy)
                .role(User.Role.USER)
                .status("pending")
                .isVerified(false)
                .otp(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        userRepository.save(user);
        try {
            sendOtp(user, otp);
            return ResponseEntity.ok(Map.of("requireOtp", true, "message", "OTP sent", "identifier", email != null ? email : phone));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private void sendOtp(User user, String otp) {
        if (user.getEmail() != null) {
            log.info("[OTP] Sending OTP via email to {}", user.getEmail());
            emailService.sendOtpEmail(user.getEmail(), otp);
        } else if (user.getPhone() != null) {
            log.info("[OTP] Sending OTP via SMS to phone={}", user.getPhone());
            try {
                String verificationId = smsService.sendOtpSms(user.getPhone(), otp);
                // Persist verificationId so it survives server restarts
                user.setMcVerificationId(verificationId);
                userRepository.save(user);
                log.info("[OTP] SMS OTP sent successfully to {}, verificationId={}", user.getPhone(), verificationId);
            } catch (Exception e) {
                // MessageCentral failed (rate limit, network, etc.) — fall back to local OTP
                log.warn("[OTP] MessageCentral failed for {}: {}. Falling back to local OTP.", user.getPhone(), e.getMessage());
                user.setMcVerificationId(null); // null signals: use local OTP for verification
                userRepository.save(user);
                // Don't rethrow — user will verify with local OTP
            }
        } else {
            log.error("[OTP] User {} has neither email nor phone — cannot send OTP!", user.getId());
            throw new RuntimeException("User has neither email nor phone");
        }
    }

    // --- OTP Verification ---
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String identifier = normalizeIdentifier(body.get("identifier")); // email or phone
        String otp = normalize(body.get("otp"));

        if (identifier == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Identifier and OTP are required"));
        }

        Optional<User> userOpt = identifier.contains("@") ? userRepository.findByEmail(identifier) : findUserByPhone(identifier);

        return userOpt.map(user -> {
            if (Boolean.TRUE.equals(user.getIsVerified()) && !"pending".equals(user.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Account is already verified"));
            }

            boolean otpValid;
            if (user.getPhone() != null && smsService.isMessageCentralActive() && user.getMcVerificationId() != null) {
                // Phone-based: validate via MessageCentral using persisted verificationId
                String verificationId = user.getMcVerificationId();
                log.info("[OTP] Validating via MessageCentral for {}, verificationId={}", user.getPhone(), verificationId);
                otpValid = smsService.verifyMessageCentralOtp(verificationId, otp);
                if (!otpValid) {
                    // MessageCentral rejected — also try local OTP as backup
                    log.warn("[OTP] MessageCentral rejected, trying local OTP fallback");
                    otpValid = user.getOtp() != null && user.getOtp().equals(otp)
                            && user.getOtpExpiry() != null && user.getOtpExpiry().isAfter(LocalDateTime.now());
                }
                if (!otpValid) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP code"));
                }
            } else {
                // Email-based OR MessageCentral was unavailable (fallback to local OTP)
                log.info("[OTP] Validating via local DB OTP for identifier={}", identifier);
                if (user.getOtp() == null || !user.getOtp().equals(otp)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP code"));
                }
                if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired. Please request a new one."));
                }
            }

            user.setIsVerified(true);
            user.setStatus("active");
            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setMcVerificationId(null); // clear after successful verification
            User savedUser = userRepository.save(user);

            Wallet wallet = walletService.getOrCreateWallet(savedUser.getId());
            Map<String, Object> response = buildUserResponse(savedUser, wallet);

            return ResponseEntity.ok((Object) response);
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "User not found")));
    }

    // --- Resend OTP ---
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String identifier = normalizeIdentifier(body.get("identifier"));
        if (identifier == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Identifier is required"));
        }

        Optional<User> userOpt = identifier.contains("@") ? userRepository.findByEmail(identifier) : findUserByPhone(identifier);

        return userOpt.map(user -> {
            if (Boolean.TRUE.equals(user.getIsVerified()) && !"pending".equals(user.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Account is already verified"));
            }
            String otp = String.format("%06d", new Random().nextInt(999999));
            user.setOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepository.save(user);
            try {
                sendOtp(user, otp);
                return ResponseEntity.ok((Object) Map.of("message", "OTP resent successfully"));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "User not found")));
    }

    // --- User Login ---
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> body) {
        String emailIdentifier = normalizeIdentifier(body.get("email"));
        String phoneIdentifier = normalizeIdentifier(body.get("phone"));
        final String identifier = emailIdentifier != null ? emailIdentifier : (phoneIdentifier != null ? phoneIdentifier : normalizeIdentifier(body.get("identifier")));
        
        String password = normalize(body.get("password"));

        if (identifier == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Identifier and password are required"));
        }

        Optional<User> userOpt = identifier.contains("@") ? userRepository.findByEmail(identifier) : findUserByPhone(identifier);

        return userOpt.map(user -> {
            String stored = user.getPasswordHash();
            boolean ok;
            if (stored != null && (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$"))) {
                ok = passwordEncoder.matches(password, stored);
            } else {
                ok = password.equals(stored);
            }

            if (!ok) {
                return ResponseEntity.status(401).body((Object) Map.of("error", "Invalid credentials"));
            }

            if ("blocked".equals(user.getStatus())) {
                return ResponseEntity.status(403).body((Object) Map.of("error", "Account is blocked"));
            }

            if (Boolean.FALSE.equals(user.getIsVerified()) || "pending".equals(user.getStatus())) {
                user.setIsVerified(true);
                user.setStatus("active");
                user.setOtp(null);
                user.setOtpExpiry(null);
                userRepository.save(user);
            }

            Wallet wallet = walletService.getOrCreateWallet(user.getId());
            Map<String, Object> response = buildUserResponse(user, wallet);

            return ResponseEntity.ok((Object) response);
        }).orElse(ResponseEntity.status(401).body(Map.of("error", "User not found")));
    }

    // --- Admin Login ---
    @PostMapping("/admin/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String emailIdentifier = normalizeIdentifier(body.get("email"));
        String phoneIdentifier = normalizeIdentifier(body.get("phone"));
        final String identifier = emailIdentifier != null ? emailIdentifier : (phoneIdentifier != null ? phoneIdentifier : normalizeIdentifier(body.get("identifier")));
        
        String password = normalize(body.get("password"));

        if (identifier == null || password == null) {
            recordAdminLoginHistory(null, identifier, null, false, request);
            return ResponseEntity.badRequest().body(Map.of("error", "Identifier and password are required"));
        }

        Optional<User> userOpt = identifier.contains("@") ? userRepository.findByEmail(identifier) : findUserByPhone(identifier);

        if (userOpt.isEmpty()) {
            recordAdminLoginHistory(null, identifier, null, false, request);
            return ResponseEntity.status(401).body(Map.of("error", "Admin user not found"));
        }

        User user = userOpt.get();
        
        // Auto-restore master admin role if it was accidentally downgraded
        if (("admin@cyvanta.com".equalsIgnoreCase(user.getEmail()) || "admin@affiliateapp.com".equalsIgnoreCase(user.getEmail())) 
            && user.getRole() != User.Role.SUPER_ADMIN) {
            user.setRole(User.Role.SUPER_ADMIN);
            userRepository.save(user);
        }

        String stored = user.getPasswordHash();
        boolean ok = stored != null && (stored.startsWith("$") ? passwordEncoder.matches(password, stored) : password.equals(stored));
        boolean isAdmin = isAdminRole(user);

        if (!ok || !isAdmin) {
            recordAdminLoginHistory(user, identifier, user.getRole() != null ? user.getRole().toString() : null, false, request);
            if (!ok) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            }
            return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin role required."));
        }

        if (Boolean.FALSE.equals(user.getIsVerified()) || "pending".equals(user.getStatus())) {
            user.setIsVerified(true);
            user.setStatus("active");
            user.setOtp(null);
            user.setOtpExpiry(null);
            userRepository.save(user);
        }

        // Refresh permissions on every login to ensure they match the role
        // (handles existing admins created before module-level permissions were added)
        AdminPermissions freshPermissions = AdminPermissions.defaultForRole(user.getRole());
        user.setPermissions(freshPermissions);
        userRepository.save(user);

        recordAdminLoginHistory(user, identifier, user.getRole().toString(), true, request);
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", user.getRole().toString(),
                "isAdmin", true,
                "status", user.getStatus(),
                "permissions", freshPermissions
        ));
    }
    
    // --- Create New Admin (SUPER_ADMIN only) ---
    @PostMapping("/admin/create")
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> body, @RequestHeader(value = "X-Admin-Id", required = false) String adminId) {
        // Verify the requester is SUPER_ADMIN or ADMIN
        if (adminId == null || adminId.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin authentication required"));
        }
        Optional<User> requesterOpt = userRepository.findById(adminId);
        if (requesterOpt.isEmpty() || (requesterOpt.get().getRole() != User.Role.SUPER_ADMIN && requesterOpt.get().getRole() != User.Role.ADMIN)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only Super Admin or Admin can create new admin accounts"));
        }

        String name = normalize(body.get("name"));
        String email = normalizeEmail(body.get("email"));
        String phone = normalizePhone(body.get("phone"));
        String password = normalize(body.get("password"));
        String roleStr = normalize(body.get("role"));

        if (name == null || password == null || (email == null && phone == null)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email/phone, and password are required"));
        }

        // Check if user already exists
        if (email != null && userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "A user with this email already exists"));
        }

        User.Role role = User.Role.ADMIN;
        if (roleStr != null) {
            try {
                role = User.Role.valueOf(roleStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
            }
        }

        String referralCode = generateReferralCode(name);
        User newAdmin = User.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .referralCode(referralCode)
                .role(role)
                .permissions(AdminPermissions.defaultForRole(role))
                .status("active")
                .isVerified(true)
                .build();

        User saved = userRepository.save(newAdmin);

        // Log activity
        adminActivityLogRepository.save(AdminActivityLog.builder()
                .adminId(adminId)
                .adminEmail(requesterOpt.get().getEmail())
                .adminRole(requesterOpt.get().getRole().toString())
                .action("CREATE_ADMIN")
                .target(saved.getEmail())
                .details("Created new admin with role: " + role)
                .build());

        return ResponseEntity.ok(Map.of(
                "message", "Admin account created successfully",
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail() != null ? saved.getEmail() : "",
                "role", saved.getRole().toString(),
                "permissions", saved.getPermissions()
        ));
    }

    // --- Get All Admins ---
    @GetMapping("/admins")
    public ResponseEntity<List<User>> getAllAdmins() {
        List<User> admins = userRepository.findAll().stream()
                .filter(this::isAdminRole)
                .toList();
        return ResponseEntity.ok(admins);
    }

    // --- Change Admin Role (SUPER_ADMIN only) ---
    @PutMapping("/{id}/role")
    public ResponseEntity<?> changeAdminRole(@PathVariable String id, @RequestBody Map<String, String> body, @RequestHeader(value = "X-Admin-Id", required = false) String adminId) {
        // Verify the requester is SUPER_ADMIN or ADMIN
        if (adminId == null || adminId.isEmpty()) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin authentication required"));
        }
        Optional<User> requesterOpt = userRepository.findById(adminId);
        if (requesterOpt.isEmpty() || (requesterOpt.get().getRole() != User.Role.SUPER_ADMIN && requesterOpt.get().getRole() != User.Role.ADMIN)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only Super Admin or Admin can change admin roles"));
        }

        String roleStr = normalize(body.get("role"));
        if (roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        User.Role newRole;
        try {
            newRole = User.Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
        }

        return userRepository.findById(id).map(user -> {
            User.Role oldRole = user.getRole();
            user.setRole(newRole);
            user.setPermissions(AdminPermissions.defaultForRole(newRole));
            User saved = userRepository.save(user);

            // Log activity
            adminActivityLogRepository.save(AdminActivityLog.builder()
                    .adminId(adminId)
                    .adminEmail(requesterOpt.get().getEmail())
                    .adminRole(requesterOpt.get().getRole().toString())
                    .action("CHANGE_ROLE")
                    .target(saved.getEmail())
                    .details("Role changed from " + oldRole + " to " + newRole)
                    .build());

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Helper: Build user response with wallet data ---

    private Map<String, Object> buildUserResponse(User user, Wallet wallet) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("referralCode", user.getReferralCode());
        response.put("referredBy", user.getReferredBy());
        response.put("status", user.getStatus());
        response.put("joinDate", user.getJoinDate());
        response.put("sharedCommissionRate", user.getSharedCommissionRate());
        response.put("role", user.getRole() != null ? user.getRole().toString() : User.Role.USER.toString());
        response.put("isAdmin", user.getRole() != null && user.getRole() != User.Role.USER);
        response.put("permissions", user.getPermissions() != null ? user.getPermissions() : AdminPermissions.defaultForRole(user.getRole()));

        // Profile Fields
        response.put("dob", user.getDob());
        response.put("gender", user.getGender());
        response.put("address", user.getAddress());
        response.put("city", user.getCity());
        response.put("state", user.getState());
        response.put("pincode", user.getPincode());
        response.put("isProfileComplete", user.getIsProfileComplete() != null ? user.getIsProfileComplete() : false);

        // KYC Fields
        response.put("aadhaarNumber", user.getAadhaarNumber());
        response.put("panNumber", user.getPanNumber());
        response.put("aadhaarFrontUrl", user.getAadhaarFrontUrl());
        response.put("aadhaarBackUrl", user.getAadhaarBackUrl());
        response.put("panCardUrl", user.getPanCardUrl());
        response.put("selfieUrl", user.getSelfieUrl());
        response.put("kycStatus", user.getKycStatus() != null ? user.getKycStatus() : "not_submitted");
        response.put("kycRemarks", user.getKycRemarks());

        // Payment details
        response.put("upiId", user.getUpiId());
        response.put("bankAccountName", user.getBankAccountName());
        response.put("bankAccountNumber", user.getBankAccountNumber());
        response.put("bankIfsc", user.getBankIfsc());
        response.put("bankName", user.getBankName());
        response.put("paymentDetailsStatus", user.getPaymentDetailsStatus() != null ? user.getPaymentDetailsStatus() : "not_submitted");
        response.put("paymentDetailsRemarks", user.getPaymentDetailsRemarks());

        Map<String, Double> walletData = new HashMap<>();
        walletData.put("confirmed", wallet.getApprovedBalance());
        walletData.put("pending", wallet.getPendingBalance());
        walletData.put("referral", 0.0); // Can be computed from referral transactions later
        response.put("wallet", walletData);

        return response;
    }

    private String normalize(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.trim().isEmpty()) return null;
        return email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) return null;
        String normalized = phone.trim().replaceAll("[^\\d+]", "");
        if (normalized.startsWith("00")) {
            normalized = "+" + normalized.substring(2);
        } else if (normalized.startsWith("+")) {
            normalized = "+" + normalized.substring(1).replaceAll("[^\\d]", "");
        } else {
            // Remove non-digits
            normalized = normalized.replaceAll("[^\\d]", "");
            // If 10 digits, assume Indian number and add +91 prefix
            if (normalized.length() == 10) {
                normalized = "+91" + normalized;
            } else if (normalized.length() > 0 && !normalized.startsWith("+")) {
                // For other lengths, assume already has country code but missing + prefix
                if (normalized.length() >= 11) {
                    normalized = "+" + normalized;
                }
            }
        }
        if (normalized.isEmpty()) return null;
        return normalized;
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) return null;
        identifier = identifier.trim();
        return identifier.contains("@") ? normalizeEmail(identifier) : normalizePhone(identifier);
    }

    private Optional<User> findUserByPhone(String phone) {
        if (phone == null) return Optional.empty();
        Optional<User> userOpt = userRepository.findByPhone(phone);
        if (userOpt.isPresent()) return userOpt;

        String digits = phone.replaceAll("[^\\d]", "");
        if (!digits.equals(phone)) {
            userOpt = userRepository.findByPhone(digits);
            if (userOpt.isPresent()) return userOpt;
        }
        if (!phone.startsWith("+")) {
            userOpt = userRepository.findByPhone("+" + digits);
            if (userOpt.isPresent()) return userOpt;
        }
        return Optional.empty();
    }

    private boolean isAdminRole(User user) {
        if (user == null || user.getRole() == null) return false;
        return switch (user.getRole()) {
            case SUPER_ADMIN, ADMIN, CONTENT_MANAGER, AFFILIATE_MANAGER, SUPPORT_ADMIN -> true;
            default -> false;
        };
    }

    private void recordAdminLoginHistory(User user, String identifier, String role, boolean success, HttpServletRequest request) {
        adminLoginHistoryRepository.save(AdminLoginHistory.builder()
                .adminId(user != null ? user.getId() : null)
                .email(identifier)
                .role(role)
                .success(success)
                .ipAddress(request != null ? request.getRemoteAddr() : null)
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .build());
    }

    // --- Helper: Generate referral code ---
    private String generateReferralCode(String name) {
        String prefix = (name != null && name.length() >= 3)
                ? name.substring(0, 3).toUpperCase()
                : "USR";
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return prefix + suffix;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String rawIdentifier = body.get("identifier");
        String identifier = normalizeIdentifier(rawIdentifier);
        if (identifier == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email or Phone is required"));
        }
        Optional<User> userOpt = identifier.contains("@") ? userRepository.findByEmail(identifier) : findUserByPhone(identifier);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No account registered with this email or phone"));
        }
        User user = userOpt.get();
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        try {
            if (user.getEmail() != null) {
                emailService.sendPasswordResetEmail(user.getEmail(), otp);
            } else if (user.getPhone() != null) {
                if (smsService.isMessageCentralActive()) {
                    String verificationId = smsService.sendOtpSms(user.getPhone(), otp);
                    user.setMcVerificationId(verificationId);
                    userRepository.save(user);
                } else {
                    user.setMcVerificationId(null);
                    userRepository.save(user);
                }
            }
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully", "identifier", identifier));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String identifier = normalizeIdentifier(body.get("identifier"));
        String otp = normalize(body.get("otp"));
        String newPassword = normalize(body.get("password"));

        if (identifier == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Identifier, OTP, and new password are required"));
        }

        Optional<User> userOpt = identifier.contains("@") ? userRepository.findByEmail(identifier) : findUserByPhone(identifier);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        boolean otpValid = false;

        if (user.getPhone() != null && smsService.isMessageCentralActive() && user.getMcVerificationId() != null) {
            String verificationId = user.getMcVerificationId();
            otpValid = smsService.verifyMessageCentralOtp(verificationId, otp);
            if (!otpValid) {
                otpValid = user.getOtp() != null && user.getOtp().equals(otp)
                        && user.getOtpExpiry() != null && user.getOtpExpiry().isAfter(LocalDateTime.now());
            }
        } else {
            if (user.getOtp() != null && user.getOtp().equals(otp)) {
                if (user.getOtpExpiry() != null && user.getOtpExpiry().isAfter(LocalDateTime.now())) {
                    otpValid = true;
                }
            }
        }

        if (!otpValid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP code"));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setMcVerificationId(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in."));
    }

    @PutMapping("/{id}/payment-details")
    public ResponseEntity<?> updatePaymentDetails(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String upiId = normalize(body.get("upiId"));
            String bankAccountName = normalize(body.get("bankAccountName"));
            String bankAccountNumber = normalize(body.get("bankAccountNumber"));
            String bankIfsc = normalize(body.get("bankIfsc"));
            String bankName = normalize(body.get("bankName"));

            // Validation: at least one method required
            if ((upiId == null || upiId.isEmpty()) &&
                (bankAccountNumber == null || bankAccountNumber.isEmpty())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please provide either a UPI ID or Bank Account details."));
            }

            // UPI Validation: if provided, must match standard UPI ID regex
            if (upiId != null && !upiId.isEmpty()) {
                if (!upiId.matches("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid UPI ID format. Expected format: username@bank (e.g. rahul@okhdfcbank)"));
                }
                user.setUpiId(upiId);
            } else if (body.containsKey("upiId")) {
                user.setUpiId(null);
            }

            // Bank details validation: if account number provided, validate format and require name & IFSC
            if (bankAccountNumber != null && !bankAccountNumber.isEmpty()) {
                if (!bankAccountNumber.matches("^\\d{9,18}$")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Bank account number must be between 9 and 18 numeric digits."));
                }
                if (bankIfsc == null || !bankIfsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid IFSC code format. Expected 11 characters (e.g. SBIN0001234)."));
                }
                if (bankAccountName == null || bankAccountName.trim().length() < 2) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Account holder name must be at least 2 characters."));
                }
                user.setBankAccountNumber(bankAccountNumber);
                user.setBankIfsc(bankIfsc.toUpperCase());
                user.setBankAccountName(bankAccountName);
                if (bankName != null && !bankName.isEmpty()) {
                    user.setBankName(bankName);
                }
            } else if (body.containsKey("bankAccountNumber")) {
                user.setBankAccountNumber(null);
                user.setBankIfsc(null);
                user.setBankAccountName(null);
                user.setBankName(null);
            }

            // Requirement 3: Once approved, details are locked and cannot be edited by user
            if ("approved".equalsIgnoreCase(user.getPaymentDetailsStatus())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Payment details are already approved and locked. Please contact support or admin to request changes."));
            }

            // Status is set to 'pending' for Admin approval from Admin Panel > KYC Requests
            user.setPaymentDetailsStatus("pending");
            user.setPaymentDetailsRemarks(null);
            
            User saved = userRepository.save(user);
            Wallet wallet = walletService.getOrCreateWallet(saved.getId());
            return ResponseEntity.ok(buildUserResponse(saved, wallet));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/payment-details/status")
    public ResponseEntity<?> updatePaymentDetailsStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String status = body.get("status");
            String remarks = body.get("remarks");
            if (status != null) {
                user.setPaymentDetailsStatus(status.toLowerCase());
            }
            if (remarks != null) {
                user.setPaymentDetailsRemarks(remarks);
            }
            User saved = userRepository.save(user);
            
            if (status != null) {
                try {
                    String title = "Payment Details Verification Update";
                    String msg = "approved".equalsIgnoreCase(status)
                        ? "Your bank / UPI details have been verified and approved. You can now request payouts."
                        : "Your bank / UPI details have been rejected. Reason: " + (remarks != null && !remarks.isEmpty() ? remarks : "Please correct any typos.");
                    
                    Notification notif = Notification.builder()
                        .userId(user.getId())
                        .title(title)
                        .message(msg)
                        .type("PAYMENT_DETAILS")
                        .read(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                    notificationRepository.save(notif);
                } catch (Exception e) {
                    log.warn("Failed to save notification for user " + id, e);
                }
            }
            
            Wallet wallet = walletService.getOrCreateWallet(saved.getId());
            return ResponseEntity.ok(buildUserResponse(saved, wallet));
        }).orElse(ResponseEntity.notFound().build());
    }
}
