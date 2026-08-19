package com.cyvanta.affiliate_app.repository;

import com.cyvanta.affiliate_app.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    @Query(value = "{ '$or': [ { 'userId': ?0 }, { 'userId': null }, { 'userId': '' } ] }", sort = "{ 'createdAt': -1 }")
    List<Notification> findUserAndGlobalNotifications(String userId);
}
