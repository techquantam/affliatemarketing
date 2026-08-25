package com.cyvanta.affiliate_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "wallet_transactions")
public class WalletTransaction {
    @Id
    private String id;

    private String userId;

    private String trackingId;

    private Double amount;

    private String type; // CREDIT, DEBIT

    private String category; // COMMISSION, WITHDRAWAL, ADJUSTMENT, REFUND, OTHER

    private String status; // PENDING, APPROVED, REJECTED, COMPLETED

    private String description;

    private Double previousBalance;

    private Double newBalance;

    private String reason;

    private String targetWallet; // APPROVED, PENDING

    private String adminId;

    private String adminName;

    private String updatedBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
