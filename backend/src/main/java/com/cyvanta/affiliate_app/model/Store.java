package com.cyvanta.affiliate_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stores")
public class Store {
    @Id
    private String id;
    
    private String name;
    private String logo;
    private String banner;
    private String cashbackRate;
    private String description;
    private String category;
    
    // Owner Details
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;
    
    // Address / Location
    private String address;
    private String location;
    
    // Target URL / Affiliate Link
    private String link;
    private String affiliateUrl;
    
    @Builder.Default
    private Boolean isPopular = false;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Integer is_active = 1;

    @Builder.Default
    private Boolean isApproved = true;

    @Builder.Default
    private Integer is_approved = 1;

    @Builder.Default
    private String status = "active";
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private List<Coupon> coupons;

    public Boolean getIsActive() {
        if (isActive != null) {
            return isActive;
        }
        return status == null || !"inactive".equalsIgnoreCase(status);
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
        this.is_active = (isActive != null && isActive) ? 1 : 0;
        if (Boolean.FALSE.equals(isActive)) {
            this.status = "inactive";
        } else if (this.status == null || "inactive".equalsIgnoreCase(this.status)) {
            this.status = "active";
        }
    }

    public Integer getIs_active() {
        if (is_active != null) return is_active;
        return Boolean.TRUE.equals(getIsActive()) ? 1 : 0;
    }

    public void setIs_active(Integer is_active) {
        this.is_active = is_active;
        this.isActive = is_active != null && is_active == 1;
    }

    public Boolean getIsApproved() {
        if (isApproved != null) return isApproved;
        return is_approved == null || is_approved == 1;
    }

    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
        this.is_approved = (isApproved != null && isApproved) ? 1 : 0;
    }

    public Integer getIs_approved() {
        if (is_approved != null) return is_approved;
        return Boolean.TRUE.equals(getIsApproved()) ? 1 : 0;
    }

    public void setIs_approved(Integer is_approved) {
        this.is_approved = is_approved;
        this.isApproved = is_approved != null && is_approved == 1;
    }

    public void setStatus(String status) {
        this.status = status;
        if ("inactive".equalsIgnoreCase(status) || "disabled".equalsIgnoreCase(status) || "0".equals(status)) {
            this.isActive = false;
            this.is_active = 0;
        } else if ("active".equalsIgnoreCase(status) || "1".equals(status)) {
            this.isActive = true;
            this.is_active = 1;
        }
    }
}
