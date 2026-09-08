package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Kyc;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.repository.KycRepository;
import com.cyvanta.affiliate_app.repository.NotificationRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import com.cyvanta.affiliate_app.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class KycController {

    private final UserRepository userRepository;
    private final KycRepository kycRepository;
    private final NotificationRepository notificationRepository;
    private final WalletService walletService;

    @Autowired
    public KycController(
            UserRepository userRepository,
            KycRepository kycRepository,
            NotificationRepository notificationRepository,
            WalletService walletService
    ) {
        this.userRepository = userRepository;
        this.kycRepository = kycRepository;
        this.notificationRepository = notificationRepository;
        this.walletService = walletService;
    }

    private HttpHeaders createNoCacheHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
        return headers;
    }

    @PostMapping({"/api/kyc/approve/{id}", "/api/admin/kyc/approve/{id}", "/kyc/approve/{id}"})
    public ResponseEntity<?> approve(@PathVariable String id, @RequestBody(required = false) Map<String, ?> body) {
        String adminRemark = "Approved";
        if (body != null && body.containsKey("admin_remark")) {
            adminRemark = String.valueOf(body.get("admin_remark"));
        } else if (body != null && body.containsKey("remarks")) {
            adminRemark = String.valueOf(body.get("remarks"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(id);
        }

        Optional<Kyc> kycOpt = kycRepository.findByUserId(id);
        if (kycOpt.isEmpty()) {
            kycOpt = kycRepository.findById(id);
        }

        Kyc kyc = kycOpt.orElseGet(() -> {
            Kyc newKyc = new Kyc();
            newKyc.setUser_id(id);
            return newKyc;
        });

        kyc.setStatus("approved");
        kyc.setIs_verified(1);
        kyc.setAdmin_remark(adminRemark);
        kyc.setUpdatedAt(LocalDateTime.now());
        kycRepository.save(kyc);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setKycStatus("approved");
            user.setKyc_status("approved");
            user.setIs_kyc_verified(1);
            user.setIsKycVerified(true);
            user.setAdmin_remark(adminRemark);
            user.setKycRemarks(adminRemark);
            userRepository.save(user);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("status", "approved");
        resp.put("is_verified", 1);
        resp.put("is_kyc_verified", 1);
        resp.put("message", "KYC Approved Successfully");

        return ResponseEntity.ok()
                .headers(createNoCacheHeaders())
                .body(resp);
    }

    @PostMapping({"/api/kyc/reject/{id}", "/api/admin/kyc/reject/{id}", "/kyc/reject/{id}"})
    public ResponseEntity<?> reject(@PathVariable String id, @RequestBody(required = false) Map<String, ?> body) {
        String adminRemark = "Rejected";
        if (body != null && body.containsKey("remarks")) {
            adminRemark = String.valueOf(body.get("remarks"));
        } else if (body != null && body.containsKey("admin_remark")) {
            adminRemark = String.valueOf(body.get("admin_remark"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(id);
        }

        Optional<Kyc> kycOpt = kycRepository.findByUserId(id);
        if (kycOpt.isEmpty()) {
            kycOpt = kycRepository.findById(id);
        }

        Kyc kyc = kycOpt.orElseGet(() -> {
            Kyc newKyc = new Kyc();
            newKyc.setUser_id(id);
            return newKyc;
        });

        kyc.setStatus("rejected");
        kyc.setIs_verified(0);
        kyc.setAdmin_remark(adminRemark);
        kyc.setUpdatedAt(LocalDateTime.now());
        kycRepository.save(kyc);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setKycStatus("rejected");
            user.setKyc_status("rejected");
            user.setIs_kyc_verified(0);
            user.setIsKycVerified(false);
            user.setAdmin_remark(adminRemark);
            user.setKycRemarks(adminRemark);
            userRepository.save(user);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("status", "rejected");
        resp.put("is_verified", 0);
        resp.put("is_kyc_verified", 0);
        resp.put("message", "KYC Rejected");

        return ResponseEntity.ok()
                .headers(createNoCacheHeaders())
                .body(resp);
    }

    @GetMapping({"/api/kyc-status", "/kyc-status", "/api/kyc/status"})
    public ResponseEntity<?> getKycStatus(
            @RequestParam(name = "user_id", required = false) String userIdParam,
            @RequestParam(name = "userId", required = false) String userIdParam2,
            @RequestParam(name = "id", required = false) String idParam,
            @RequestParam(name = "uid", required = false) String uidParam,
            @RequestHeader(name = "X-User-Id", required = false) String headerUserId
    ) {
        String targetUserId = null;
        if (userIdParam != null && !userIdParam.isBlank()) targetUserId = userIdParam;
        else if (userIdParam2 != null && !userIdParam2.isBlank()) targetUserId = userIdParam2;
        else if (idParam != null && !idParam.isBlank()) targetUserId = idParam;
        else if (uidParam != null && !uidParam.isBlank()) targetUserId = uidParam;
        else if (headerUserId != null && !headerUserId.isBlank()) targetUserId = headerUserId;

        if (targetUserId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "user_id is required"));
        }

        Optional<User> userOpt = userRepository.findById(targetUserId);
        Optional<Kyc> kycOpt = kycRepository.findByUserId(targetUserId);

        String status = "pending";
        Integer isVerified = 0;
        Integer isKycVerified = 0;
        Boolean isKycVerifiedBool = false;
        String adminRemark = "";

        if (userOpt.isPresent()) {
            User u = userOpt.get();
            status = u.getKycStatus() != null ? u.getKycStatus() : (u.getKyc_status() != null ? u.getKyc_status() : "pending");
            isKycVerified = u.getIs_kyc_verified() != null ? u.getIs_kyc_verified() : (Boolean.TRUE.equals(u.getIsKycVerified()) ? 1 : 0);
            isKycVerifiedBool = isKycVerified == 1;
            isVerified = isKycVerified;
            adminRemark = u.getAdmin_remark() != null ? u.getAdmin_remark() : "";
        }

        if (kycOpt.isPresent()) {
            Kyc k = kycOpt.get();
            if (k.getStatus() != null) {
                status = k.getStatus();
            }
            if (k.getIs_verified() != null) {
                isVerified = k.getIs_verified();
                if (isVerified == 1) {
                    isKycVerified = 1;
                    isKycVerifiedBool = true;
                }
            }
            if (k.getAdmin_remark() != null) {
                adminRemark = k.getAdmin_remark();
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", status);
        resp.put("is_verified", isVerified);
        resp.put("is_kyc_verified", isKycVerified);
        resp.put("isKycVerified", isKycVerifiedBool);
        resp.put("admin_remark", adminRemark);

        return ResponseEntity.ok()
                .headers(createNoCacheHeaders())
                .body(resp);
    }
}
