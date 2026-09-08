package com.cyvanta.affiliate_app;

import com.cyvanta.affiliate_app.controller.KycController;
import com.cyvanta.affiliate_app.controller.UserController;
import com.cyvanta.affiliate_app.model.Kyc;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.AdminActivityLogRepository;
import com.cyvanta.affiliate_app.repository.AdminLoginHistoryRepository;
import com.cyvanta.affiliate_app.repository.KycRepository;
import com.cyvanta.affiliate_app.repository.NotificationRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.EmailService;
import com.cyvanta.affiliate_app.service.SmsService;
import com.cyvanta.affiliate_app.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class KycControllerTest {

    private UserRepository userRepository;
    private KycRepository kycRepository;
    private NotificationRepository notificationRepository;
    private WalletService walletService;
    private KycController kycController;

    private AdminActivityLogRepository adminActivityLogRepository;
    private AdminLoginHistoryRepository adminLoginHistoryRepository;
    private EmailService emailService;
    private SmsService smsService;
    private UserController userController;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        kycRepository = mock(KycRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        walletService = mock(WalletService.class);

        kycController = new KycController(
                userRepository,
                kycRepository,
                notificationRepository,
                walletService
        );

        adminActivityLogRepository = mock(AdminActivityLogRepository.class);
        adminLoginHistoryRepository = mock(AdminLoginHistoryRepository.class);
        emailService = mock(EmailService.class);
        smsService = mock(SmsService.class);

        userController = new UserController(
                userRepository,
                adminActivityLogRepository,
                adminLoginHistoryRepository,
                walletService,
                emailService,
                smsService,
                notificationRepository
        );

        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(kycRepository.save(any(Kyc.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void testApproveKyc_SuccessUpdatesBothKycAndUserColumns() {
        User user = User.builder()
                .id("usr_101")
                .name("Alice")
                .email("alice@test.com")
                .kycStatus("pending")
                .kyc_status("pending")
                .is_kyc_verified(0)
                .isKycVerified(false)
                .build();

        Kyc kyc = Kyc.builder()
                .id("kyc_101")
                .user_id("usr_101")
                .status("pending")
                .is_verified(0)
                .build();

        when(userRepository.findById("usr_101")).thenReturn(Optional.of(user));
        when(kycRepository.findByUserId("usr_101")).thenReturn(Optional.of(kyc));

        ResponseEntity<?> response = kycController.approve("usr_101", Map.of("admin_remark", "Approved"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getHeaders().getFirst("Cache-Control").contains("no-cache"));

        ArgumentCaptor<Kyc> kycCaptor = ArgumentCaptor.forClass(Kyc.class);
        verify(kycRepository).save(kycCaptor.capture());
        Kyc savedKyc = kycCaptor.getValue();
        assertEquals("approved", savedKyc.getStatus());
        assertEquals(1, savedKyc.getIs_verified());
        assertEquals("Approved", savedKyc.getAdmin_remark());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("approved", savedUser.getKycStatus());
        assertEquals("approved", savedUser.getKyc_status());
        assertEquals(1, savedUser.getIs_kyc_verified());
        assertTrue(savedUser.getIsKycVerified());
        assertEquals("Approved", savedUser.getAdmin_remark());
    }

    @Test
    void testRejectKyc_SuccessUpdatesColumnsAndRemarks() {
        User user = User.builder()
                .id("usr_102")
                .name("Bob")
                .email("bob@test.com")
                .kycStatus("pending")
                .kyc_status("pending")
                .is_kyc_verified(0)
                .build();

        Kyc kyc = Kyc.builder()
                .id("kyc_102")
                .user_id("usr_102")
                .status("pending")
                .is_verified(0)
                .build();

        when(userRepository.findById("usr_102")).thenReturn(Optional.of(user));
        when(kycRepository.findByUserId("usr_102")).thenReturn(Optional.of(kyc));

        ResponseEntity<?> response = kycController.reject("usr_102", Map.of("remarks", "Document illegible"));

        assertEquals(HttpStatus.OK, response.getStatusCode());

        ArgumentCaptor<Kyc> kycCaptor = ArgumentCaptor.forClass(Kyc.class);
        verify(kycRepository).save(kycCaptor.capture());
        Kyc savedKyc = kycCaptor.getValue();
        assertEquals("rejected", savedKyc.getStatus());
        assertEquals(0, savedKyc.getIs_verified());
        assertEquals("Document illegible", savedKyc.getAdmin_remark());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("rejected", savedUser.getKycStatus());
        assertEquals("rejected", savedUser.getKyc_status());
        assertEquals(0, savedUser.getIs_kyc_verified());
        assertFalse(savedUser.getIsKycVerified());
        assertEquals("Document illegible", savedUser.getAdmin_remark());
    }

    @Test
    void testGetKycStatus_ReturnsLatestDbDataWithNoCacheHeaders() {
        User user = User.builder()
                .id("usr_103")
                .name("Charlie")
                .email("charlie@test.com")
                .kycStatus("approved")
                .kyc_status("approved")
                .is_kyc_verified(1)
                .isKycVerified(true)
                .admin_remark("Approved")
                .build();

        when(userRepository.findById("usr_103")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = kycController.getKycStatus("usr_103", null, null, null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("no-cache, no-store, must-revalidate, max-age=0", response.getHeaders().getFirst("Cache-Control"));

        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("approved", body.get("status"));
        assertEquals(1, body.get("is_verified"));
        assertEquals(1, body.get("is_kyc_verified"));
        assertEquals(true, body.get("isKycVerified"));
    }

    @Test
    void testProfileUpdateDoesNotResetApprovedKyc() {
        User approvedUser = User.builder()
                .id("usr_104")
                .name("Diana")
                .email("diana@test.com")
                .dob("1995-05-10")
                .gender("Female")
                .address("123 Main St")
                .city("Mumbai")
                .state("Maharashtra")
                .pincode("400001")
                .kycStatus("approved")
                .kyc_status("approved")
                .is_kyc_verified(1)
                .isKycVerified(true)
                .aadhaarNumber("123456789012")
                .panNumber("ABCDE1234F")
                .build();

        when(userRepository.findById("usr_104")).thenReturn(Optional.of(approvedUser));

        User profileUpdate = User.builder()
                .name("Diana Updated")
                .address("456 New Road")
                .build();

        ResponseEntity<?> response = userController.updateUser("usr_104", profileUpdate);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertEquals("approved", savedUser.getKycStatus());
        assertEquals("approved", savedUser.getKyc_status());
        assertEquals(1, savedUser.getIs_kyc_verified());
        assertTrue(savedUser.getIsKycVerified());
        assertEquals("Diana Updated", savedUser.getName());
        assertEquals("456 New Road", savedUser.getAddress());
    }

    @Test
    void testNormalizesApproveStringToApprovedInModel() {
        User user = new User();
        user.setKycStatus("approve");
        assertEquals("approved", user.getKycStatus());
        assertEquals("approved", user.getKyc_status());
        assertEquals(1, user.getIs_kyc_verified());
        assertTrue(user.getIsKycVerified());

        user.setKyc_status("approve");
        assertEquals("approved", user.getKycStatus());
        assertEquals("approved", user.getKyc_status());
    }
}