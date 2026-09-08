package com.cyvanta.affiliate_app.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "kycs")
public class Kyc {

    @Id
    private String id;

    @JsonProperty("user_id")
    private String user_id;

    private String userId;

    private String status; // "pending", "approved", "rejected"

    @JsonProperty("is_verified")
    private Integer is_verified; // 1 = verified/approved, 0 = unverified

    @JsonProperty("admin_remark")
    private String admin_remark;

    private String aadhaarNumber;
    private String panNumber;
    private String aadhaarFrontUrl;
    private String aadhaarBackUrl;
    private String panUrl;
    private String selfieUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getUser_id() {
        return user_id != null ? user_id : userId;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
        this.userId = user_id;
    }

    public void setUserId(String userId) {
        this.userId = userId;
        this.user_id = userId;
    }
}
