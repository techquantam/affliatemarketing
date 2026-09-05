package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Transaction;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.model.WalletTransaction;
import com.cyvanta.affiliate_app.model.SharedCommission;
import com.cyvanta.affiliate_app.model.WithdrawalRequest;
import com.cyvanta.affiliate_app.repository.TransactionRepository;
import com.cyvanta.affiliate_app.repository.SharedCommissionRepository;
import com.cyvanta.affiliate_app.repository.WithdrawalRequestRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final TransactionRepository transactionRepository;
    private final SharedCommissionRepository sharedCommissionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<Wallet> getWalletBalance(@PathVariable String userId) {
        return ResponseEntity.ok(walletService.getOrCreateWallet(userId));
    }

    @GetMapping("/{userId}/transactions")
    public ResponseEntity<List<Transaction>> getUserTransactions(@PathVariable String userId) {
        return ResponseEntity.ok(transactionRepository.findByReferrerId(userId));
    }

    @GetMapping("/{userId}/ledger")
    public ResponseEntity<List<WalletTransaction>> getUserLedger(@PathVariable String userId) {
        return ResponseEntity.ok(walletService.getLedgerForUser(userId));
    }

    /**
     * Returns a comprehensive, unified ledger combining:
     * - WalletTransactions (commissions, adjustments, refunds)
     * - SharedCommissions (share & earn earnings)
     * - WithdrawalRequests (money going out)
     * All sorted by date descending.
     */
    @GetMapping("/{userId}/full-ledger")
    public ResponseEntity<List<Map<String, Object>>> getFullLedger(@PathVariable String userId) {
        List<Map<String, Object>> entries = new ArrayList<>();

        // 1. WalletTransactions
        List<WalletTransaction> walletTxns = walletService.getLedgerForUser(userId);
        for (WalletTransaction wt : walletTxns) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", wt.getId());
            entry.put("date", wt.getCreatedAt() != null ? wt.getCreatedAt().toString() : null);
            entry.put("sortDate", wt.getCreatedAt());
            entry.put("transactionId", wt.getTrackingId() != null ? wt.getTrackingId() : wt.getId());
            entry.put("description", wt.getDescription());
            entry.put("type", wt.getType()); // CREDIT or DEBIT
            entry.put("category", wt.getCategory()); // COMMISSION, WITHDRAWAL, ADJUSTMENT, etc.
            entry.put("amount", wt.getAmount());
            entry.put("previousBalance", wt.getPreviousBalance());
            entry.put("newBalance", wt.getNewBalance());
            entry.put("reason", wt.getReason() != null ? wt.getReason() : wt.getDescription());
            String targetWallet = wt.getTargetWallet();
            if (targetWallet == null || targetWallet.trim().isEmpty()) {
                if (wt.getCategory() != null && wt.getCategory().toUpperCase().contains("PENDING")) {
                    targetWallet = "PENDING";
                } else if ("PENDING".equalsIgnoreCase(wt.getStatus())) {
                    targetWallet = "PENDING";
                } else {
                    targetWallet = "APPROVED";
                }
            }
            entry.put("targetWallet", targetWallet);
            entry.put("updatedBy", wt.getUpdatedBy() != null ? wt.getUpdatedBy() : (wt.getAdminName() != null ? wt.getAdminName() : "System"));
            entry.put("adminName", wt.getAdminName());
            entry.put("status", wt.getStatus());
            entry.put("source", "wallet");
            entries.add(entry);
        }

        // 2. SharedCommissions (earnings from share & earn)
        List<SharedCommission> commissions = sharedCommissionRepository.findByUserId(userId);
        for (SharedCommission sc : commissions) {
            // Skip if already tracked as a wallet transaction (match by sc.id or sc.clickId)
            boolean alreadyTracked = walletTxns.stream()
                .anyMatch(wt -> wt.getTrackingId() != null && 
                    (wt.getTrackingId().equals(sc.getId()) || (sc.getClickId() != null && wt.getTrackingId().equals(sc.getClickId()))));
            if (alreadyTracked) continue;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", sc.getId());
            LocalDateTime scDateTime = sc.getDate() != null ? sc.getDate().atStartOfDay() : LocalDateTime.now();
            entry.put("date", scDateTime.toString());
            entry.put("sortDate", scDateTime);
            entry.put("transactionId", sc.getId());
            String desc = "Commission: " + (sc.getProductName() != null ? sc.getProductName() : "Shared Link")
                    + (sc.getStore() != null ? " via " + sc.getStore() : "");
            entry.put("description", desc);
            entry.put("type", "CREDIT");
            entry.put("category", "SHARED_COMMISSION");
            Double amount = sc.getUserCommissionAmount() != null ? sc.getUserCommissionAmount() : (sc.getCommissionAmount() != null ? sc.getCommissionAmount() : 0.0);
            entry.put("amount", amount);
            String scStatus = sc.getStatus() != null ? sc.getStatus().toUpperCase() : "PENDING";
            entry.put("status", scStatus);
            entry.put("targetWallet", "PENDING".equalsIgnoreCase(scStatus) ? "PENDING" : "APPROVED");
            entry.put("source", "shared_commission");
            entries.add(entry);
        }

        // 3. WithdrawalRequests (money going out)
        List<WithdrawalRequest> withdrawals = withdrawalRequestRepository.findByUserId(userId);
        for (WithdrawalRequest wr : withdrawals) {
            // Skip if already tracked as a wallet transaction
            boolean alreadyTracked = walletTxns.stream()
                .anyMatch(wt -> wt.getTrackingId() != null && wt.getTrackingId().equals(wr.getId()));
            if (alreadyTracked) continue;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", wr.getId());
            LocalDateTime wrDateTime = wr.getRequestedAt() != null ? wr.getRequestedAt() : LocalDateTime.now();
            entry.put("date", wrDateTime.toString());
            entry.put("sortDate", wrDateTime);
            entry.put("transactionId", wr.getId());
            entry.put("description", "Withdrawal Request" + (wr.getUpiId() != null ? " to " + wr.getUpiId() : ""));
            entry.put("type", "DEBIT");
            entry.put("category", "WITHDRAWAL");
            entry.put("amount", wr.getAmount());
            String status = wr.getStatus() != null ? wr.getStatus().toUpperCase() : "PENDING";
            entry.put("status", status);
            entry.put("targetWallet", "PENDING".equalsIgnoreCase(status) ? "PENDING" : "APPROVED");
            entry.put("source", "withdrawal");
            entries.add(entry);
        }

        // Sort by date descending (newest first)
        entries.sort((a, b) -> {
            LocalDateTime dateA = (LocalDateTime) a.get("sortDate");
            LocalDateTime dateB = (LocalDateTime) b.get("sortDate");
            if (dateA == null && dateB == null) return 0;
            if (dateA == null) return 1;
            if (dateB == null) return -1;
            return dateB.compareTo(dateA);
        });

        // Remove sortDate from response (internal sorting field)
        entries.forEach(e -> e.remove("sortDate"));

        return ResponseEntity.ok(entries);
    }

    @PostMapping("/admin/adjust")
    public ResponseEntity<?> adminAdjustWallet(@RequestBody AdminWalletAdjustmentRequest request) {
        try {
            WalletTransaction txn = walletService.adminAdjustWallet(
                    request.getUserId(),
                    request.getActionType(),
                    request.getAmount(),
                    request.getReason(),
                    request.getAdminId(),
                    request.getAdminName(),
                    request.getTargetWallet()
            );
            return ResponseEntity.ok(txn);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process wallet adjustment: " + e.getMessage()));
        }
    }

    @lombok.Data
    public static class AdminWalletAdjustmentRequest {
        private String userId;
        private String actionType; // CREDIT, DEBIT, ADJUSTMENT
        private Double amount;
        private String reason;
        private String adminId;
        private String adminName;
        private String targetWallet; // APPROVED, PENDING
    }
}
