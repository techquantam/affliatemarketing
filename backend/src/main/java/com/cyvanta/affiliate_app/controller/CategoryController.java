package com.cyvanta.affiliate_app.controller;

import com.cyvanta.affiliate_app.model.Category;
import com.cyvanta.affiliate_app.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        // Sort by displayOrder ascending, then by name
        List<Category> sorted = categories.stream()
                .sorted(Comparator.comparing((Category c) -> c.getDisplayOrder() != null ? c.getDisplayOrder() : 0)
                        .thenComparing(c -> c.getName() != null ? c.getName() : ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(sorted);
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        if (category.getSlug() == null || category.getSlug().trim().isEmpty()) {
            if (category.getName() != null) {
                category.setSlug(category.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", ""));
            }
        }
        if (category.getDisplayOrder() == null) {
            category.setDisplayOrder(0);
        }
        if (category.getStatus() == null) {
            category.setStatus("active");
        }
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable String id, @RequestBody Category categoryDetails) {
        return categoryRepository.findById(id).map(category -> {
            category.setName(categoryDetails.getName());
            category.setSlug(categoryDetails.getSlug());
            category.setIcon(categoryDetails.getIcon());
            category.setIconType(categoryDetails.getIconType() != null ? categoryDetails.getIconType() : "lucide");
            category.setCustomIconUrl(categoryDetails.getCustomIconUrl());
            category.setDescription(categoryDetails.getDescription());
            category.setBadgeColor(categoryDetails.getBadgeColor());
            category.setDisplayOrder(categoryDetails.getDisplayOrder());
            category.setFeatured(categoryDetails.getFeatured());
            category.setStatus(categoryDetails.getStatus());
            return ResponseEntity.ok(categoryRepository.save(category));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String id) {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
