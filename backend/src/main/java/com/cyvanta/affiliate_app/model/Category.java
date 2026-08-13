package com.cyvanta.affiliate_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "categories")
public class Category {
    @Id
    private String id;
    
    private String name;
    private String slug;
    private String icon;
    
    @Builder.Default
    private String iconType = "lucide"; // "lucide", "url", "emoji"
    
    private String customIconUrl;
    private String description;
    
    @Builder.Default
    private String badgeColor = "#3b82f6";
    
    @Builder.Default
    private Integer displayOrder = 0;
    
    @Builder.Default
    private Boolean featured = false;
    
    @Builder.Default
    private String status = "active";
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonProperty("created")
    public String getCreated() {
        if (createdAt != null) {
            return createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
        return null;
    }
}
