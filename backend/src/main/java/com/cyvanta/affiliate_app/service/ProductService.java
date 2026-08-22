package com.cyvanta.affiliate_app.service;

import com.cyvanta.affiliate_app.model.Product;
import com.cyvanta.affiliate_app.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndStatus(category, "active");
    }

    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }

    public void validateProduct(Product product) {
        String url = product.getAffiliateUrl();
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("Product Affiliate Link URL is required.");
        }
        
        // 1. URL must be valid
        try {
            new java.net.URL(url);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Affiliate Link URL format.");
        }
        
        // 2. URL must be the correct Affiliate/Product URL for that store
        String platform = product.getPlatform();
        if (platform != null && !platform.isEmpty()) {
            String lowerUrl = url.toLowerCase();
            String lowerPlatform = platform.toLowerCase();
            
            boolean isValidStoreUrl = false;
            
            // Allow general affiliate tracking redirects and generic URL shorteners to pass validation for any store
            boolean isTrackingOrShortUrl = lowerUrl.contains("linksredirect.com") || 
                                           lowerUrl.contains("cuelinks.com") ||
                                           lowerUrl.contains("clnk.in") || 
                                           lowerUrl.contains("ern.li") || 
                                           lowerUrl.contains("bit.ly") ||
                                           lowerUrl.contains("tinyurl.com") ||
                                           lowerUrl.contains("earnkaro.com") ||
                                           lowerUrl.contains("vcommission") ||
                                           lowerUrl.contains("admitad") ||
                                           lowerUrl.contains("commission") ||
                                           lowerUrl.contains("msho.co") ||
                                           lowerUrl.contains("fkrt.it") ||
                                           lowerUrl.contains("fkrt.co") ||
                                           lowerUrl.contains("amzn.to");
            
            if (isTrackingOrShortUrl) {
                isValidStoreUrl = true;
            } else if (lowerPlatform.contains("amazon")) {
                isValidStoreUrl = lowerUrl.contains("amazon.") || lowerUrl.contains("amzn.");
            } else if (lowerPlatform.contains("flipkart")) {
                isValidStoreUrl = lowerUrl.contains("flipkart.") || lowerUrl.contains("fkrt.");
            } else if (lowerPlatform.contains("myntra")) {
                isValidStoreUrl = lowerUrl.contains("myntra.") || lowerUrl.contains("mynt.in");
            } else if (lowerPlatform.contains("ajio")) {
                isValidStoreUrl = lowerUrl.contains("ajio");
            } else if (lowerPlatform.contains("nykaa")) {
                isValidStoreUrl = lowerUrl.contains("nykaa");
            } else if (lowerPlatform.contains("meesho")) {
                isValidStoreUrl = lowerUrl.contains("meesho") || lowerUrl.contains("msho.co");
            } else if (lowerPlatform.contains("makemytrip")) {
                isValidStoreUrl = lowerUrl.contains("makemytrip");
            } else {
                isValidStoreUrl = true; // general fallback
            }
            
            if (!isValidStoreUrl) {
                throw new IllegalArgumentException("The Affiliate URL does not match the selected store (" + platform + ").");
            }
        }
        
        // 3. Same Affiliate URL cannot be used to add the same product again
        Optional<Product> existingOpt = productRepository.findByAffiliateUrl(url);
        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            if (product.getId() == null || !product.getId().equals(existing.getId())) {
                throw new IllegalArgumentException("A product with this Affiliate URL already exists in the system.");
            }
        }
    }
}
