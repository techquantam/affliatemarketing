package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.model.WithdrawalRequest;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.repository.WithdrawalRequestRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/withdrawals")
@RequiredArgsConstructor
public class WithdrawalsController {

    private final WithdrawalRequestRepository withdrawalRepository;
    private final WalletService walletService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<WithdrawalRequest>> getAll() {
        return ResponseEntity.ok(withdrawalRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody WithdrawalRequest request) {
        if (request.getUserId() == null || request.getAmount() == null || request.getAmount() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid user ID or amount"));
        }

        // 1. Mandatory E-KYC check
        Optional<User> userOpt = userRepository.findById(request.getUserId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        if (user.getKycStatus() == null || !"approved".equalsIgnoreCase(user.getKycStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "E-KYC is mandatory before withdrawal. Please complete your profile and upload Aadhaar, PAN & Selfie, and wait for admin approval."));
        }

        // 2. Wallet Balance check
        Wallet wallet = walletService.getOrCreateWallet(request.getUserId());
        if (wallet.getApprovedBalance() < request.getAmount()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Insufficient confirmed cashback balance for withdrawal."));
        }

        // 3. Deduct from confirmed balance and shift to pending balance immediately
        walletService.deductApprovedBalance(request.getUserId(), request.getAmount());
        walletService.processPendingCommission(request.getUserId(), request.getAmount()); // Adds to pendingBalance

        request.setStatus("pending");
        request.setRequestedAt(LocalDateTime.now());
        return ResponseEntity.ok(withdrawalRepository.save(request));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<WithdrawalRequest> approve(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return withdrawalRepository.findById(id).map(request -> {
            if ("approved".equals(request.getStatus())) {
                return ResponseEntity.ok(request); // already approved
            }

            request.setStatus("approved");
            request.setProcessedAt(LocalDateTime.now());
            withdrawalRepository.save(request);

            if (request.getUserId() != null && request.getAmount() != null) {
                // Deduct from pending (since it's no longer pending) and add to withdrawn
                walletService.processRejectedCommission(request.getUserId(), request.getAmount()); // Subtracts from pendingBalance
                walletService.addWithdrawnAmount(request.getUserId(), request.getAmount());

                walletService.recordTransaction(
                        request.getUserId(),
                        request.getAmount(),
                        "DEBIT",
                        "WITHDRAWAL",
                        "Withdrawal payout approved for user " + request.getUserName(),
                        request.getId(),
                        "APPROVED"
                );
            }

            return ResponseEntity.ok(request);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<WithdrawalRequest> reject(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return withdrawalRepository.findById(id).map(request -> {
            if ("rejected".equals(request.getStatus())) {
                return ResponseEntity.ok(request); // already rejected
            }

            request.setStatus("rejected");
            request.setProcessedAt(LocalDateTime.now());
            withdrawalRepository.save(request);

            if (request.getUserId() != null && request.getAmount() != null) {
                // Subtract from pending balance and refund/add back to approvedBalance
                walletService.processRejectedCommission(request.getUserId(), request.getAmount()); // Subtracts from pendingBalance
                walletService.refundApprovedBalance(request.getUserId(), request.getAmount()); // Adds to approvedBalance
            }

            return ResponseEntity.ok(request);
        }).orElse(ResponseEntity.notFound().build());
    }
}
