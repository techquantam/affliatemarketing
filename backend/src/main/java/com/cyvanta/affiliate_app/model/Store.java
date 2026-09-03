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
    private String status = "active";
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private List<Coupon> coupons;
}
