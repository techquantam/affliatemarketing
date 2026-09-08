package com.cyvanta.affiliate_app.repository;

import com.cyvanta.affiliate_app.model.Setting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingRepository extends MongoRepository<Setting, String> {
}
