package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Settings;
import com.cyvanta.affiliate_app.model.SharedCommission;
import com.cyvanta.affiliate_app.model.SharedLink;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.SettingsRepository;
import com.cyvanta.affiliate_app.repository.SharedCommissionRepository;
import com.cyvanta.affiliate_app.repository.SharedLinkRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/shared-links")
@RequiredArgsConstructor
public class SharedLinkController {

    private final SharedLinkRepository sharedLinkRepository;
    private final SharedCommissionRepository sharedCommissionRepository;
    private final UserRepository userRepository;
    private final SettingsRepository settingsRepository;
    private final WalletService walletService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping
    public ResponseEntity<List<SharedLink>> getAll() {
        return ResponseEntity.ok(sharedLinkRepository.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SharedLink>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(sharedLinkRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<SharedLink> create(@RequestBody SharedLink link) {
        link.setDate(LocalDate.now());
        if (link.getClicksCount() == null) link.setClicksCount(0);
        if (link.getConversionsCount() == null) link.setConversionsCount(0);
        if (link.getTotalEarnings() == null) link.setTotalEarnings(0.0);
        link.setStatus("active");
        SharedLink saved = sharedLinkRepository.save(link);
        saved.setShortUrl(frontendUrl + "/#/share/" + saved.getId());
        return ResponseEntity.ok(sharedLinkRepository.save(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        sharedLinkRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/click")
    public ResponseEntity<SharedLink> incrementClick(@PathVariable String id) {
        return sharedLinkRepository.findById(id).map(link -> {
            link.setClicksCount((link.getClicksCount() != null ? link.getClicksCount() : 0) + 1);
            return ResponseEntity.ok(sharedLinkRepository.save(link));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/simulate")
    public ResponseEntity<SharedLink> simulateConversion(@PathVariable String id) {
        return sharedLinkRepository.findById(id).map(link -> {
            // 1. Increment clicks and conversions
            link.setClicksCount((link.getClicksCount() != null ? link.getClicksCount() : 0) + 1);
            link.setConversionsCount((link.getConversionsCount() != null ? link.getConversionsCount() : 0) + 1);
            SharedLink savedLink = sharedLinkRepository.save(link);

            // 2. Resolve user & calculate commission
            String userId = link.getUserId();
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                String userName = user != null && user.getName() != null ? user.getName() : link.getUserName();
                Double userRate = user != null && user.getSharedCommissionRate() != null
                        ? user.getSharedCommissionRate()
                        : settingsRepository.findAll().stream().findFirst()
                                .map(Settings::getSharedCommissionPercent).orElse(5.0);

                Double orderPrice = 500.0;
                Double totalCommissionPct = 10.0;
                Double totalCommission = orderPrice * (totalCommissionPct / 100.0);
                Double userPayout = (orderPrice * userRate) / 100.0;
                Double adminProfit = Math.max(0.0, totalCommission - userPayout);

                String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String clickId = "SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                // 3. Create Pending SharedCommission
                SharedCommission sc = SharedCommission.builder()
                        .userId(userId)
                        .userName(userName)
                        .linkId(link.getId())
                        .shareId(link.getId())
                        .clickId(clickId)
                        .orderId(orderId)
                        .productName(link.getProductName() != null && !link.getProductName().trim().isEmpty() ? link.getProductName() : "Simulated Product")
                        .store(link.getStore() != null && !link.getStore().trim().isEmpty() ? link.getStore() : "Amazon")
                        .purchaseAmount(orderPrice)
                        .commissionRate(userRate)
                        .commissionAmount(totalCommission)
                        .userSharePercent(totalCommission > 0 ? (userPayout / totalCommission) * 100.0 : 100.0)
                        .userCommissionAmount(userPayout)
                        .adminCommissionPercent(totalCommission > 0 ? (adminProfit / totalCommission) * 100.0 : 0.0)
                        .adminCommissionAmount(adminProfit)
                        .status("pending")
                        .date(LocalDate.now())
                        .build();
                sharedCommissionRepository.save(sc);

                // 4. Update Wallet pending balance and transaction ledger
                walletService.processPendingCommission(userId, userPayout);
                walletService.recordTransaction(
                        userId,
                        userPayout,
                        "CREDIT",
                        "COMMISSION",
                        "Pending commission for " + sc.getProductName(),
                        clickId,
                        "PENDING"
                );
                log.info("[SIMULATE] Simulated order {} created: Payout ₹{} (rate {}%) added to pending wallet for user {}",
                        orderId, userPayout, userRate, userId);
            }

            return ResponseEntity.ok(savedLink);
        }).orElse(ResponseEntity.notFound().build());
    }
}
