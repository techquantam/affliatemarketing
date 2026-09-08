package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Setting;
import com.cyvanta.affiliate_app.model.Settings;
import com.cyvanta.affiliate_app.repository.SettingRepository;
import com.cyvanta.affiliate_app.repository.SettingsRepository;
import com.cyvanta.affiliate_app.model.AdminActivityLog;
import com.cyvanta.affiliate_app.repository.AdminActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/settings", "/settings"})
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsRepository settingsRepository;
    private final SettingRepository settingRepo;
    private final AdminActivityLogRepository adminActivityLogRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSettings() {
        Settings settings = settingsRepository.findAll().stream().findFirst().orElseGet(() -> {
            Settings defaultSettings = Settings.builder()
                    .cashbackPercent(8.0)
                    .holdDays(30)
                    .minimumWithdrawal(500.0)
                    .sharedCommissionPercent(5.0)
                    .sharedCommissionHoldDays(30)
                    .seoTitle("Cyvanta Cashback Deals & Affiliate Offers")
                    .seoDescription("Save with cashback deals, affiliate coupons, and partner offers on Amazon, Flipkart, Myntra and more.")
                    .seoKeywords("cashback, affiliate, deals, coupons, Amazon, Flipkart, Myntra, save money")
                    .seoImageUrl("https://cyvanta.com/default-og-image.png")
                    .build();
            return settingsRepository.save(defaultSettings);
        });

        String min = settingRepo.findById("min_withdrawal")
                .map(Setting::getValue)
                .orElse(null);

        if (min != null) {
            try {
                settings.setMinimumWithdrawal(Double.parseDouble(min));
            } catch (Exception ignored) {}
        } else if (settings.getMinimumWithdrawal() != null) {
            min = String.valueOf(settings.getMinimumWithdrawal().intValue());
            settingRepo.save(new Setting("min_withdrawal", min));
        } else {
            min = "500";
            settings.setMinimumWithdrawal(500.0);
            settingRepo.save(new Setting("min_withdrawal", min));
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", settings.getId());
        resp.put("cashbackPercent", settings.getCashbackPercent());
        resp.put("holdDays", settings.getHoldDays());
        resp.put("minimumWithdrawal", settings.getMinimumWithdrawal());
        resp.put("min_withdrawal", min);
        resp.put("minWithdrawal", settings.getMinimumWithdrawal());
        resp.put("sharedCommissionPercent", settings.getSharedCommissionPercent());
        resp.put("sharedCommissionHoldDays", settings.getSharedCommissionHoldDays());
        resp.put("seoTitle", settings.getSeoTitle());
        resp.put("seoDescription", settings.getSeoDescription());
        resp.put("seoKeywords", settings.getSeoKeywords());
        resp.put("seoImageUrl", settings.getSeoImageUrl());

        return ResponseEntity.ok(resp);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> body) {
        AdminActivityLog log = AdminActivityLog.builder()
                .adminId(null)
                .adminEmail("system")
                .adminRole("SYSTEM")
                .action("UPDATE_SETTINGS")
                .target("settings")
                .details("Platform settings updated via API")
                .build();
        adminActivityLogRepository.save(log);

        String minVal = "500";
        if (body.containsKey("min_withdrawal") && body.get("min_withdrawal") != null) {
            minVal = String.valueOf(body.get("min_withdrawal")).trim();
        } else if (body.containsKey("minimumWithdrawal") && body.get("minimumWithdrawal") != null) {
            minVal = String.valueOf(body.get("minimumWithdrawal")).trim();
        }

        settingRepo.save(new Setting("min_withdrawal", minVal));

        double minDouble = 500.0;
        try {
            minDouble = Double.parseDouble(minVal);
        } catch (Exception ignored) {}

        final double finalMinDouble = minDouble;
        Settings settings = settingsRepository.findAll().stream().findFirst().orElseGet(() ->
                Settings.builder().build()
        );

        if (body.containsKey("cashbackPercent") && body.get("cashbackPercent") != null) {
            settings.setCashbackPercent(Double.valueOf(String.valueOf(body.get("cashbackPercent"))));
        }
        if (body.containsKey("holdDays") && body.get("holdDays") != null) {
            settings.setHoldDays(Integer.valueOf(String.valueOf(body.get("holdDays"))));
        }
        settings.setMinimumWithdrawal(finalMinDouble);
        if (body.containsKey("sharedCommissionPercent") && body.get("sharedCommissionPercent") != null) {
            settings.setSharedCommissionPercent(Double.valueOf(String.valueOf(body.get("sharedCommissionPercent"))));
        }
        if (body.containsKey("sharedCommissionHoldDays") && body.get("sharedCommissionHoldDays") != null) {
            settings.setSharedCommissionHoldDays(Integer.valueOf(String.valueOf(body.get("sharedCommissionHoldDays"))));
        }
        if (body.containsKey("seoTitle")) settings.setSeoTitle((String) body.get("seoTitle"));
        if (body.containsKey("seoDescription")) settings.setSeoDescription((String) body.get("seoDescription"));
        if (body.containsKey("seoKeywords")) settings.setSeoKeywords((String) body.get("seoKeywords"));
        if (body.containsKey("seoImageUrl")) settings.setSeoImageUrl((String) body.get("seoImageUrl"));

        Settings saved = settingsRepository.save(settings);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("cashbackPercent", saved.getCashbackPercent());
        resp.put("holdDays", saved.getHoldDays());
        resp.put("minimumWithdrawal", saved.getMinimumWithdrawal());
        resp.put("min_withdrawal", minVal);
        resp.put("message", "Updated");

        return ResponseEntity.ok(resp);
    }
}
