package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Banner;
import com.cyvanta.affiliate_app.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerRepository bannerRepository;

    @GetMapping
    public ResponseEntity<List<Banner>> getAllBanners() {
        return ResponseEntity.ok(bannerRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Banner>> getActiveBanners() {
        return ResponseEntity.ok(bannerRepository.findByIsActiveTrue());
    }

    @PostMapping
    public ResponseEntity<Banner> createBanner(@RequestBody Banner banner) {
        return ResponseEntity.ok(bannerRepository.save(banner));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Banner> updateBanner(@PathVariable String id, @RequestBody Banner bannerDetails) {
        return bannerRepository.findById(id).map(banner -> {
            banner.setTag(bannerDetails.getTag());
            banner.setTitle(bannerDetails.getTitle());
            banner.setDesc(bannerDetails.getDesc());
            banner.setCta(bannerDetails.getCta());
            banner.setStoreName(bannerDetails.getStoreName());
            banner.setCashbackRate(bannerDetails.getCashbackRate());
            banner.setLogo(bannerDetails.getLogo());
            banner.setType(bannerDetails.getType());
            banner.setTargetUrl(bannerDetails.getTargetUrl());
            banner.setIsActive(bannerDetails.getIsActive());
            return ResponseEntity.ok(bannerRepository.save(banner));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable String id) {
        if (bannerRepository.existsById(id)) {
            bannerRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
