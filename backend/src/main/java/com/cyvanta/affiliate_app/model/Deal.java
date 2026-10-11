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
@Document(collection = "deals")
public class Deal {
    @Id
    private String id;
    
    private String name;
    private String image;
    private String offerText;
    private String link;
    private String cashback;
    
    @Builder.Default
    private String status = "active";

    @Builder.Default
    private Boolean isHotDeal = true;

    @Builder.Default
    private Boolean isFeatured = true;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private List<DealComparison> comparisons;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DealComparison {
        private String platform;
        private Double listedPrice;
        private Double cashbackPercent;
        private String link;
    }
}
