package com.cyvanta.affiliate_app.service;

import com.cyvanta.affiliate_app.model.Setting;
import com.cyvanta.affiliate_app.model.WithdrawalRequest;
import com.cyvanta.affiliate_app.repository.SettingRepository;
import com.cyvanta.affiliate_app.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WithdrawalService {

    private final SettingRepository settingRepo;
    private final SettingsRepository settingsRepository;

    public int getMinimumWithdrawalLimit() {
        try {
            return Integer.parseInt(settingRepo.findById("min_withdrawal")
                    .orElseGet(() -> new Setting("min_withdrawal", "500")).getValue());
        } catch (Exception e) {
            try {
                return settingsRepository.findAll().stream().findFirst()
                        .map(s -> s.getMinimumWithdrawal() != null ? s.getMinimumWithdrawal().intValue() : 500)
                        .orElse(500);
            } catch (Exception ignored) {
                return 500;
            }
        }
    }

    public void validateMinimumWithdrawal(WithdrawalRequest req) {
        int minLimit = getMinimumWithdrawalLimit();
        if (req == null || req.getAmount() == null || req.getAmount() < minLimit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum withdrawal is Rs. " + minLimit);
        }
    }
}
