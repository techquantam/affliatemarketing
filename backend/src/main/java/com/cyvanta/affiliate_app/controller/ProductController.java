package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Product;
import com.cyvanta.affiliate_app.model.Notification;
import com.cyvanta.affiliate_app.repository.NotificationRepository;
import com.cyvanta.affiliate_app.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(productService.getProductsByCategory(category));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Frontend calls POST /api/products
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        try {
            productService.validateProduct(product);
            Product saved = productService.saveProduct(product);
            triggerNewProductNotification(saved);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Keep the old /admin endpoint as an alias for backward compatibility
    @PostMapping("/admin")
    public ResponseEntity<?> createProductAdmin(@RequestBody Product product) {
        try {
            productService.validateProduct(product);
            Product saved = productService.saveProduct(product);
            triggerNewProductNotification(saved);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Frontend calls POST /api/products/bulk
    @PostMapping("/bulk")
    public ResponseEntity<?> createProductBulk(@RequestBody List<Product> products) {
        List<Product> savedProducts = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            try {
                productService.validateProduct(product);
                Product saved = productService.saveProduct(product);
                savedProducts.add(saved);
                triggerNewProductNotification(saved);
            } catch (IllegalArgumentException e) {
                errors.add("Product " + (i + 1) + " (" + (product.getName() != null ? product.getName() : "Unknown") + "): " + e.getMessage());
            }
        }
        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation failed for some products", "errors", errors));
        }
        return ResponseEntity.ok(savedProducts);
    }

    // Frontend calls PUT /api/products/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable String id, @RequestBody Product product) {
        return productService.getProductById(id).map(existing -> {
            try {
                product.setId(id);
                productService.validateProduct(product);
                Product saved = productService.saveProduct(product);
                if (saved.getPrice() != null && existing.getPrice() != null && saved.getPrice() < existing.getPrice()) {
                    triggerPriceDropNotification(existing, saved);
                } else {
                    triggerProductUpdateNotification(saved);
                }
                return ResponseEntity.ok(saved);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Frontend calls DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        return productService.getProductById(id).map(existing -> {
            productService.deleteProduct(id);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private void triggerNewProductNotification(Product product) {
        try {
            Notification notif = Notification.builder()
                    .userId(null) // Global
                    .title("New Product Added!")
                    .message("Great news! " + product.getName() + " is now available on " + product.getPlatform() + " at ₹" + String.format("%.2f", product.getPrice()) + "! Grab it and earn cashback.")
                    .type("NEW_PRODUCT")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            // log
        }
    }

    private void triggerPriceDropNotification(Product existing, Product updated) {
        try {
            if (updated.getPrice() != null && existing.getPrice() != null && updated.getPrice() < existing.getPrice()) {
                Notification notif = Notification.builder()
                        .userId(null) // Global
                        .title("Price Drop Alert!")
                        .message("Hurry! Price drop on " + updated.getName() + "! It is now available at ₹" + String.format("%.2f", updated.getPrice()) + " (was ₹" + String.format("%.2f", existing.getPrice()) + ") on " + updated.getPlatform() + ".")
                        .type("DEAL")
                        .read(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }
        } catch (Exception e) {
            // log
        }
    }

    private void triggerProductUpdateNotification(Product product) {
        try {
            Notification notif = Notification.builder()
                    .userId(null) // Global
                    .title("Product Offer Updated!")
                    .message("The product '" + product.getName() + "' on " + product.getPlatform() + " has been updated with new details or cashback. Check it out now!")
                    .type("PRODUCT_UPDATE")
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            // log
        }
    }
}
