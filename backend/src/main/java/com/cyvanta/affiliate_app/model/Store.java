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
        if (Boolean.FALSE.equals(isActive)) {
            this.status = "inactive";
        } else if (this.status == null || "inactive".equalsIgnoreCase(this.status)) {
            this.status = "active";
        }
    }

    public void setStatus(String status) {
        this.status = status;
        if ("inactive".equalsIgnoreCase(status) || "disabled".equalsIgnoreCase(status) || "0".equals(status)) {
            this.isActive = false;
        } else if ("active".equalsIgnoreCase(status) || "1".equals(status)) {
            this.isActive = true;
        }
    }
}
