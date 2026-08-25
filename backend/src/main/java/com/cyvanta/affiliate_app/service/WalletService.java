package com.cyvanta.affiliate_app.service;

import com.cyvanta.affiliate_app.model.Transaction;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.model.WalletTransaction;
import com.cyvanta.affiliate_app.repository.WalletRepository;
import com.cyvanta.affiliate_app.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    public Wallet getOrCreateWallet(String userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .userId(userId)
                            .build();
                    return walletRepository.save(newWallet);
                });
    }

    public void processPendingCommission(String userId, Double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setPendingBalance(wallet.getPendingBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    public void processApprovedCommission(String userId, Double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getPendingBalance() >= amount) {
            wallet.setPendingBalance(wallet.getPendingBalance() - amount);
        } else {
            // Fallback if pending wasn't recorded correctly, still adjust pending if > 0
            wallet.setPendingBalance(Math.max(0, wallet.getPendingBalance() - amount));
        }
        wallet.setApprovedBalance(wallet.getApprovedBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    public void processRejectedCommission(String userId, Double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getPendingBalance() >= amount) {
            wallet.setPendingBalance(wallet.getPendingBalance() - amount);
        } else {
            wallet.setPendingBalance(Math.max(0, wallet.getPendingBalance() - amount));
        }
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    public void deductApprovedBalance(String userId, Double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setApprovedBalance(Math.max(0, wallet.getApprovedBalance() - amount));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    public void refundApprovedBalance(String userId, Double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setApprovedBalance(wallet.getApprovedBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    public void addWithdrawnAmount(String userId, Double amount) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setWithdrawnAmount(wallet.getWithdrawnAmount() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    public WalletTransaction recordTransaction(String userId, Double amount, String type, String category, String description, String trackingId, String status) {
        if (trackingId != null && !trackingId.trim().isEmpty()) {
            java.util.Optional<WalletTransaction> existing = walletTransactionRepository.findByTrackingId(trackingId);
            if (existing.isPresent()) {
                WalletTransaction txn = existing.get();
                txn.setAmount(amount);
                txn.setType(type);
                txn.setCategory(category);
                txn.setStatus(status);
                txn.setDescription(description);
                return walletTransactionRepository.save(txn);
            }
        }
        WalletTransaction transaction = WalletTransaction.builder()
                .userId(userId)
                .trackingId(trackingId)
                .amount(amount)
                .type(type)
                .category(category)
                .status(status)
                .description(description)
                .build();
        return walletTransactionRepository.save(transaction);
    }

    public List<WalletTransaction> getLedgerForUser(String userId) {
        return walletTransactionRepository.findByUserId(userId);
    }

    public WalletTransaction adminAdjustWallet(String userId, String actionType, Double amount, String reason, String adminId, String adminName) {
        return adminAdjustWallet(userId, actionType, amount, reason, adminId, adminName, "APPROVED");
    }

    public WalletTransaction adminAdjustWallet(String userId, String actionType, Double amount, String reason, String adminId, String adminName, String targetWallet) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Reason is mandatory for every wallet adjustment");
        }

        Wallet wallet = getOrCreateWallet(userId);
        String normalizedTarget = (targetWallet != null) ? targetWallet.toUpperCase() : "APPROVED";
        if (!"APPROVED".equals(normalizedTarget) && !"PENDING".equals(normalizedTarget)) {
            throw new IllegalArgumentException("Invalid target wallet: " + targetWallet);
        }

        Double previousBalance = "PENDING".equals(normalizedTarget)
                ? (wallet.getPendingBalance() != null ? wallet.getPendingBalance() : 0.0)
                : (wallet.getApprovedBalance() != null ? wallet.getApprovedBalance() : 0.0);
        Double newBalance;

        String normalizedAction = actionType != null ? actionType.toUpperCase() : "CREDIT";
        String type;
        String category;

        if ("CREDIT".equals(normalizedAction)) {
            newBalance = previousBalance + amount;
            type = "CREDIT";
            category = "PENDING".equals(normalizedTarget) ? "ADMIN_PENDING_CREDIT" : "ADMIN_CREDIT";
        } else if ("DEBIT".equals(normalizedAction)) {
            if (previousBalance < amount) {
                throw new IllegalArgumentException("Insufficient balance for debit. Current " + normalizedTarget.toLowerCase() + " balance: ₹" + String.format("%.2f", previousBalance));
            }
            newBalance = previousBalance - amount;
            type = "DEBIT";
            category = "PENDING".equals(normalizedTarget) ? "ADMIN_PENDING_DEBIT" : "ADMIN_DEBIT";
        } else if ("ADJUSTMENT".equals(normalizedAction)) {
            newBalance = previousBalance + amount;
            type = "CREDIT";
            category = "PENDING".equals(normalizedTarget) ? "ADMIN_PENDING_ADJUSTMENT" : "ADMIN_ADJUSTMENT";
        } else {
            throw new IllegalArgumentException("Invalid action type: " + actionType);
        }

        if ("PENDING".equals(normalizedTarget)) {
            wallet.setPendingBalance(newBalance);
        } else {
            wallet.setApprovedBalance(newBalance);
        }
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        String adminStr = (adminName != null && !adminName.trim().isEmpty()) ? adminName : (adminId != null ? adminId : "Admin");

        WalletTransaction transaction = WalletTransaction.builder()
                .userId(userId)
                .trackingId("TXN-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000))
                .amount(amount)
                .type(type)
                .category(category)
                .status("COMPLETED")
                .description(reason.trim() + " (" + normalizedTarget + " Wallet)")
                .reason(reason.trim())
                .previousBalance(previousBalance)
                .newBalance(newBalance)
                .adminId(adminId)
                .adminName(adminStr)
                .updatedBy(adminStr)
                .targetWallet(normalizedTarget)
                .createdAt(LocalDateTime.now())
                .build();

        return walletTransactionRepository.save(transaction);
    }
}
