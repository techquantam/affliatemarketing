package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.Wallet;
import com.cyvanta.affiliate_app.model.WithdrawalRequest;
import com.cyvanta.affiliate_app.model.Notification;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.repository.WithdrawalRequestRepository;
import com.cyvanta.affiliate_app.repository.NotificationRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/api/withdrawals", "/api/withdraw", "/withdrawals", "/withdraw"})
@RequiredArgsConstructor
public class WithdrawalsController {

    private final WithdrawalRequestRepository withdrawalRepository;
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final com.cyvanta.affiliate_app.service.WithdrawalService withdrawalService;

    @GetMapping
    public ResponseEntity<List<WithdrawalRequest>> getAll() {
        return ResponseEntity.ok(withdrawalRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody WithdrawalRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String headerUserId) {

        if ((request.getUserId() == null || request.getUserId().isBlank()) && headerUserId != null && !headerUserId.isBlank()) {
            request.setUserId(headerUserId.trim());
        }

        if (request.getUserId() == null || request.getUserId().isBlank() || request.getAmount() == null || request.getAmount() <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid user ID or amount",
                    "message", "Invalid user ID or amount"
            ));
        }

        // 1. Mandatory E-KYC check
        Optional<User> userOpt = userRepository.findById(request.getUserId().trim());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(request.getUserId().trim().toLowerCase());
        }
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "User not found",
                    "message", "User not found"
            ));
        }
        User user = userOpt.get();
        request.setUserId(user.getId());
        if (request.getUserName() == null || request.getUserName().isBlank()) {
            request.setUserName(user.getName());
        }
        if (request.getUpiId() == null || request.getUpiId().isBlank()) {
            if (user.getUpiId() != null && !user.getUpiId().isBlank()) {
                request.setUpiId(user.getUpiId());
            } else if (user.getBankAccountNumber() != null && !user.getBankAccountNumber().isBlank()) {
                request.setUpiId("A/C: " + user.getBankAccountNumber() + " (" + (user.getBankName() != null ? user.getBankName() : "Bank") + ")");
            }
        }

        boolean isKycApproved = "approved".equalsIgnoreCase(user.getKycStatus())
                || "approve".equalsIgnoreCase(user.getKycStatus())
                || (user.getIs_kyc_verified() != null && user.getIs_kyc_verified() == 1)
                || Boolean.TRUE.equals(user.getIsKycVerified());
        if (!isKycApproved) {
            String errMsg = "E-KYC is mandatory before withdrawal. Please complete your profile and upload Aadhaar, PAN & Selfie, and wait for admin approval.";
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", errMsg,
                    "message", errMsg
            ));
        }

        // 2. Minimum withdrawal threshold check from settings
        int minLimit = withdrawalService.getMinimumWithdrawalLimit();
        if (request.getAmount() < minLimit) {
            String errMsg = "Minimum withdrawal is Rs. " + minLimit;
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", errMsg,
                    "message", errMsg
            ));
        }

        // 3. Wallet Balance check
        Wallet wallet = walletService.getOrCreateWallet(request.getUserId());
        if (wallet.getApprovedBalance() < request.getAmount()) {
            String errMsg = "Insufficient confirmed cashback balance for withdrawal.";
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", errMsg,
                    "message", errMsg
            ));
        }

        // 3. Deduct from confirmed balance immediately (do not add to pending balance)
        walletService.deductApprovedBalance(request.getUserId(), request.getAmount());

        request.setStatus("pending");
        request.setRequestedAt(LocalDateTime.now());
        WithdrawalRequest saved = withdrawalRepository.save(request);

        // Generate user notification
        try {
            Notification notif = Notification.builder()
                    .userId(request.getUserId())
                    .title("Withdrawal Request Pending")
                    .message("Your withdrawal request of ₹" + String.format("%.2f", request.getAmount()) + " has been submitted and is currently pending review.")
                    .type("WITHDRAWAL")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            // log error but don't fail the transaction
        }

        return ResponseEntity.ok(saved);
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
                Wallet userWallet = walletService.getOrCreateWallet(request.getUserId());
                Double prevApproved = userWallet.getApprovedBalance() != null ? userWallet.getApprovedBalance() : 0.0;

                // Add to withdrawn amount (do not deduct from pending, as it wasn't added there)
                walletService.addWithdrawnAmount(request.getUserId(), request.getAmount());

                walletService.recordTransaction(
                        request.getUserId(),
                        request.getAmount(),
                        "DEBIT",
                        "WITHDRAWAL",
                        "Withdrawal payout approved for user " + request.getUserName(),
                        request.getId(),
                        "APPROVED",
                        "APPROVED",
                        prevApproved,
                        prevApproved,
                        null,
                        "Admin"
                );

                // Generate user notification
                try {
                    Notification notif = Notification.builder()
                            .userId(request.getUserId())
                            .title("Withdrawal Request Approved")
                            .message("Success! Your withdrawal request of ₹" + String.format("%.2f", request.getAmount()) + " has been approved and processed.")
                            .type("WITHDRAWAL")
                            .read(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);
                } catch (Exception e) {
                    // log
                }
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
                Wallet userWallet = walletService.getOrCreateWallet(request.getUserId());
                Double prevApproved = userWallet.getApprovedBalance() != null ? userWallet.getApprovedBalance() : 0.0;

                // Refund back to approvedBalance (do not subtract from pending, as it wasn't added there)
                walletService.refundApprovedBalance(request.getUserId(), request.getAmount()); // Adds to approvedBalance

                walletService.recordTransaction(
                        request.getUserId(),
                        request.getAmount(),
                        "CREDIT",
                        "REFUND",
                        "Withdrawal request rejected and refunded for user " + request.getUserName(),
                        request.getId(),
                        "REJECTED",
                        "APPROVED",
                        prevApproved,
                        prevApproved + request.getAmount(),
                        null,
                        "Admin"
                );

                // Generate user notification
                try {
                    Notification notif = Notification.builder()
                            .userId(request.getUserId())
                            .title("Withdrawal Request Rejected")
                            .message("Your withdrawal request of ₹" + String.format("%.2f", request.getAmount()) + " has been rejected. The amount has been refunded back to your confirmed cashback balance.")
                            .type("WITHDRAWAL")
                            .read(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);
                } catch (Exception e) {
                    // log
                }
            }

            return ResponseEntity.ok(request);
        }).orElse(ResponseEntity.notFound().build());
    }
}
