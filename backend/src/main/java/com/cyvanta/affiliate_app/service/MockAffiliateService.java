package com.cyvanta.affiliate_app.service;

import com.cyvanta.affiliate_app.model.*;
import com.cyvanta.affiliate_app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockAffiliateService implements AffiliateNetworkService {

    private final AffiliateClickRepository affiliateClickRepository;
    private final ShareActionRepository shareActionRepository;
    private final ProductRepository productRepository;
    private final CommissionHistoryRepository commissionHistoryRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final SharedCommissionRepository sharedCommissionRepository;
    private final SharedLinkRepository sharedLinkRepository;
    private final UserRepository userRepository;
    private final SettingsRepository settingsRepository;
    private final WalletService walletService;
    private final MockAmazonService mockAmazonService;

    @Override
    public void processClick(AffiliateClick click) {
        log.info("[AFFILIATE] Click created — trackingId={}, shareId={}, productId={}, buyerId={}",
                click.getTrackingId(), click.getShareId(), click.getProductId(), click.getBuyerId());

        // Resolve referrer from shareId (supporting both ShareAction and SharedLink) and store on the click
        if (click.getShareId() != null) {
            shareActionRepository.findByShareId(click.getShareId()).ifPresent(share -> {
                click.setReferrerId(share.getReferrerId());
            });
            if (click.getReferrerId() == null) {
                sharedLinkRepository.findById(click.getShareId()).ifPresent(link -> {
                    click.setReferrerId(link.getUserId());
                });
            }
            affiliateClickRepository.save(click);
            log.info("[AFFILIATE] Resolved referrer {} from shareId {}", click.getReferrerId(), click.getShareId());
        }

        // Simulate the merchant purchase (after 5 seconds, status → PURCHASED)
        mockAmazonService.simulatePurchaseAsync(click.getTrackingId());
    }

    @Override
    public void approveCommission(String trackingId) {
        Optional<AffiliateClick> clickOpt = affiliateClickRepository.findByTrackingId(trackingId);
        if (clickOpt.isEmpty()) {
            log.warn("[AFFILIATE] approveCommission — trackingId {} not found", trackingId);
            return;
        }

        AffiliateClick click = clickOpt.get();
        if (!"PURCHASED".equals(click.getStatus())) {
            log.warn("[AFFILIATE] approveCommission — trackingId {} status is {} (expected PURCHASED)", trackingId, click.getStatus());
            return;
        }

        click.setStatus("APPROVED");
        affiliateClickRepository.save(click);
        log.info("[AFFILIATE] Click {} status → APPROVED", trackingId);

        // Resolve referrer
        String referrerId = click.getReferrerId();
        if (referrerId == null && click.getShareId() != null) {
            Optional<ShareAction> shareOpt = shareActionRepository.findByShareId(click.getShareId());
            if (shareOpt.isPresent()) {
                referrerId = shareOpt.get().getReferrerId();
            } else {
                referrerId = sharedLinkRepository.findById(click.getShareId())
                        .map(SharedLink::getUserId).orElse(null);
            }
        }
        if (referrerId == null) {
            log.warn("[AFFILIATE] No referrer found for trackingId {}", trackingId);
            return;
        }

        // Resolve product and store info
        String productName = "Unknown Product";
        String platform = "Amazon";
        Double productPrice = 500.0;
        Double commissionPct = 10.0;

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
        } else if (click.getProductId() != null) {
            Optional<Product> prodOpt = productRepository.findById(click.getProductId());
            if (prodOpt.isPresent()) {
                if (prodOpt.get().getName() != null) productName = prodOpt.get().getName();
                if (prodOpt.get().getPlatform() != null) platform = prodOpt.get().getPlatform();
                if (prodOpt.get().getPrice() != null) productPrice = prodOpt.get().getPrice();
                if (prodOpt.get().getCommissionPercentage() != null) commissionPct = prodOpt.get().getCommissionPercentage();
            }
        }

        // Resolve user commission rate
        User referrer = userRepository.findById(referrerId).orElse(null);
        String referrerName = referrer != null && referrer.getName() != null ? referrer.getName() : "Affiliate";
        Double userRate = referrer != null && referrer.getSharedCommissionRate() != null
                ? referrer.getSharedCommissionRate()
                : settingsRepository.findAll().stream().findFirst()
                        .map(Settings::getSharedCommissionPercent).orElse(5.0);

        Double totalCommission = productPrice * (commissionPct / 100.0);
        Double userPayout = (productPrice * userRate) / 100.0;
        Double adminProfit = Math.max(0.0, totalCommission - userPayout);

        // 1. Record CommissionHistory
        CommissionHistory history = CommissionHistory.builder()
                .trackingId(trackingId)
                .referrerId(referrerId)
                .amount(userPayout)
                .status("APPROVED")
                .build();
        commissionHistoryRepository.save(history);
        log.info("[AFFILIATE] CommissionHistory created — trackingId={}, referrer={}, amount={}", trackingId, referrerId, userPayout);

        // 2. Credit referrer wallet (moves from pending -> approved)
        walletService.processApprovedCommission(referrerId, userPayout);
        log.info("[AFFILIATE] Wallet credited — referrer={}, amount={}", referrerId, userPayout);

        // 3. Record WalletTransaction audit log
        WalletTransaction wt = WalletTransaction.builder()
                .userId(referrerId)
                .trackingId(trackingId)
                .amount(userPayout)
                .type("CREDIT")
                .category("COMMISSION")
                .status("APPROVED")
                .description("Affiliate Commission Approved for Order: " + click.getOrderId())
                .build();
        walletTransactionRepository.save(wt);

        // 4. Update existing or create SharedCommission record for admin dashboard visibility
        Optional<SharedCommission> existingScOpt = click.getTrackingId() != null
                ? sharedCommissionRepository.findByClickId(click.getTrackingId())
                : Optional.empty();
        if (existingScOpt.isEmpty() && click.getOrderId() != null) {
            existingScOpt = sharedCommissionRepository.findByOrderId(click.getOrderId());
        }

        final boolean isNewSc = existingScOpt.isEmpty();

        SharedCommission sc = existingScOpt.orElseGet(SharedCommission::new);
        sc.setUserId(referrerId);
        sc.setUserName(referrerName);
        sc.setLinkId(click.getShareId());
        sc.setShareId(click.getShareId());
        sc.setClickId(click.getTrackingId());
        sc.setOrderId(click.getOrderId());
        sc.setProductName(productName);
        sc.setStore(platform);
        sc.setPurchaseAmount(productPrice);
        sc.setCommissionRate(userRate);
        sc.setCommissionAmount(totalCommission);
        sc.setUserSharePercent(totalCommission > 0 ? (userPayout / totalCommission) * 100.0 : 100.0);
        sc.setUserCommissionAmount(userPayout);
        sc.setAdminCommissionPercent(totalCommission > 0 ? (adminProfit / totalCommission) * 100.0 : 0.0);
        sc.setAdminCommissionAmount(adminProfit);
        sc.setStatus("approved");
        if (sc.getDate() == null) sc.setDate(LocalDate.now());
        sharedCommissionRepository.save(sc);
        log.info("[AFFILIATE] SharedCommission record updated to approved — referrer={}", referrerName);

        // 5. Update SharedLink stats if exists
        if (click.getShareId() != null) {
            sharedLinkRepository.findById(click.getShareId()).ifPresent(link -> {
                if (isNewSc) {
                    link.setConversionsCount((link.getConversionsCount() != null ? link.getConversionsCount() : 0) + 1);
                }
                link.setTotalEarnings((link.getTotalEarnings() != null ? link.getTotalEarnings() : 0.0) + userPayout);
                sharedLinkRepository.save(link);
            });
        }

        log.info("[AFFILIATE] ✅ Commission fully processed — trackingId={}, Payout=₹{}", trackingId, userPayout);
    }

    @Override
    public void rejectCommission(String trackingId) {
        Optional<AffiliateClick> clickOpt = affiliateClickRepository.findByTrackingId(trackingId);
        if (clickOpt.isEmpty()) return;

        AffiliateClick click = clickOpt.get();
        if (!"PURCHASED".equals(click.getStatus())) return;

        click.setStatus("REJECTED");
        affiliateClickRepository.save(click);
        log.info("[AFFILIATE] Click {} status → REJECTED", trackingId);

        String referrerId = click.getReferrerId();
        if (referrerId == null && click.getShareId() != null) {
            referrerId = shareActionRepository.findByShareId(click.getShareId())
                    .map(ShareAction::getReferrerId).orElse(null);
            if (referrerId == null) {
                referrerId = sharedLinkRepository.findById(click.getShareId())
                        .map(SharedLink::getUserId).orElse(null);
            }
        }

        if (referrerId != null) {
            String referrerName = userRepository.findById(referrerId).map(User::getName).orElse("Unknown");

            CommissionHistory history = CommissionHistory.builder()
                    .trackingId(trackingId)
                    .referrerId(referrerId)
                    .amount(0.0)
                    .status("REJECTED")
                    .build();
            commissionHistoryRepository.save(history);

            // Update existing SharedCommission record if exists, or create rejected
            Optional<SharedCommission> existingScOpt = click.getTrackingId() != null
                    ? sharedCommissionRepository.findByClickId(click.getTrackingId())
                    : Optional.empty();
            if (existingScOpt.isEmpty() && click.getOrderId() != null) {
                existingScOpt = sharedCommissionRepository.findByOrderId(click.getOrderId());
            }

            if (existingScOpt.isPresent()) {
                SharedCommission sc = existingScOpt.get();
                sc.setStatus("rejected");
                sharedCommissionRepository.save(sc);
                Double payout = sc.getUserCommissionAmount() != null ? sc.getUserCommissionAmount() : sc.getCommissionAmount();
                if (payout != null && payout > 0) {
                    walletService.processRejectedCommission(referrerId, payout);
                }
            } else {
                SharedCommission sc = SharedCommission.builder()
                        .userId(referrerId)
                        .userName(referrerName)
                        .linkId(click.getShareId())
                        .shareId(click.getShareId())
                        .clickId(click.getTrackingId())
                        .orderId(click.getOrderId())
                        .productName("Product")
                        .store("Merchant")
                        .purchaseAmount(0.0)
                        .commissionAmount(0.0)
                        .userCommissionAmount(0.0)
                        .adminCommissionAmount(0.0)
                        .status("rejected")
                        .date(LocalDate.now())
                        .build();
                sharedCommissionRepository.save(sc);
            }
        }

        log.info("[AFFILIATE] Commission rejected for trackingId: {}", trackingId);
    }
}
