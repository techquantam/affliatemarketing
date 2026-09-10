package com.cyvanta.affiliate_app.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "shared_links")
public class SharedLink {
    @Id
    private String id;
    private String userId;
    private String userName;
    private String productName;
    private String store;
    private String productUrl;
    private String shortUrl;
    private String productImage;
    private Double dealPrice;
    private Double originalPrice;
    private Double cashbackPercent;
    private Integer clicksCount;
    private Integer conversionsCount;
    private Double totalEarnings;
    private Double userSharePercent;
    private String status;
    private LocalDate date;
}
