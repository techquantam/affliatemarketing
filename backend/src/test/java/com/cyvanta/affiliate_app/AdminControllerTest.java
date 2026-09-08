package com.cyvanta.affiliate_app;

import com.cyvanta.affiliate_app.controller.AdminController;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.AdminActivityLogRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.EmailService;
import com.cyvanta.affiliate_app.service.SmsService;
import com.cyvanta.affiliate_app.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    private UserRepository userRepository;
    private WalletService walletService;
    private EmailService emailService;
    private SmsService smsService;
    private AdminActivityLogRepository adminActivityLogRepository;
    private AdminController adminController;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        walletService = mock(WalletService.class);
        emailService = mock(EmailService.class);
        smsService = mock(SmsService.class);
        adminActivityLogRepository = mock(AdminActivityLogRepository.class);

        adminController = new AdminController(
                userRepository,
                walletService,
                emailService,
                smsService,
                adminActivityLogRepository
        );

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testToggleBlockAdmin_Success() {
        User admin = User.builder()
                .id("admin_123")
                .name("Test Admin")
                .email("testadmin@cyvanta.com")
                .role(User.Role.ADMIN)
                .status("active")
                .isBlocked(false)
                .is_blocked(0)
                .build();

        when(userRepository.findById("admin_123")).thenReturn(Optional.of(admin));

        // 1st toggle: active -> blocked
        ResponseEntity<?> resp1 = adminController.toggleBlockAdmin("admin_123", null, "super_admin");
        assertEquals(HttpStatus.OK, resp1.getStatusCode());
        Map<?, ?> body1 = (Map<?, ?>) resp1.getBody();
        assertNotNull(body1);
        assertEquals(true, body1.get("success"));
        assertEquals("blocked", body1.get("status"));
        assertEquals(true, body1.get("isBlocked"));
        assertEquals(1, body1.get("is_blocked"));

        // 2nd toggle: blocked -> active
        ResponseEntity<?> resp2 = adminController.toggleBlockAdmin("admin_123", null, "super_admin");
        assertEquals(HttpStatus.OK, resp2.getStatusCode());
        Map<?, ?> body2 = (Map<?, ?>) resp2.getBody();
        assertNotNull(body2);
        assertEquals(true, body2.get("success"));
        assertEquals("active", body2.get("status"));
        assertEquals(false, body2.get("isBlocked"));
        assertEquals(0, body2.get("is_blocked"));
    }

    @Test
    void testToggleBlockAdmin_MasterSuperAdminProtected() {
        User masterAdmin = User.builder()
                .id("master_1")
                .name("Master Admin")
                .email("admin@cyvanta.com")
                .role(User.Role.SUPER_ADMIN)
                .status("active")
                .build();

        when(userRepository.findById("master_1")).thenReturn(Optional.of(masterAdmin));

        ResponseEntity<?> resp = adminController.toggleBlockAdmin("master_1", null, "some_admin");
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) resp.getBody();
        assertNotNull(body);
        assertTrue(body.get("error").toString().contains("Master super admin account cannot be blocked"));
    }

    @Test
    void testUpdateAdmin_UpdatesNameRolePassword() {
        User admin = User.builder()
                .id("admin_456")
                .name("Old Name")
                .email("admin456@cyvanta.com")
                .passwordHash(passwordEncoder.encode("oldPassword123"))
                .role(User.Role.ADMIN)
                .status("active")
                .build();

        when(userRepository.findById("admin_456")).thenReturn(Optional.of(admin));

        Map<String, Object> updatePayload = new HashMap<>();
        updatePayload.put("name", "New Admin Name");
        updatePayload.put("email", "admin456@cyvanta.com");
        updatePayload.put("role", "CONTENT_MANAGER");
        updatePayload.put("password", "newSecret999");
        updatePayload.put("phone", "+919876543210");

        ResponseEntity<?> resp = adminController.updateAdmin("admin_456", updatePayload, "super_admin");
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) resp.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("success"));
        assertEquals("New Admin Name", body.get("name"));
        assertEquals("CONTENT_MANAGER", body.get("role"));
        assertEquals(User.Role.CONTENT_MANAGER, admin.getRole());

        // Verify password was updated with BCrypt
        assertTrue(passwordEncoder.matches("newSecret999", admin.getPasswordHash()));
        assertEquals("+919876543210", admin.getPhone());
    }

    @Test
    void testForgotPassword_Success() {
        User admin = User.builder()
                .id("admin_789")
                .name("Admin User")
                .email("admin789@cyvanta.com")
                .status("active")
                .isBlocked(false)
                .is_blocked(0)
                .build();

        when(userRepository.findByEmail("admin789@cyvanta.com")).thenReturn(Optional.of(admin));

        Map<String, String> body = Map.of("email", "admin789@cyvanta.com");
        ResponseEntity<?> resp = adminController.forgotPassword(body);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(admin.getOtp());
        assertEquals(6, admin.getOtp().length());
        assertNotNull(admin.getOtpExpiry());
        verify(emailService, times(1)).sendPasswordResetEmail(eq("admin789@cyvanta.com"), anyString());
    }

    @Test
    void testForgotPassword_BlockedAdmin_Forbidden() {
        User blockedAdmin = User.builder()
                .id("admin_blocked")
                .name("Blocked Admin")
                .email("blocked@cyvanta.com")
                .status("blocked")
                .isBlocked(true)
                .is_blocked(1)
                .build();

        when(userRepository.findByEmail("blocked@cyvanta.com")).thenReturn(Optional.of(blockedAdmin));

        Map<String, String> body = Map.of("email", "blocked@cyvanta.com");
        ResponseEntity<?> resp = adminController.forgotPassword(body);

        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());
        Map<?, ?> respBody = (Map<?, ?>) resp.getBody();
        assertNotNull(respBody);
        assertEquals("Your account is blocked", respBody.get("message"));
    }

    @Test
    void testResetPassword_Success() {
        User admin = User.builder()
                .id("admin_reset")
                .name("Reset Admin")
                .email("reset@cyvanta.com")
                .status("active")
                .isBlocked(false)
                .is_blocked(0)
                .otp("123456")
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("reset@cyvanta.com")).thenReturn(Optional.of(admin));

        Map<String, String> body = Map.of(
                "identifier", "reset@cyvanta.com",
                "otp", "123456",
                "password", "BrandNewPass123"
        );

        ResponseEntity<?> resp = adminController.resetPassword(body);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNull(admin.getOtp());
        assertNull(admin.getOtpExpiry());
        assertTrue(passwordEncoder.matches("BrandNewPass123", admin.getPasswordHash()));
    }
}
