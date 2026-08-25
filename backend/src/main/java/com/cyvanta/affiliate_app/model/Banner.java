package com.cyvanta.affiliate_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "banners")
public class Banner {
    @Id
    private String id;
    
    private String tag;
    private String title;
    private String desc;
    private String cta;
    private String storeName;
    private String cashbackRate;
    private String logo;
    
    @Builder.Default
    private String type = "HERO"; // HERO, AD
    
    private String targetUrl;
    
    @Builder.Default
    private Boolean isActive = true;
}
