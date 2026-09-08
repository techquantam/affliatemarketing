package com.cyvanta.affiliate_app;

import com.cyvanta.affiliate_app.config.CheckIfBlocked;
import com.cyvanta.affiliate_app.controller.UserController;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.repository.AdminActivityLogRepository;
import com.cyvanta.affiliate_app.repository.AdminLoginHistoryRepository;
import com.cyvanta.affiliate_app.repository.NotificationRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.EmailService;
import com.cyvanta.affiliate_app.service.SmsService;
import com.cyvanta.affiliate_app.service.WalletService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class UserControllerBlockTest {

    private UserRepository userRepository;
    private AdminActivityLogRepository adminActivityLogRepository;
    private AdminLoginHistoryRepository adminLoginHistoryRepository;
    private WalletService walletService;
    private EmailService emailService;
    private SmsService smsService;
    private NotificationRepository notificationRepository;
    private UserController userController;
    private CheckIfBlocked checkIfBlockedFilter;
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        adminActivityLogRepository = mock(AdminActivityLogRepository.class);
        adminLoginHistoryRepository = mock(AdminLoginHistoryRepository.class);
        walletService = mock(WalletService.class);
        emailService = mock(EmailService.class);
        smsService = mock(SmsService.class);
        notificationRepository = mock(NotificationRepository.class);

        userController = new UserController(
                userRepository,
                adminActivityLogRepository,
                adminLoginHistoryRepository,
                walletService,
                emailService,
                smsService,
                notificationRepository
        );

        checkIfBlockedFilter = new CheckIfBlocked(userRepository);

        Wallet mockWallet = Wallet.builder().userId("u_test").approvedBalance(100.0).pendingBalance(0.0).build();
        when(walletService.getOrCreateWallet(anyString())).thenReturn(mockWallet);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testUserModelSynchronization() {
        User user = new User();
        user.setId("u_test");
        user.setStatus("active");
        assertEquals(0, user.getIs_blocked());
        assertFalse(user.getIsBlocked());

        // Test blocking
        user.setIsBlocked(true);
        assertEquals("blocked", user.getStatus());
        assertEquals(1, user.getIs_blocked());
        assertTrue(user.getIsBlocked());

        // Test unblocking
        user.setIsBlocked(false);
        assertEquals("active", user.getStatus());
        assertEquals(0, user.getIs_blocked());
        assertFalse(user.getIsBlocked());

        // Test is_blocked setter
        user.setIs_blocked(1);
        assertEquals("blocked", user.getStatus());
        assertTrue(user.getIsBlocked());
        assertEquals(1, user.getIs_blocked());

        user.setIs_blocked(0);
        assertEquals("active", user.getStatus());
        assertFalse(user.getIsBlocked());
        assertEquals(0, user.getIs_blocked());

        // Test status setter
        user.setStatus("blocked");
        assertEquals(1, user.getIs_blocked());
        assertTrue(user.getIsBlocked());

        user.setStatus("active");
        assertEquals(0, user.getIs_blocked());
        assertFalse(user.getIsBlocked());
    }

    @Test
    void testBlockUserEndpoint() {
        User user = User.builder()
                .id("u_test")
                .name("Rahul Sharma")
                .email("rahul.sharma@gmail.com")
                .referralCode("TESTREF123")
                .isVerified(true)
                .status("active")
                .isBlocked(false)
                .is_blocked(0)
                .build();

        when(userRepository.findById("u_test")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = userController.blockUser("u_test", null);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("blocked", body.get("status"));
        assertEquals(true, body.get("isBlocked"));
        assertEquals(1, body.get("is_blocked"));

        // Verify entity was updated and saved
        assertEquals("blocked", user.getStatus());
        assertTrue(user.getIsBlocked());
        assertEquals(1, user.getIs_blocked());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testUnblockUserEndpoint() {
        User user = User.builder()
                .id("u_test")
                .name("Rahul Sharma")
                .email("rahul.sharma@gmail.com")
                .referralCode("TESTREF123")
                .isVerified(true)
                .status("blocked")
                .isBlocked(true)
                .is_blocked(1)
                .build();

        when(userRepository.findById("u_test")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = userController.unblockUser("u_test", null);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("active", body.get("status"));
        assertEquals(false, body.get("isBlocked"));
        assertEquals(0, body.get("is_blocked"));

        // Verify entity was updated and saved
        assertEquals("active", user.getStatus());
        assertFalse(user.getIsBlocked());
        assertEquals(0, user.getIs_blocked());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testBlockedUserLoginDeniedWith403AndExactMessage() {
        User blockedUser = User.builder()
                .id("u_test")
                .name("Blocked User")
                .email("blocked@test.com")
                .referralCode("TESTREF123")
                .isVerified(true)
                .passwordHash(encoder.encode("password123"))
                .status("blocked")
                .isBlocked(true)
                .is_blocked(1)
                .build();

        when(userRepository.findByEmail("blocked@test.com")).thenReturn(Optional.of(blockedUser));

        Map<String, String> credentials = Map.of(
                "email", "blocked@test.com",
                "password", "password123"
        );

        ResponseEntity<?> response = userController.loginUser(credentials);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode()); // 403 Forbidden

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("status"));
        assertEquals("Your account is blocked by admin", body.get("message"));
        assertEquals(true, body.get("isBlocked"));
        assertEquals(1, body.get("is_blocked"));
    }

    @Test
    void testActiveUserLoginAllowed() {
        User activeUser = User.builder()
                .id("u_test")
                .name("Active User")
                .email("active@test.com")
                .referralCode("TESTREF123")
                .isVerified(true)
                .passwordHash(encoder.encode("password123"))
                .status("active")
                .isBlocked(false)
                .is_blocked(0)
                .build();

        when(userRepository.findByEmail("active@test.com")).thenReturn(Optional.of(activeUser));

        Map<String, String> credentials = Map.of(
                "email", "active@test.com",
                "password", "password123"
        );

        ResponseEntity<?> response = userController.loginUser(credentials);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("active", body.get("status"));
        assertEquals(false, body.get("isBlocked"));
        assertEquals(0, body.get("is_blocked"));
    }

    @Test
    void testCheckIfBlockedMiddlewareBlocksApiAccess() throws Exception {
        User blockedUser = User.builder()
                .id("u_blocked")
                .name("Blocked User")
                .email("blocked@test.com")
                .status("blocked")
                .isBlocked(true)
                .is_blocked(1)
                .build();

        when(userRepository.findById("u_blocked")).thenReturn(Optional.of(blockedUser));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/deals");
        request.addHeader("X-User-Id", "u_blocked");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        checkIfBlockedFilter.doFilter(request, response, filterChain);

        // Filter must block with 403 and NOT call downstream chain
        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"status\": false") || response.getContentAsString().contains("\"status\":false"));
        assertTrue(response.getContentAsString().contains("Your account is blocked by admin"));
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testCheckIfBlockedMiddlewareAllowsActiveUser() throws Exception {
        User activeUser = User.builder()
                .id("u_active")
                .name("Active User")
                .email("active@test.com")
                .status("active")
                .isBlocked(false)
                .is_blocked(0)
                .build();

        when(userRepository.findById("u_active")).thenReturn(Optional.of(activeUser));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/deals");
        request.addHeader("X-User-Id", "u_active");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        checkIfBlockedFilter.doFilter(request, response, filterChain);

        // Filter must allow through to next filter in chain
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
