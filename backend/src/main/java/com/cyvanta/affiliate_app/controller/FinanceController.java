package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Cashback;
import com.cyvanta.affiliate_app.model.Transaction;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.model.WalletTransaction;
import com.cyvanta.affiliate_app.model.WithdrawalRequest;
import com.cyvanta.affiliate_app.repository.CashbackRepository;
import com.cyvanta.affiliate_app.repository.TransactionRepository;
import com.cyvanta.affiliate_app.repository.WalletRepository;
import com.cyvanta.affiliate_app.repository.WalletTransactionRepository;
import com.cyvanta.affiliate_app.repository.WithdrawalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final CashbackRepository cashbackRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final TransactionRepository transactionRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final WalletRepository walletRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFinanceData() {
        List<Cashback> allCashback = cashbackRepository.findAll();
        List<WithdrawalRequest> allWithdrawals = withdrawalRepository.findAll();
        List<Transaction> allTransactions = transactionRepository.findAll();
        List<WalletTransaction> allWalletTransactions = walletTransactionRepository.findAll();
        List<Wallet> allWallets = walletRepository.findAll();

        double totalRevenue = allTransactions.stream()
                .mapToDouble(t -> t.getTotalCommission() != null ? t.getTotalCommission() : 0.0)
                .sum();

        double totalCashbackPaid = allWalletTransactions.stream()
                .filter(tx -> "CREDIT".equalsIgnoreCase(tx.getType()) && "COMMISSION".equalsIgnoreCase(tx.getCategory()))
                .filter(tx -> tx.getStatus() == null || "APPROVED".equalsIgnoreCase(tx.getStatus()) || "COMPLETED".equalsIgnoreCase(tx.getStatus()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();

        double totalWithdrawPaid = allWalletTransactions.stream()
                .filter(tx -> "DEBIT".equalsIgnoreCase(tx.getType()) && "WITHDRAWAL".equalsIgnoreCase(tx.getCategory()))
                .filter(tx -> tx.getStatus() == null || "APPROVED".equalsIgnoreCase(tx.getStatus()) || "COMPLETED".equalsIgnoreCase(tx.getStatus()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();

        double pendingWithdrawals = allWithdrawals.stream()
                .filter(w -> "pending".equalsIgnoreCase(w.getStatus()))
                .mapToDouble(w -> w.getAmount() != null ? w.getAmount() : 0.0)
                .sum();

        double totalApprovedBalance = allWallets.stream()
                .mapToDouble(w -> w.getApprovedBalance() != null ? w.getApprovedBalance() : 0.0)
                .sum();

        double totalPendingBalance = allWallets.stream()
                .mapToDouble(w -> w.getPendingBalance() != null ? w.getPendingBalance() : 0.0)
                .sum();

        double totalWithdrawnAmount = allWallets.stream()
                .mapToDouble(w -> w.getWithdrawnAmount() != null ? w.getWithdrawnAmount() : 0.0)
                .sum();

        List<Map<String, Object>> transactionsList = allWalletTransactions.stream()
                .sorted(Comparator.comparing(WalletTransaction::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(50)
                .map(tx -> {
                    Map<String, Object> txMap = new HashMap<>();
                    txMap.put("id", tx.getId());
                    txMap.put("desc", tx.getDescription() != null ? tx.getDescription() : "Wallet transaction");
                    txMap.put("type", "CREDIT".equalsIgnoreCase(tx.getType()) ? "credit" : "debit");
                    txMap.put("amount", tx.getAmount() != null ? tx.getAmount() : 0.0);
                    txMap.put("date", tx.getCreatedAt() != null
                            ? tx.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)
                            : null);
                    txMap.put("status", tx.getStatus());
                    txMap.put("category", tx.getCategory());
                    return txMap;
                })
                .collect(Collectors.toList());

        Map<String, Object> financeData = new HashMap<>();
        financeData.put("totalRevenue", totalRevenue);
        financeData.put("totalCashbackPaid", totalCashbackPaid);
        financeData.put("totalWithdrawPaid", totalWithdrawPaid);
        financeData.put("pendingWithdrawals", pendingWithdrawals);
        financeData.put("totalApprovedBalance", totalApprovedBalance);
        financeData.put("totalPendingBalance", totalPendingBalance);
        financeData.put("totalWithdrawnAmount", totalWithdrawnAmount);
        financeData.put("totalWalletBalance", totalApprovedBalance + totalPendingBalance);
        financeData.put("transactions", transactionsList);

        return ResponseEntity.ok(financeData);
    }

    // --- Balance Sheet: Assets = Liabilities + Equity ---
    @GetMapping("/balance-sheet")
    public ResponseEntity<Map<String, Object>> getBalanceSheet() {
        List<Wallet> allWallets = walletRepository.findAll();
        List<WalletTransaction> allWalletTx = walletTransactionRepository.findAll();
        List<WithdrawalRequest> allWithdrawals = withdrawalRepository.findAll();
        List<Transaction> allTransactions = transactionRepository.findAll();

        // ASSETS: Total revenue earned from affiliate networks
        double totalAffiliateRevenue = allTransactions.stream()
                .filter(t -> t.getStatus() == Transaction.TransactionStatus.APPROVED)
                .mapToDouble(t -> t.getTotalCommission() != null ? t.getTotalCommission() : 0.0)
                .sum();

        double totalPendingRevenue = allTransactions.stream()
                .filter(t -> t.getStatus() == Transaction.TransactionStatus.PENDING)
                .mapToDouble(t -> t.getTotalCommission() != null ? t.getTotalCommission() : 0.0)
                .sum();

        // LIABILITIES: What we owe to users
        double userApprovedBalances = allWallets.stream()
                .mapToDouble(w -> w.getApprovedBalance() != null ? w.getApprovedBalance() : 0.0)
                .sum();

        double userPendingBalances = allWallets.stream()
                .mapToDouble(w -> w.getPendingBalance() != null ? w.getPendingBalance() : 0.0)
                .sum();

        double pendingWithdrawals = allWithdrawals.stream()
                .filter(w -> "pending".equalsIgnoreCase(w.getStatus()))
                .mapToDouble(w -> w.getAmount() != null ? w.getAmount() : 0.0)
                .sum();

        // PAID OUT: Already disbursed
        double totalPaidOut = allWallets.stream()
                .mapToDouble(w -> w.getWithdrawnAmount() != null ? w.getWithdrawnAmount() : 0.0)
                .sum();

        // CREDITS & DEBITS from ledger
        double totalCredits = allWalletTx.stream()
                .filter(tx -> "CREDIT".equalsIgnoreCase(tx.getType()) && !"REJECTED".equalsIgnoreCase(tx.getStatus()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();

        double totalDebits = allWalletTx.stream()
                .filter(tx -> "DEBIT".equalsIgnoreCase(tx.getType()) && !"REJECTED".equalsIgnoreCase(tx.getStatus()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();

        // ADMIN SHARE (platform profit)
        double adminShareTotal = allTransactions.stream()
                .filter(t -> t.getStatus() == Transaction.TransactionStatus.APPROVED)
                .mapToDouble(t -> t.getAdminShare() != null ? t.getAdminShare() : 0.0)
                .sum();

        // NET POSITION
        double totalAssets = totalAffiliateRevenue + totalPendingRevenue;
        double totalLiabilities = userApprovedBalances + userPendingBalances + pendingWithdrawals;
        double netPosition = totalAssets - totalLiabilities - totalPaidOut;

        Map<String, Object> balanceSheet = new LinkedHashMap<>();

        // Assets
        Map<String, Object> assets = new LinkedHashMap<>();
        assets.put("confirmedAffiliateRevenue", totalAffiliateRevenue);
        assets.put("pendingAffiliateRevenue", totalPendingRevenue);
        assets.put("totalAssets", totalAssets);
        balanceSheet.put("assets", assets);

        // Liabilities
        Map<String, Object> liabilities = new LinkedHashMap<>();
        liabilities.put("userApprovedBalances", userApprovedBalances);
        liabilities.put("userPendingBalances", userPendingBalances);
        liabilities.put("pendingWithdrawals", pendingWithdrawals);
        liabilities.put("totalLiabilities", totalLiabilities);
        balanceSheet.put("liabilities", liabilities);

        // Equity / Payouts
        Map<String, Object> equity = new LinkedHashMap<>();
        equity.put("totalPaidOut", totalPaidOut);
        equity.put("adminPlatformShare", adminShareTotal);
        equity.put("netPosition", netPosition);
        balanceSheet.put("equity", equity);

        // Ledger summary
        Map<String, Object> ledgerSummary = new LinkedHashMap<>();
        ledgerSummary.put("totalCredits", totalCredits);
        ledgerSummary.put("totalDebits", totalDebits);
        ledgerSummary.put("netLedgerBalance", totalCredits - totalDebits);
        ledgerSummary.put("totalTransactions", allWalletTx.size());
        balanceSheet.put("ledgerSummary", ledgerSummary);

        return ResponseEntity.ok(balanceSheet);
    }

    // --- Full Ledger: All wallet transactions with details ---
    @GetMapping("/ledger")
    public ResponseEntity<List<Map<String, Object>>> getFullLedger() {
        List<WalletTransaction> allTx = walletTransactionRepository.findAll();

        List<Map<String, Object>> ledger = allTx.stream()
                .sorted(Comparator.comparing(WalletTransaction::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(tx -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("id", tx.getId());
                    entry.put("userId", tx.getUserId());
                    entry.put("trackingId", tx.getTrackingId());
                    entry.put("amount", tx.getAmount());
                    entry.put("type", tx.getType());
                    entry.put("category", tx.getCategory());
                    entry.put("status", tx.getStatus());
                    entry.put("description", tx.getDescription());
                    entry.put("date", tx.getCreatedAt() != null
                            ? tx.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                            : null);
                    return entry;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ledger);
    }

    // --- Per-user wallet summary for admin ---
    @GetMapping("/wallets")
    public ResponseEntity<List<Map<String, Object>>> getAllWallets() {
        List<Wallet> allWallets = walletRepository.findAll();

        List<Map<String, Object>> walletList = allWallets.stream()
                .map(w -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("userId", w.getUserId());
                    entry.put("pendingBalance", w.getPendingBalance());
                    entry.put("approvedBalance", w.getApprovedBalance());
                    entry.put("withdrawnAmount", w.getWithdrawnAmount());
                    entry.put("totalBalance", (w.getApprovedBalance() != null ? w.getApprovedBalance() : 0.0)
                            + (w.getPendingBalance() != null ? w.getPendingBalance() : 0.0));
                    entry.put("updatedAt", w.getUpdatedAt() != null
                            ? w.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                            : null);
                    return entry;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(walletList);
    }
}
