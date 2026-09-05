package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.AffiliateClick;
import com.cyvanta.affiliate_app.model.CommissionHistory;
import com.cyvanta.affiliate_app.model.ShareAction;
import com.cyvanta.affiliate_app.model.SharedLink;
import com.cyvanta.affiliate_app.repository.AffiliateClickRepository;
import com.cyvanta.affiliate_app.repository.CommissionHistoryRepository;
import com.cyvanta.affiliate_app.repository.ShareActionRepository;
import com.cyvanta.affiliate_app.repository.SharedLinkRepository;
import com.cyvanta.affiliate_app.service.AffiliateNetworkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/affiliate")
@RequiredArgsConstructor
public class AffiliateController {

    private final ShareActionRepository shareActionRepository;
    private final SharedLinkRepository sharedLinkRepository;
    private final AffiliateClickRepository affiliateClickRepository;
    private final CommissionHistoryRepository commissionHistoryRepository;
    private final AffiliateNetworkService affiliateNetworkService;

    @PostMapping("/share")
    public ResponseEntity<?> createShareLink(@RequestBody Map<String, String> body) {
        String referrerId = body.get("referrerId");
        String productId = body.get("productId");

        if (referrerId == null || productId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "referrerId and productId are mandatory"));
        }

        String shareId = UUID.randomUUID().toString();
        ShareAction shareAction = ShareAction.builder()
                .shareId(shareId)
                .referrerId(referrerId)
                .productId(productId)
                .build();

        shareActionRepository.save(shareAction);
        log.info("[SHARE] Share created — shareId={}, referrerId={}, productId={}", shareId, referrerId, productId);
        return ResponseEntity.ok(Map.of("shareId", shareId));
    }

    @GetMapping("/shares")
    public ResponseEntity<List<ShareAction>> getAllShares() {
        return ResponseEntity.ok(shareActionRepository.findAll());
    }

    @PostMapping("/clicks")
    public ResponseEntity<?> createClick(@RequestBody Map<String, String> body) {
        String buyerId = body.getOrDefault("buyerId", null);
        String shareId = body.getOrDefault("shareId", null);
        String productId = body.getOrDefault("productId", null);
        String merchant = body.getOrDefault("merchant", null);

        String trackingId = UUID.randomUUID().toString();

        // Resolve referrerId from shareId (supporting both deal ShareAction and product SharedLink)
        String referrerId = null;
        if (shareId != null) {
            referrerId = shareActionRepository.findByShareId(shareId)
                    .map(ShareAction::getReferrerId).orElse(null);
            if (referrerId == null) {
                referrerId = sharedLinkRepository.findById(shareId)
                        .map(SharedLink::getUserId).orElse(null);
            }
        }

        AffiliateClick click = AffiliateClick.builder()
                .trackingId(trackingId)
                .buyerId(buyerId)
                .shareId(shareId)
                .productId(productId)
                .referrerId(referrerId)
                .merchant(merchant)
                .status("PENDING")
                .build();

        affiliateClickRepository.save(click);
        log.info("[CLICK] Affiliate click created — trackingId={}, shareId={}, referrerId={}, buyerId={}, productId={}",
                trackingId, shareId, referrerId, buyerId, productId);

        // Process click (this triggers the async 5sec purchase simulation)
        affiliateNetworkService.processClick(click);

        return ResponseEntity.ok(Map.of("trackingId", trackingId));
    }

    @GetMapping("/clicks")
    public ResponseEntity<List<AffiliateClick>> getAllClicks() {
        return ResponseEntity.ok(affiliateClickRepository.findAll());
    }

    @PostMapping("/clicks/{trackingId}/approve")
    public ResponseEntity<?> approveCommission(@PathVariable String trackingId) {
        log.info("[ADMIN] Approve commission requested for trackingId={}", trackingId);
        affiliateNetworkService.approveCommission(trackingId);
        return ResponseEntity.ok(Map.of("message", "Commission approved"));
    }

    @PostMapping("/clicks/{trackingId}/reject")
    public ResponseEntity<?> rejectCommission(@PathVariable String trackingId) {
        log.info("[ADMIN] Reject commission requested for trackingId={}", trackingId);
        affiliateNetworkService.rejectCommission(trackingId);
        return ResponseEntity.ok(Map.of("message", "Commission rejected"));
    }

    @GetMapping("/commissions")
    public ResponseEntity<List<CommissionHistory>> getCommissionHistory() {
        return ResponseEntity.ok(commissionHistoryRepository.findAll());
    }
}
