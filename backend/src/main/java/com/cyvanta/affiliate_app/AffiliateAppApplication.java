package com.cyvanta.affiliate_app;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AffiliateAppApplication {

    static {
        System.setProperty("java.net.preferIPv4Stack", "true");

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

    public static void main(String[] args) {
        System.out.println("[SpringBoot] MONGODB_URI = " + System.getProperty("MONGODB_URI"));

        SpringApplication.run(AffiliateAppApplication.class, args);
    }
}