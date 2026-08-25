package com.cyvanta.affiliate_app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendOtpEmail(String to, String otp) {
        String subject = "Verify your account - Cyvanta Cashback";
        String text = "Welcome to Cyvanta!\n\nYour registration OTP code is: " + otp + "\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.";

        log.info("[EMAIL] Attempting to send OTP to {} (fromEmail={})", to, fromEmail);

        // If SMTP is not configured, we just log it. 
        if (fromEmail == null || fromEmail.isEmpty() || fromEmail.contains("your-email")) {
            log.warn("[EMAIL] SMTP not configured properly. Printing OTP to console for testing.");
            log.info("===========================================");
            log.info("OTP for {}: {}", to, otp);
            log.info("===========================================");
            return;
        }

        if (mailSender == null) {
            log.error("[EMAIL] JavaMailSender is not available! Check spring.mail.* configuration.");
            log.info("===========================================");
            log.info("OTP for {}: {}", to, otp);
            log.info("===========================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("[EMAIL] ✅ OTP email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] ❌ Failed to send OTP email to {} — Error: {}", to, e.getMessage());
            // Still log the OTP as fallback so testing can proceed
            log.info("===========================================");
            log.info("FALLBACK OTP for {}: {}", to, otp);
            log.info("===========================================");
            // Do NOT re-throw — registration should still succeed even if email fails.
            // The OTP is saved in DB and logged to console.
        }
    }

    public void sendPasswordResetEmail(String to, String otp) {
        String subject = "Reset your password - Cyvanta Cashback";
        String text = "Welcome to Cyvanta!\n\nYour password reset OTP code is: " + otp + "\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.";

        log.info("[EMAIL] Attempting to send reset OTP to {} (fromEmail={})", to, fromEmail);

        if (fromEmail == null || fromEmail.isEmpty() || fromEmail.contains("your-email")) {
            log.warn("[EMAIL] SMTP not configured properly. Printing reset OTP to console for testing.");
            log.info("===========================================");
            log.info("Reset OTP for {}: {}", to, otp);
            log.info("===========================================");
            return;
        }

        if (mailSender == null) {
            log.error("[EMAIL] JavaMailSender is not available! Check spring.mail.* configuration.");
            log.info("===========================================");
            log.info("Reset OTP for {}: {}", to, otp);
            log.info("===========================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("[EMAIL] ✅ Reset OTP email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] ❌ Failed to send Reset OTP email to {} — Error: {}", to, e.getMessage());
            log.info("===========================================");
            log.info("FALLBACK Reset OTP for {}: {}", to, otp);
            log.info("===========================================");
        }
    }
}
