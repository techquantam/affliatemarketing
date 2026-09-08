package com.cyvanta.affiliate_app.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    private String passwordHash;

    private String phone;

    @Indexed(unique = true)
    private String referralCode; // e.g., TQX845

    private String referredBy; // referral code of the person who invited them

    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private AdminPermissions permissions = AdminPermissions.defaultForRole(Role.USER);

    // Frontend-compatible status field ("active", "blocked")
    @Builder.Default
    private String status = "active";

    @Builder.Default
    @JsonProperty("isBlocked")
    @JsonAlias({"blocked"})
    private Boolean isBlocked = false;

    @Builder.Default
    @JsonProperty("is_blocked")
    private Integer is_blocked = 0;

    // Custom shared commission rate for this user (null = use global default)
    private Double sharedCommissionRate;

    private String otp;

    private LocalDateTime otpExpiry;

    /** MessageCentral verificationId — stored in DB so it survives server restarts */
    private String mcVerificationId;

    @Builder.Default
    private Boolean isVerified = false;

    // --- Profile Fields ---
    private String dob;
    private String gender;
    private String address;
    private String city;
    private String state;
    private String pincode;

    @Builder.Default
    private Boolean isProfileComplete = false;

    // --- E-KYC Fields ---
    private String aadhaarNumber;
    private String panNumber;
    private String aadhaarFrontUrl;
    private String aadhaarBackUrl;
    private String panCardUrl;
    private String selfieUrl;

    @Builder.Default
    private String kycStatus = "not_submitted"; // "not_submitted", "pending", "approved", "rejected"

    private String kyc_status;

    @Builder.Default
    private Integer is_kyc_verified = 0;

    @Builder.Default
    private Boolean isKycVerified = false;

    private String admin_remark;

    private String kycRemarks;

    // --- Payment Details Fields ---
    private String upiId;
    private String bankAccountName;
    private String bankAccountNumber;
    private String bankIfsc;
    private String bankName;

    @Builder.Default
    private String paymentDetailsStatus = "not_submitted"; // "not_submitted", "pending", "approved", "rejected"

    private String paymentDetailsRemarks;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Frontend expects "joinDate" as a formatted date string
    @JsonProperty("joinDate")
    public String getJoinDate() {
        if (createdAt != null) {
            return createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
        return null;
    }

    public Integer getIs_blocked() {
        if (is_blocked != null) return is_blocked;
        return ((isBlocked != null && isBlocked) || "blocked".equalsIgnoreCase(status)) ? 1 : 0;
    }

    public void setIs_blocked(Integer val) {
        this.is_blocked = val != null ? val : 0;
        this.isBlocked = this.is_blocked == 1;
        if (this.isBlocked) {
            this.status = "blocked";
        } else if ("blocked".equalsIgnoreCase(this.status)) {
            this.status = "active";
        }
    }

    public Boolean getIsBlocked() {
        if (isBlocked != null && isBlocked) return true;
        if (is_blocked != null && is_blocked == 1) return true;
        return "blocked".equalsIgnoreCase(status);
    }

    public void setIsBlocked(Boolean blocked) {
        this.isBlocked = blocked != null && blocked;
        this.is_blocked = this.isBlocked ? 1 : 0;
        if (this.isBlocked) {
            this.status = "blocked";
        } else if ("blocked".equalsIgnoreCase(this.status)) {
            this.status = "active";
        }
    }

    public void setStatus(String status) {
        this.status = status;
        if ("blocked".equalsIgnoreCase(status)) {
            this.isBlocked = true;
            this.is_blocked = 1;
        } else if ("active".equalsIgnoreCase(status)) {
            this.isBlocked = false;
            this.is_blocked = 0;
        }
    }

    public String getKycStatus() {
        if (kycStatus != null && !kycStatus.isBlank()) return kycStatus;
        return kyc_status;
    }

    public String getKyc_status() {
        if (kyc_status != null && !kyc_status.isBlank()) return kyc_status;
        return kycStatus;
    }

    public void setKycStatus(String status) {
        String normalized = "approve".equalsIgnoreCase(status) ? "approved" : status;
        this.kycStatus = normalized;
        this.kyc_status = normalized;
        if ("approved".equalsIgnoreCase(normalized)) {
            this.is_kyc_verified = 1;
            this.isKycVerified = true;
        }
    }

    public void setKyc_status(String status) {
        String normalized = "approve".equalsIgnoreCase(status) ? "approved" : status;
        this.kyc_status = normalized;
        this.kycStatus = normalized;
        if ("approved".equalsIgnoreCase(normalized)) {
            this.is_kyc_verified = 1;
            this.isKycVerified = true;
        }
    }

    public enum Role {
        USER,
        SUPER_ADMIN,
        ADMIN,
        CONTENT_MANAGER,
        AFFILIATE_MANAGER,
        SUPPORT_ADMIN
    }
}
