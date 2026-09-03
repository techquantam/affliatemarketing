package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Store;
import com.cyvanta.affiliate_app.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreRepository storeRepository;

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@RequestBody Store store) {
        return ResponseEntity.ok(storeRepository.save(store));
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
            store.setStatus(storeDetails.getStatus());
            store.setCoupons(storeDetails.getCoupons());
            return ResponseEntity.ok(storeRepository.save(store));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Store> toggleStoreStatus(@PathVariable String id) {
        return storeRepository.findById(id).map(store -> {
            String currentStatus = store.getStatus();
            store.setStatus("active".equalsIgnoreCase(currentStatus) ? "inactive" : "active");
            return ResponseEntity.ok(storeRepository.save(store));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable String id) {
        if (storeRepository.existsById(id)) {
            storeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
