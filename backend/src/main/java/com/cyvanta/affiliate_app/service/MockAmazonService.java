package com.cyvanta.affiliate_app.service;

import com.cyvanta.affiliate_app.model.AffiliateClick;
import com.cyvanta.affiliate_app.model.Product;
import com.cyvanta.affiliate_app.model.ShareAction;
import com.cyvanta.affiliate_app.model.SharedCommission;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.SharedLink;
import com.cyvanta.affiliate_app.model.Settings;
import com.cyvanta.affiliate_app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockAmazonService {

    private final AffiliateClickRepository affiliateClickRepository;
    private final ShareActionRepository shareActionRepository;
    private final SharedLinkRepository sharedLinkRepository;
    private final ProductRepository productRepository;
    private final SharedCommissionRepository sharedCommissionRepository;
    private final UserRepository userRepository;
    private final SettingsRepository settingsRepository;
    private final WalletService walletService;

    @Async
    public void simulatePurchaseAsync(String trackingId) {
        log.info("[MOCK-MERCHANT] Simulating purchase tracking for trackingId: {}", trackingId);
        try {
            // Wait 5 seconds to simulate user browsing and buying
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        affiliateClickRepository.findByTrackingId(trackingId).ifPresent(click -> {
            if ("PENDING".equals(click.getStatus())) {
                String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                click.setStatus("PURCHASED");
                click.setOrderId(orderId);
                affiliateClickRepository.save(click);
                log.info("[MOCK-MERCHANT] ✅ Purchase simulated! Order {} created for trackingId: {}", orderId, trackingId);

                // Create a pending SharedCommission so it shows in the admin panel immediately
                createPendingCommission(click);
            }
        });
    }

    private void createPendingCommission(AffiliateClick click) {
        try {
            // Resolve referrer (check click, ShareAction, then SharedLink)
            String referrerId = click.getReferrerId();
            if (referrerId == null && click.getShareId() != null) {
                referrerId = shareActionRepository.findByShareId(click.getShareId())
                        .map(ShareAction::getReferrerId).orElse(null);
                if (referrerId == null) {
                    referrerId = sharedLinkRepository.findById(click.getShareId())
                            .map(SharedLink::getUserId).orElse(null);
                }
            }
            if (referrerId == null) {
                log.info("[MOCK-MERCHANT] No referrer for trackingId={}, skipping commission", click.getTrackingId());
                return;
            }

            // Get product and store info
            String productName = "Product";
            String platform = "Amazon";
            Double productPrice = 500.0;
            Double productCommPct = 10.0;

            Optional<SharedLink> sharedLinkOpt = click.getShareId() != null
                    ? sharedLinkRepository.findById(click.getShareId())
                    : Optional.empty();

            if (sharedLinkOpt.isPresent()) {
                SharedLink link = sharedLinkOpt.get();
                if (link.getProductName() != null && !link.getProductName().trim().isEmpty()) {
                    productName = link.getProductName();
                }
                if (link.getStore() != null && !link.getStore().trim().isEmpty()) {
                    platform = link.getStore();
                }
                link.setConversionsCount((link.getConversionsCount() != null ? link.getConversionsCount() : 0) + 1);
                sharedLinkRepository.save(link);
            } else if (click.getProductId() != null) {
                Optional<Product> prodOpt = productRepository.findById(click.getProductId());
                if (prodOpt.isPresent()) {
                    if (prodOpt.get().getName() != null) productName = prodOpt.get().getName();
                    if (prodOpt.get().getPlatform() != null) platform = prodOpt.get().getPlatform();
                    if (prodOpt.get().getPrice() != null) productPrice = prodOpt.get().getPrice();
                    if (prodOpt.get().getCommissionPercentage() != null) productCommPct = prodOpt.get().getCommissionPercentage();
                }
            }

            // Resolve user commission rate
            User referrer = userRepository.findById(referrerId).orElse(null);
            String referrerName = referrer != null && referrer.getName() != null ? referrer.getName() : "Affiliate";
            Double userRate = referrer != null && referrer.getSharedCommissionRate() != null
                    ? referrer.getSharedCommissionRate()
                    : settingsRepository.findAll().stream().findFirst()
                            .map(Settings::getSharedCommissionPercent).orElse(5.0);

            Double totalCommission = productPrice * (productCommPct / 100.0);
            Double userPayout = (productPrice * userRate) / 100.0;
            Double adminProfit = Math.max(0.0, totalCommission - userPayout);

            // Create pending SharedCommission
            SharedCommission sc = SharedCommission.builder()
                    .userId(referrerId)
                    .userName(referrerName)
                    .linkId(click.getShareId())
                    .shareId(click.getShareId())
                    .clickId(click.getTrackingId())
                    .orderId(click.getOrderId())
                    .productName(productName)
                    .store(platform)
                    .purchaseAmount(productPrice)
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

            // Add to pending wallet
            walletService.processPendingCommission(referrerId, userPayout);
            walletService.recordTransaction(
                    referrerId,
                    userPayout,
                    "CREDIT",
                    "COMMISSION",
                    "Pending commission for " + productName,
                    click.getTrackingId(),
                    "PENDING"
            );

            log.info("[MOCK-MERCHANT] Pending commission ₹{} (rate {}%) created for referrer {} (order {})",
                    userPayout, userRate, referrerName, click.getOrderId());
        } catch (Exception e) {
            log.error("[MOCK-MERCHANT] Failed to create pending commission: {}", e.getMessage(), e);
        }
    }
}
