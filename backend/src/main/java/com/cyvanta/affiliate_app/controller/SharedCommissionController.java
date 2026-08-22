package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.SharedCommission;
import com.cyvanta.affiliate_app.model.WalletTransaction;
import com.cyvanta.affiliate_app.model.CommissionHistory;
import com.cyvanta.affiliate_app.repository.SharedCommissionRepository;
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
        commission.setDate(LocalDate.now());
        if (commission.getStatus() == null) commission.setStatus("pending");
        
        Double userPct = commission.getUserSharePercent() != null ? commission.getUserSharePercent() : 100.0;
        
        if (commission.getCommissionAmount() != null) {
            commission.setUserCommissionAmount((commission.getCommissionAmount() * userPct) / 100.0);
            commission.setAdminCommissionAmount(commission.getCommissionAmount() - commission.getUserCommissionAmount());
        }

        SharedCommission saved = sharedCommissionRepository.save(commission);

        // If the commission has a userId and it's pending, add to pending wallet and ledger
        if (saved.getUserId() != null && "pending".equals(saved.getStatus()) && saved.getUserCommissionAmount() != null) {
            walletService.processPendingCommission(saved.getUserId(), saved.getUserCommissionAmount());
            walletService.recordTransaction(
                    saved.getUserId(),
                    saved.getUserCommissionAmount(),
                    "CREDIT",
                    "COMMISSION",
                    "Pending commission for " + saved.getProductName(),
                    saved.getClickId() != null ? saved.getClickId() : saved.getId(),
                    "PENDING"
            );
            log.info("[COMMISSION] Pending commission ₹{} added to wallet for user {}", saved.getUserCommissionAmount(), saved.getUserId());
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SharedCommission> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return sharedCommissionRepository.findById(id).map(commission -> {
            String oldStatus = commission.getStatus();
            String newStatus = body.containsKey("status") ? (String) body.get("status") : oldStatus;

            // Update commission amounts if provided
            if (body.containsKey("amount")) {
                Object amt = body.get("amount");
                Double amount = null;
                if (amt instanceof Number) amount = ((Number) amt).doubleValue();
                else if (amt instanceof String) amount = Double.parseDouble((String) amt);
                
                if (amount != null) {
                    commission.setCommissionAmount(amount);
                }
            }
            if (body.containsKey("userAmount")) {
                Object uAmt = body.get("userAmount");
                Double userAmount = null;
                if (uAmt instanceof Number) userAmount = ((Number) uAmt).doubleValue();
                else if (uAmt instanceof String) userAmount = Double.parseDouble((String) uAmt);
                
                if (userAmount != null) {
                    commission.setUserCommissionAmount(userAmount);
                }
            }
            
            // Calculate admin profit
            if (commission.getCommissionAmount() != null && commission.getUserCommissionAmount() != null) {
                commission.setAdminCommissionAmount(
                    commission.getCommissionAmount() - commission.getUserCommissionAmount()
                );
            }

            commission.setStatus(newStatus);
            SharedCommission saved = sharedCommissionRepository.save(commission);

            // === WALLET CREDIT/DEBIT LOGIC ON STATUS CHANGE ===
            if (commission.getUserId() != null && !newStatus.equals(oldStatus)) {
                Double userPayout = commission.getUserCommissionAmount() != null ? commission.getUserCommissionAmount() : 0.0;

                if ("approved".equals(newStatus) && "pending".equals(oldStatus)) {
                    // Move from pending → approved in wallet
                    walletService.processApprovedCommission(commission.getUserId(), userPayout);
                    
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

                } else if ("rejected".equals(newStatus) && "pending".equals(oldStatus)) {
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
