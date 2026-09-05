package com.cyvanta.affiliate_app;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDateTime;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class AffiliateAppApplication {

    static {
        System.setProperty("java.net.preferIPv4Stack", "true");

        // Enforce consistent server timezone across JVM
        String targetTz = System.getenv("APP_TIMEZONE");
        if (targetTz == null || targetTz.trim().isEmpty()) {
            targetTz = System.getenv("TZ");
        }
        if (targetTz == null || targetTz.trim().isEmpty()) {
            targetTz = "Asia/Kolkata";
        }
        System.setProperty("user.timezone", targetTz);
        TimeZone.setDefault(TimeZone.getTimeZone(targetTz));

        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            // fallback
        }

        try {
            Dotenv parentDotenv = Dotenv.configure().directory("../").ignoreIfMissing().load();
            parentDotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception e) {
            // fallback
        }
    }

    @PostConstruct
    public void init() {
        String targetTz = System.getProperty("app.timezone");
        if (targetTz == null || targetTz.trim().isEmpty()) {
            targetTz = System.getProperty("user.timezone", "Asia/Kolkata");
        }
        TimeZone.setDefault(TimeZone.getTimeZone(targetTz));
        System.out.println("[TimezoneSync] Server timezone synchronized to: " + TimeZone.getDefault().getID() + " | Local Server Time: " + LocalDateTime.now());
    }

    public static void main(String[] args) {
        System.out.println("[SpringBoot] MONGODB_URI = " + System.getProperty("MONGODB_URI"));

        SpringApplication.run(AffiliateAppApplication.class, args);
    }
}