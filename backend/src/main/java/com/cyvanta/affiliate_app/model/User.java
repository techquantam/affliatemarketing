package com.cyvanta.affiliate_app.model;

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

    private String kycRemarks;

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

    public enum Role {
        USER,
        SUPER_ADMIN,
        ADMIN,
        CONTENT_MANAGER,
        AFFILIATE_MANAGER,
        SUPPORT_ADMIN
    }
}
