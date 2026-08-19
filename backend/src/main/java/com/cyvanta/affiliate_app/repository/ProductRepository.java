package com.cyvanta.affiliate_app.repository;

import com.cyvanta.affiliate_app.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByCategoryAndStatus(String category, String status);
    Optional<Product> findByAffiliateUrl(String affiliateUrl);
}
