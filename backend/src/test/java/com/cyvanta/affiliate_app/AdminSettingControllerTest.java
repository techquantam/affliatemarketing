package com.cyvanta.affiliate_app;

import com.cyvanta.affiliate_app.controller.AdminSettingController;
import com.cyvanta.affiliate_app.controller.SettingsController;
import com.cyvanta.affiliate_app.controller.WithdrawalsController;
import com.cyvanta.affiliate_app.model.Setting;
import com.cyvanta.affiliate_app.model.Settings;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.WithdrawalRequest;
import com.cyvanta.affiliate_app.repository.*;
import com.cyvanta.affiliate_app.service.WalletService;
import com.cyvanta.affiliate_app.service.WithdrawalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminSettingControllerTest {

    private SettingRepository settingRepo;
    private SettingsRepository settingsRepository;
    private AdminActivityLogRepository adminActivityLogRepository;
    private AdminSettingController adminSettingController;
    private SettingsController settingsController;
    private WithdrawalService withdrawalService;

    private WithdrawalRequestRepository withdrawalRepository;
    private WalletService walletService;
    private UserRepository userRepository;
    private NotificationRepository notificationRepository;
    private WithdrawalsController withdrawalsController;

    @BeforeEach
    void setUp() {
        settingRepo = mock(SettingRepository.class);
        settingsRepository = mock(SettingsRepository.class);
        adminActivityLogRepository = mock(AdminActivityLogRepository.class);

        adminSettingController = new AdminSettingController(settingRepo, settingsRepository);
        settingsController = new SettingsController(settingsRepository, settingRepo, adminActivityLogRepository);
        withdrawalService = new WithdrawalService(settingRepo, settingsRepository);

        withdrawalRepository = mock(WithdrawalRequestRepository.class);
        walletService = mock(WalletService.class);
        userRepository = mock(UserRepository.class);
        notificationRepository = mock(NotificationRepository.class);

        withdrawalsController = new WithdrawalsController(
                withdrawalRepository,
                walletService,
                userRepository,
                notificationRepository,
                withdrawalService
        );
    }

    @Test
    void testAdminSettingUpdateAndGet() {
        when(settingRepo.findById("min_withdrawal")).thenReturn(Optional.of(new Setting("min_withdrawal", "1000")));

        ResponseEntity<?> updateResp = adminSettingController.update(Map.of("min_withdrawal", "1000"));
        assertEquals(HttpStatus.OK, updateResp.getStatusCode());
        verify(settingRepo).save(argThat(s -> "min_withdrawal".equals(s.getKey()) && "1000".equals(s.getValue())));

        Map<String, Object> getResp = adminSettingController.get();
        assertEquals("1000", getResp.get("min_withdrawal"));
    }

    @Test
    void testSettingsControllerReturnsMinWithdrawal() {
        Settings defaultSettings = Settings.builder().minimumWithdrawal(500.0).cashbackPercent(8.0).build();
        when(settingsRepository.findAll()).thenReturn(List.of(defaultSettings));
        when(settingRepo.findById("min_withdrawal")).thenReturn(Optional.of(new Setting("min_withdrawal", "750")));

        ResponseEntity<Map<String, Object>> resp = settingsController.getSettings();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
        assertEquals("750", resp.getBody().get("min_withdrawal"));
        assertEquals(750.0, resp.getBody().get("minimumWithdrawal"));
    }

    @Test
    void testWithdrawalServiceValidationThrowsExceptionWhenBelowMin() {
        when(settingRepo.findById("min_withdrawal")).thenReturn(Optional.of(new Setting("min_withdrawal", "500")));

        WithdrawalRequest lowReq = WithdrawalRequest.builder().amount(250.0).userId("usr1").build();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                withdrawalService.validateMinimumWithdrawal(lowReq)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Minimum withdrawal is Rs. 500"));

        WithdrawalRequest validReq = WithdrawalRequest.builder().amount(500.0).userId("usr1").build();
        assertDoesNotThrow(() -> withdrawalService.validateMinimumWithdrawal(validReq));
    }

    @Test
    void testWithdrawalsControllerRejectsAmountBelowMinLimit() {
        when(settingRepo.findById("min_withdrawal")).thenReturn(Optional.of(new Setting("min_withdrawal", "500")));

        User user = User.builder().id("u_101").name("Test User").kycStatus("approved").build();
        when(userRepository.findById("u_101")).thenReturn(Optional.of(user));

        WithdrawalRequest req = WithdrawalRequest.builder().userId("u_101").amount(150.0).build();
        ResponseEntity<?> resp = withdrawalsController.create(req, null);

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) resp.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("success"));
        assertEquals("Minimum withdrawal is Rs. 500", body.get("message"));
    }
}