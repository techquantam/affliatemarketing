package com.cyvanta.affiliate_app.repository;

import com.cyvanta.affiliate_app.model.Kyc;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KycRepository extends MongoRepository<Kyc, String> {

    @Query("{ '$or': [ { 'user_id': ?0 }, { 'userId': ?0 } ] }")
    Optional<Kyc> findByUserId(String userId);

    @Query("{ '$or': [ { 'user_id': ?0 }, { 'userId': ?0 } ] }")
    Optional<Kyc> findByUser_id(String userId);
}
