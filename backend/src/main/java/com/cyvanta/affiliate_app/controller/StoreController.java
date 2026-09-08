package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Store;
import com.cyvanta.affiliate_app.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreRepository storeRepository;

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer is_approved,
            @RequestParam(required = false) Boolean isApproved,
            @RequestParam(required = false) Integer is_active) {

        List<Store> stores = storeRepository.findAllByOrderByCreatedAtDesc();
        if (stores == null || stores.isEmpty()) {
            stores = storeRepository.findAll();
        }

        List<Store> list = new java.util.ArrayList<>(stores != null ? stores : java.util.Collections.emptyList());
        list.sort(java.util.Comparator.comparing(
                Store::getCreatedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())
        ).reversed());

        List<Store> filtered = list.stream()
                .peek(store -> {
                    if (store.getStatus() == null || store.getStatus().isBlank()) {
                        store.setStatus("active");
                    }
                    if (store.getIsActive() == null) {
                        store.setIsActive(!"inactive".equalsIgnoreCase(store.getStatus()));
                    }
                    if (store.getIsApproved() == null) {
                        store.setIsApproved(true);
                        store.setIs_approved(1);
                    }
                })
                .filter(store -> {
                    if (status != null && !status.equalsIgnoreCase(store.getStatus())) return false;
                    if (is_approved != null && !is_approved.equals(store.getIs_approved())) return false;
                    if (isApproved != null && !isApproved.equals(store.getIsApproved())) return false;
                    if (is_active != null && !is_active.equals(store.getIs_active())) return false;
                    return true;
                })
                .toList();

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(filtered);
    }

    public ResponseEntity<List<Store>> getAllStores() {
        return getAllStores(null, null, null, null);
    }

    @GetMapping({"/active", "/active-stores"})
    public ResponseEntity<List<Store>> getActiveStores() {
        return getAllStores("active", 1, true, 1);
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@RequestBody Store store) {
        if (store.getStatus() == null || store.getStatus().isBlank()) {
            store.setStatus("active");
        }
        if (store.getIsActive() == null) {
            store.setIsActive(true);
            store.setIs_active(1);
        }
        if (store.getIsApproved() == null) {
            store.setIsApproved(true);
            store.setIs_approved(1);
        }
        if (store.getCreatedAt() == null) {
            store.setCreatedAt(LocalDateTime.now());
        }
        if (store.getLogo() == null || store.getLogo().isBlank()) {
            String fallbackName = store.getName() != null && !store.getName().isBlank() ? store.getName().trim() : "Store";
            store.setLogo("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-size='14' font-weight='bold'>" + fallbackName + "</text></svg>");
        }
        Store saved = storeRepository.save(store);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                .body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Store> updateStore(@PathVariable String id, @RequestBody Store storeDetails) {
        return storeRepository.findById(id).map(store -> {
            store.setName(storeDetails.getName());
            store.setLogo(storeDetails.getLogo());
            store.setBanner(storeDetails.getBanner());
            store.setCashbackRate(storeDetails.getCashbackRate());
            store.setDescription(storeDetails.getDescription());
            store.setCategory(storeDetails.getCategory());
            store.setOwnerName(storeDetails.getOwnerName());
            store.setOwnerPhone(storeDetails.getOwnerPhone());
            store.setOwnerEmail(storeDetails.getOwnerEmail());
            store.setAddress(storeDetails.getAddress());
            store.setLocation(storeDetails.getLocation());
            store.setLink(storeDetails.getLink());
            store.setAffiliateUrl(storeDetails.getAffiliateUrl());
            store.setIsPopular(storeDetails.getIsPopular());
            store.setStatus(storeDetails.getStatus() != null ? storeDetails.getStatus() : "active");
            store.setIsActive(storeDetails.getIsActive() != null ? storeDetails.getIsActive() : !"inactive".equalsIgnoreCase(store.getStatus()));
            store.setCoupons(storeDetails.getCoupons());
            Store saved = storeRepository.save(store);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                    .body(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Store> toggleStoreStatus(@PathVariable String id) {
        return storeRepository.findById(id).map(store -> {
            String currentStatus = store.getStatus();
            boolean isNowActive = !"active".equalsIgnoreCase(currentStatus);
            store.setStatus(isNowActive ? "active" : "inactive");
            store.setIsActive(isNowActive);
            Store saved = storeRepository.save(store);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                    .body(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable String id) {
        if (storeRepository.existsById(id)) {
            storeRepository.deleteById(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                    .build();
        }
        return ResponseEntity.notFound().build();
    }
}
