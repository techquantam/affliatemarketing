package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Setting;
import com.cyvanta.affiliate_app.model.Settings;
import com.cyvanta.affiliate_app.repository.SettingRepository;
import com.cyvanta.affiliate_app.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/admin/settings", "/api/admin/settings"})
@RequiredArgsConstructor
public class AdminSettingController {

    private final SettingRepository settingRepo;
    private final SettingsRepository settingsRepository;

    @PutMapping
    public ResponseEntity<?> update(@RequestBody Map<String, Object> map) {
        String minVal = "500";
        if (map != null) {
            if (map.containsKey("min_withdrawal") && map.get("min_withdrawal") != null) {
                minVal = String.valueOf(map.get("min_withdrawal")).trim();
            } else if (map.containsKey("minimumWithdrawal") && map.get("minimumWithdrawal") != null) {
                minVal = String.valueOf(map.get("minimumWithdrawal")).trim();
            }
        }

        settingRepo.save(new Setting("min_withdrawal", minVal));

        try {
            double parsed = Double.parseDouble(minVal);
            Settings settings = settingsRepository.findAll().stream().findFirst().orElseGet(() ->
                    Settings.builder().build()
            );
            settings.setMinimumWithdrawal(parsed);
            settingsRepository.save(settings);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of("message", "Updated", "min_withdrawal", minVal));
    }

    @GetMapping
    public Map<String, Object> get() {
        String min = settingRepo.findById("min_withdrawal")
                .map(Setting::getValue)
                .orElse("500");
        return Map.of("min_withdrawal", min);
    }
}
