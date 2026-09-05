package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.SharedCommission;
import com.cyvanta.affiliate_app.model.SharedLink;
import com.cyvanta.affiliate_app.model.WalletTransaction;
import com.cyvanta.affiliate_app.model.CommissionHistory;
import com.cyvanta.affiliate_app.repository.SharedCommissionRepository;
import com.cyvanta.affiliate_app.repository.SharedLinkRepository;
import com.cyvanta.affiliate_app.repository.WalletTransactionRepository;
import com.cyvanta.affiliate_app.repository.CommissionHistoryRepository;
import com.cyvanta.affiliate_app.service.AdmitadSyncService;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/shared-commissions")
@RequiredArgsConstructor
public class SharedCommissionController {

    private final SharedCommissionRepository sharedCommissionRepository;
    private final SharedLinkRepository sharedLinkRepository;
    private final AdmitadSyncService admitadSyncService;
    private final WalletService walletService;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CommissionHistoryRepository commissionHistoryRepository;

    @PostMapping("/sync")
    public ResponseEntity<String> triggerManualSync() {
        admitadSyncService.syncConversions();
        return ResponseEntity.ok("Admitad synchronization triggered successfully.");
    }

    @GetMapping
    public ResponseEntity<List<SharedCommission>> getAll() {
        return ResponseEntity.ok(sharedCommissionRepository.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SharedCommission>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(sharedCommissionRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<SharedCommission> create(@RequestBody SharedCommission commission) {
        commission.setDate(commission.getDate() != null ? commission.getDate() : LocalDate.now());
        if (commission.getStatus() == null || commission.getStatus().trim().isEmpty()) {
            commission.setStatus("pending");
        } else {
            commission.setStatus(commission.getStatus().toLowerCase());
        }
        
        Double userPct = commission.getUserSharePercent() != null ? commission.getUserSharePercent() : 100.0;
        
        if (commission.getCommissionAmount() != null && commission.getUserCommissionAmount() == null) {
            commission.setUserCommissionAmount((commission.getCommissionAmount() * userPct) / 100.0);
            commission.setAdminCommissionAmount(Math.max(0.0, commission.getCommissionAmount() - commission.getUserCommissionAmount()));
        } else if (commission.getUserCommissionAmount() != null && commission.getCommissionAmount() == null) {
            commission.setCommissionAmount(commission.getUserCommissionAmount());
            commission.setAdminCommissionAmount(0.0);
        } else if (commission.getCommissionAmount() != null && commission.getUserCommissionAmount() != null) {
            commission.setAdminCommissionAmount(Math.max(0.0, commission.getCommissionAmount() - commission.getUserCommissionAmount()));
        }

        SharedCommission saved = sharedCommissionRepository.save(commission);

        Double payout = saved.getUserCommissionAmount() != null ? saved.getUserCommissionAmount() : (saved.getCommissionAmount() != null ? saved.getCommissionAmount() : 0.0);

        // If the commission has a userId and payout > 0, update wallet & ledger
        if (saved.getUserId() != null && payout > 0) {
            if ("pending".equalsIgnoreCase(saved.getStatus())) {
                walletService.processPendingCommission(saved.getUserId(), payout);
                walletService.recordTransaction(
                        saved.getUserId(),
                        payout,
                        "CREDIT",
                        "COMMISSION",
                        "Pending commission for " + (saved.getProductName() != null ? saved.getProductName() : "Shared Link"),
                        saved.getClickId() != null ? saved.getClickId() : saved.getId(),
                        "PENDING"
                );
                log.info("[COMMISSION] Pending commission ₹{} added to wallet for user {}", payout, saved.getUserId());
            } else if ("approved".equalsIgnoreCase(saved.getStatus())) {
                walletService.processApprovedCommission(saved.getUserId(), payout);
                walletService.recordTransaction(
                        saved.getUserId(),
                        payout,
                        "CREDIT",
                        "COMMISSION",
                        "Approved commission for " + (saved.getProductName() != null ? saved.getProductName() : "Shared Link"),
                        saved.getClickId() != null ? saved.getClickId() : saved.getId(),
                        "APPROVED"
                );
                String linkId = saved.getLinkId() != null ? saved.getLinkId() : saved.getShareId();
                if (linkId != null) {
                    sharedLinkRepository.findById(linkId).ifPresent(link -> {
                        link.setConversionsCount((link.getConversionsCount() != null ? link.getConversionsCount() : 0) + 1);
                        link.setTotalEarnings((link.getTotalEarnings() != null ? link.getTotalEarnings() : 0.0) + payout);
                        sharedLinkRepository.save(link);
                    });
                }
            }
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SharedCommission> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return sharedCommissionRepository.findById(id).map(commission -> {
            String oldStatus = commission.getStatus() != null ? commission.getStatus().toLowerCase() : "pending";
            String newStatus = oldStatus;

            // Safely extract status whether string or nested map
            if (body.containsKey("status")) {
                Object statusObj = body.get("status");
                if (statusObj instanceof String) {
                    newStatus = ((String) statusObj).toLowerCase();
                } else if (statusObj instanceof Map) {
                    Object nested = ((Map<?, ?>) statusObj).get("status");
                    if (nested != null) newStatus = nested.toString().toLowerCase();
                }
            }

            // Update commission amounts if provided
            if (body.containsKey("amount")) {
                Object amt = body.get("amount");
                if (amt instanceof Number) commission.setCommissionAmount(((Number) amt).doubleValue());
                else if (amt instanceof String) {
                    try { commission.setCommissionAmount(Double.parseDouble((String) amt)); } catch (Exception ignored) {}
                }
            }
            if (body.containsKey("userAmount")) {
                Object uAmt = body.get("userAmount");
                if (uAmt instanceof Number) commission.setUserCommissionAmount(((Number) uAmt).doubleValue());
                else if (uAmt instanceof String) {
                    try { commission.setUserCommissionAmount(Double.parseDouble((String) uAmt)); } catch (Exception ignored) {}
                }
            }
            
            // Calculate admin profit
            if (commission.getCommissionAmount() != null && commission.getUserCommissionAmount() != null) {
                commission.setAdminCommissionAmount(
                    Math.max(0.0, commission.getCommissionAmount() - commission.getUserCommissionAmount())
                );
            }

            commission.setStatus(newStatus);
            SharedCommission saved = sharedCommissionRepository.save(commission);

            // === WALLET CREDIT/DEBIT LOGIC ON STATUS CHANGE ===
            if (commission.getUserId() != null && !newStatus.equalsIgnoreCase(oldStatus)) {
                Double userPayout = commission.getUserCommissionAmount() != null 
                        ? commission.getUserCommissionAmount() 
                        : (commission.getCommissionAmount() != null ? commission.getCommissionAmount() : 0.0);

                if ("approved".equalsIgnoreCase(newStatus) && "pending".equalsIgnoreCase(oldStatus)) {
                    // Move from pending → approved in wallet
                    walletService.processApprovedCommission(commission.getUserId(), userPayout);
                    
                    // Update SharedLink totalEarnings
                    String linkId = commission.getLinkId() != null ? commission.getLinkId() : commission.getShareId();
                    if (linkId != null) {
                        sharedLinkRepository.findById(linkId).ifPresent(link -> {
                            link.setTotalEarnings((link.getTotalEarnings() != null ? link.getTotalEarnings() : 0.0) + userPayout);
                            sharedLinkRepository.save(link);
                        });
                    }

                    // Create CommissionHistory record
                    CommissionHistory ch = CommissionHistory.builder()
                            .trackingId(commission.getClickId() != null ? commission.getClickId() : commission.getId())
                            .referrerId(commission.getUserId())
                            .amount(userPayout)
                            .status("APPROVED")
                            .build();
                    commissionHistoryRepository.save(ch);

                    walletService.recordTransaction(
                            commission.getUserId(),
                            userPayout,
                            "CREDIT",
                            "COMMISSION",
                            "Commission Approved: " + commission.getProductName() + " via " + commission.getStore(),
                            commission.getClickId() != null ? commission.getClickId() : commission.getId(),
                            "APPROVED"
                    );

                    log.info("[COMMISSION] ✅ APPROVED — User {} credited ₹{} for product '{}'",
                            commission.getUserName(), userPayout, commission.getProductName());

                } else if ("rejected".equalsIgnoreCase(newStatus) && "pending".equalsIgnoreCase(oldStatus)) {
                    // Remove from pending wallet
                    walletService.processRejectedCommission(commission.getUserId(), userPayout);
                    
                    // Create CommissionHistory record
                    CommissionHistory ch = CommissionHistory.builder()
                            .trackingId(commission.getClickId() != null ? commission.getClickId() : commission.getId())
                            .referrerId(commission.getUserId())
                            .amount(0.0)
                            .status("REJECTED")
                            .build();
                    commissionHistoryRepository.save(ch);

                    walletService.recordTransaction(
                            commission.getUserId(),
                            userPayout,
                            "CREDIT",
                            "COMMISSION",
                            "Commission Rejected: " + commission.getProductName() + " via " + commission.getStore(),
                            commission.getClickId() != null ? commission.getClickId() : commission.getId(),
                            "REJECTED"
                    );

                    log.info("[COMMISSION] ❌ REJECTED — User {} pending ₹{} removed for product '{}'",
                            commission.getUserName(), userPayout, commission.getProductName());
                }
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
