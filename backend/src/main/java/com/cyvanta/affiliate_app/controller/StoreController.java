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
    public ResponseEntity<List<Store>> getAllStores() {
        List<Store> stores = storeRepository.findAll();
        for (Store store : stores) {
            if (store.getStatus() == null || store.getStatus().isBlank()) {
                store.setStatus("active");
            }
            if (store.getIsActive() == null) {
                store.setIsActive(!"inactive".equalsIgnoreCase(store.getStatus()));
            }
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate, max-age=0")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(stores);
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@RequestBody Store store) {
        if (store.getStatus() == null || store.getStatus().isBlank()) {
            store.setStatus("active");
        }
        if (store.getIsActive() == null) {
            store.setIsActive(true);
        }
        if (store.getCreatedAt() == null) {
            store.setCreatedAt(LocalDateTime.now());
        }
        if (store.getLogo() == null || store.getLogo().isBlank()) {
            String fallbackName = store.getName() != null && !store.getName().isBlank() ? store.getName().trim() : "Store";
            store.setLogo("https://placehold.co/120x60/f8fafc/64748b?text=" + fallbackName);
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
