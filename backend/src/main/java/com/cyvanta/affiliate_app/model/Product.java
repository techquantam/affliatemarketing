package com.cyvanta.affiliate_app.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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
@Document(collection = "products")
public class Product {

    @Id
    private String id;

    private String name;

    private String description;

    @Builder.Default
    private Double dummyCommission = 0.0;

    private Double price;

    private Double discountPrice;

    private String category;

    private String brand;

    private String image;

    private List<String> images; // supporting list for compatibility

    private String affiliateUrl; // base affiliate network URL

    private String platform; // e.g., Amazon, Flipkart, Myntra

    private Double cashbackValue; // average commission %

    @Builder.Default
    private String status = "active";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // --- Compatibility getters and setters for legacy code ---
    
    public String getTitle() {
        return this.name;
    }

    public void setTitle(String title) {
        this.name = title;
    }

    public String getSourcePlatform() {
        return this.platform;
    }

    public void setSourcePlatform(String sourcePlatform) {
        this.platform = sourcePlatform;
    }

    public Double getCommissionPercentage() {
        return this.cashbackValue;
    }

    public void setCommissionPercentage(Double commissionPercentage) {
        this.cashbackValue = commissionPercentage;
    }

    public Boolean getIsActive() {
        return "active".equalsIgnoreCase(this.status);
    }

    public void setIsActive(Boolean isActive) {
        this.status = Boolean.TRUE.equals(isActive) ? "active" : "inactive";
    }

    public List<String> getImages() {
        if (this.images != null && !this.images.isEmpty()) {
            return this.images;
        }
        if (this.image != null) {
            return List.of(this.image);
        }
        return List.of();
    }

    public void setImages(List<String> images) {
        this.images = images;
        if (images != null && !images.isEmpty()) {
            this.image = images.get(0);
        }
    }
}
