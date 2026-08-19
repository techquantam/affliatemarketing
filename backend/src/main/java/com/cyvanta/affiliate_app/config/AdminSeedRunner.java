package com.cyvanta.affiliate_app.config;

import com.cyvanta.affiliate_app.model.AdminPermissions;
import com.cyvanta.affiliate_app.model.Category;
import com.cyvanta.affiliate_app.model.Conversion;
import com.cyvanta.affiliate_app.model.Coupon;
import com.cyvanta.affiliate_app.model.Product;
import com.cyvanta.affiliate_app.model.Store;
import com.cyvanta.affiliate_app.model.User;
import com.cyvanta.affiliate_app.model.Deal;
import com.cyvanta.affiliate_app.repository.CategoryRepository;
import com.cyvanta.affiliate_app.repository.ConversionRepository;
import com.cyvanta.affiliate_app.repository.DealRepository;
import com.cyvanta.affiliate_app.repository.ProductRepository;
import com.cyvanta.affiliate_app.repository.StoreRepository;
import com.cyvanta.affiliate_app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class AdminSeedRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ConversionRepository conversionRepository;
    private final DealRepository dealRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminSeedRunner(UserRepository userRepository, ProductRepository productRepository, 
                           StoreRepository storeRepository, CategoryRepository categoryRepository,
                           ConversionRepository conversionRepository, DealRepository dealRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
        this.conversionRepository = conversionRepository;
        this.dealRepository = dealRepository;
    }

    @Override
    public void run(String... args) {
        try {
            if (userRepository.findByEmail("admin@affiliateapp.com").isPresent()) {
                // Always ensure seeded admin has SUPER_ADMIN role and latest permissions
                User existingAdmin = userRepository.findByEmail("admin@affiliateapp.com").get();
                if (existingAdmin.getRole() != User.Role.SUPER_ADMIN 
                    || existingAdmin.getPermissions() == null 
                    || existingAdmin.getPermissions().getAllowedModules() == null
                    || existingAdmin.getPermissions().getAllowedModules().isEmpty()) {
                    existingAdmin.setRole(User.Role.SUPER_ADMIN);
                    existingAdmin.setPermissions(AdminPermissions.defaultForRole(User.Role.SUPER_ADMIN));
                    userRepository.save(existingAdmin);
                    System.out.println("Admin role upgraded to SUPER_ADMIN with fresh permissions");
                } else {
                    System.out.println("Admin already exists with correct SUPER_ADMIN role");
                }
            } else {
                User admin = new User();
                admin.setName("admin");
                admin.setPhone("+919476543211");
                admin.setEmail("admin@affiliateapp.com");
                admin.setReferralCode("admin123");
                admin.setRole(User.Role.SUPER_ADMIN);
                admin.setPermissions(AdminPermissions.defaultForRole(User.Role.SUPER_ADMIN));
                admin.setPasswordHash(passwordEncoder.encode("admin123"));

                userRepository.save(admin);
                System.out.println("Admin seeded successfully");
            }
            
            // Seed Dummy Referrals
            if (userRepository.count() < 3) {
                User user1 = new User();
                user1.setName("Alice Sharma");
                user1.setEmail("alice@example.com");
                user1.setReferredBy("admin123");
                user1.setRole(User.Role.USER);
                user1.setPasswordHash(passwordEncoder.encode("password"));
                
                User user2 = new User();
                user2.setName("Bob Singh");
                user2.setEmail("bob@example.com");
                user2.setReferredBy("admin123");
                user2.setRole(User.Role.USER);
                user2.setPasswordHash(passwordEncoder.encode("password"));
                
                userRepository.saveAll(List.of(user1, user2));
                System.out.println("Sample referred users seeded successfully");
            }
            
            // Seed Categories
            if (categoryRepository.count() == 0) {
                categoryRepository.saveAll(List.of(
                    Category.builder()
                        .name("Electronics")
                        .slug("electronics")
                        .icon("Smartphone")
                        .iconType("lucide")
                        .description("Mobiles, Laptops, Audio & Accessories")
                        .badgeColor("#3b82f6")
                        .displayOrder(1)
                        .featured(true)
                        .status("active")
                        .createdAt(LocalDateTime.now())
                        .build(),
                    Category.builder()
                        .name("Fashion")
                        .slug("fashion")
                        .icon("Shirt")
                        .iconType("lucide")
                        .description("Clothing, Footwear & Trending Apparel")
                        .badgeColor("#ec4899")
                        .displayOrder(2)
                        .featured(true)
                        .status("active")
                        .createdAt(LocalDateTime.now())
                        .build(),
                    Category.builder()
                        .name("Health & Beauty")
                        .slug("health")
                        .icon("Heart")
                        .iconType("lucide")
                        .description("Cosmetics, Skincare & Wellness")
                        .badgeColor("#10b981")
                        .displayOrder(3)
                        .featured(true)
                        .status("active")
                        .createdAt(LocalDateTime.now())
                        .build(),
                    Category.builder()
                        .name("Food & Grocery")
                        .slug("grocery")
                        .icon("ShoppingBag")
                        .iconType("lucide")
                        .description("Daily Essentials, Gourmet & Fresh Foods")
                        .badgeColor("#f59e0b")
                        .displayOrder(4)
                        .featured(true)
                        .status("active")
                        .createdAt(LocalDateTime.now())
                        .build(),
                    Category.builder()
                        .name("Travel & Flights")
                        .slug("travel")
                        .icon("Plane")
                        .iconType("lucide")
                        .description("Flights, Hotels, Holidays & Cab Bookings")
                        .badgeColor("#8b5cf6")
                        .displayOrder(5)
                        .featured(true)
                        .status("active")
                        .createdAt(LocalDateTime.now())
                        .build(),
                    Category.builder()
                        .name("Gaming & Consoles")
                        .slug("gaming")
                        .icon("Gamepad2")
                        .iconType("lucide")
                        .description("Video Games, Consoles & PC Gear")
                        .badgeColor("#ef4444")
                        .displayOrder(6)
                        .featured(false)
                        .status("active")
                        .createdAt(LocalDateTime.now())
                        .build()
                ));
                System.out.println("Sample categories seeded successfully");
            }
            
            // Seed Conversions
            if (conversionRepository.count() == 0) {
                conversionRepository.saveAll(List.of(
                    Conversion.builder()
                        .subId("SUB-9X21B")
                        .clickId("CLK-2026A1")
                        .commission(150.50)
                        .status("approved")
                        .userName("Alice Sharma")
                        .network("Admitad")
                        .date(LocalDate.now().minusDays(2))
                        .build(),
                    Conversion.builder()
                        .subId("SUB-3C44M")
                        .clickId("CLK-2026B2")
                        .commission(45.00)
                        .status("pending")
                        .userName("Bob Singh")
                        .network("Cuelinks")
                        .date(LocalDate.now().minusDays(1))
                        .build(),
                    Conversion.builder()
                        .subId("SUB-1L99Z")
                        .clickId("CLK-2026C3")
                        .commission(12.75)
                        .status("rejected")
                        .userName("Alice Sharma")
                        .network("Admitad")
                        .date(LocalDate.now())
                        .build()
                ));
                System.out.println("Sample conversions seeded successfully");
            }

            if (productRepository.count() == 0) {
                productRepository.saveAll(List.of(
                        Product.builder()
                                .name("boAt Rockerz 450 Bluetooth Headphones")
                                .description("Wireless on-ear headphones with mic and up to 30 hours playback.")
                                .price(1499.00)
                                .discountPrice(999.00)
                                .category("electronics")
                                .brand("boAt")
                                .image("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300")
                                .affiliateUrl("https://affiliate.example.com/boat-rockerz")
                                .platform("Amazon")
                                .cashbackValue(10.0)
                                .status("active")
                                .build(),
                        Product.builder()
                                .name("Adidas UltraBoost 22 Running Shoes")
                                .description("Responsive running shoes designed for comfort and energy return.")
                                .price(17999.00)
                                .discountPrice(11999.00)
                                .category("fashion")
                                .brand("Adidas")
                                .image("https://images.unsplash.com/photo-1528701800489-20fd40f8b08d?w=300")
                                .affiliateUrl("https://affiliate.example.com/adidas-ultraboost")
                                .platform("Myntra")
                                .cashbackValue(12.0)
                                .status("active")
                                .build(),
                        Product.builder()
                                .name("HP Pavilion Touchscreen Laptop")
                                .description("High-performance laptop with touchscreen, Intel Core processor, and SSD storage.")
                                .price(65990.00)
                                .discountPrice(54990.00)
                                .category("electronics")
                                .brand("HP")
                                .image("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300")
                                .affiliateUrl("https://affiliate.example.com/hp-pavilion")
                                .platform("Flipkart")
                                .cashbackValue(8.5)
                                .status("active")
                                .build(),
                        Product.builder()
                                .name("Cetaphil Daily Facial Cleanser")
                                .description("Gentle skin cleanser for all skin types with fragrance-free formula.")
                                .price(599.00)
                                .discountPrice(449.00)
                                .category("health")
                                .brand("Cetaphil")
                                .image("https://images.unsplash.com/photo-1546554137-f86b9593a2e7?w=300")
                                .affiliateUrl("https://affiliate.example.com/cetaphil-cleanser")
                                .platform("Nykaa Beauty")
                                .cashbackValue(7.0)
                                .status("active")
                                .build()
                ));
                System.out.println("Sample products seeded successfully");
            }

            storeRepository.deleteAll();
            storeRepository.saveAll(List.of(
                    Store.builder()
                            .name("Amazon")
                            .logo("https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg")
                            .cashbackRate("8%")
                            .description("Up to 8% rewards on electronics, fashion, and home appliances.")
                            .category("electronics")
                            .isPopular(true)
                            .coupons(List.of(
                                Coupon.builder().id("c1").title("Flat 10% Off on Electronics").description("Use HDFC credit cards to get an instant 10% discount.").code("HDFC10").expiry("Valid till month end").build(),
                                Coupon.builder().id("c2").title("Up to 40% Off on Daily Essentials").description("Save big on Amazon Pantry.").code(null).expiry("Ongoing").build()
                            ))
                            .build(),
                    Store.builder()
                            .name("Flipkart")
                            .logo("https://www.google.com/s2/favicons?sz=256&domain=flipkart.com")
                            .cashbackRate("10.5%")
                            .description("Grab exclusive rewards on mobile phones, fashion, and beauty products.")
                            .category("electronics")
                            .isPopular(true)
                            .coupons(List.of(
                                Coupon.builder().id("c3").title("Big Billion Days Preview").description("Extra 5% cashback on Flipkart Axis Bank Card.").code(null).expiry("Limited time").build()
                            ))
                            .build(),
                    Store.builder()
                            .name("Myntra")
                            .logo("https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png")
                            .cashbackRate("12%")
                            .description("Earn massive cashback on premium clothing, footwear, and accessories.")
                            .category("fashion")
                            .isPopular(true)
                            .coupons(List.of(
                                Coupon.builder().id("c4").title("Flat Rs. 500 Off on First Order").description("Valid on minimum purchase of Rs. 1499.").code("MYNTRA500").expiry("For New Users").build(),
                                Coupon.builder().id("c5").title("Up to 70% Off on Men's Wear").description("End of Reason Sale preview deals.").code(null).expiry("Valid till stocks last").build()
                            ))
                            .build(),
                    Store.builder()
                            .name("Ajio")
                            .logo("https://www.google.com/s2/favicons?sz=256&domain=ajio.com")
                            .cashbackRate("15%")
                            .description("Highest cashback rates on trending fashion collections.")
                            .category("fashion")
                            .isPopular(true)
                            .build(),
                    Store.builder()
                            .name("Nykaa")
                            .logo("https://www.google.com/s2/favicons?sz=256&domain=nykaa.com")
                            .cashbackRate("7%")
                            .description("Best offers on makeup, skincare, and health products.")
                            .category("health")
                            .isPopular(false)
                            .build()
            ));
            System.out.println("Sample stores with coupons seeded successfully");

            if (dealRepository.count() == 0) {
                dealRepository.saveAll(List.of(
                    Deal.builder()
                        .name("boAt Rockerz 450 Bluetooth On-Ear Headphones with Mic")
                        .image("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300")
                        .offerText("Up to 50% Off")
                        .link("https://amazon.in/dp/example")
                        .cashback("10%")
                        .status("active")
                        .comparisons(List.of(
                            Deal.DealComparison.builder()
                                .platform("Amazon")
                                .listedPrice(999.00)
                                .cashbackPercent(10.0)
                                .link("https://amazon.in/dp/example")
                                .build()
                        ))
                        .build(),
                    Deal.builder()
                        .name("Adidas UltraBoost 22 Performance Athletic Sports Shoes")
                        .image("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300")
                        .offerText("Flat 30% Off")
                        .link("https://myntra.com/shoes/example")
                        .cashback("12%")
                        .status("active")
                        .comparisons(List.of(
                            Deal.DealComparison.builder()
                                .platform("Myntra")
                                .listedPrice(11999.00)
                                .cashbackPercent(12.0)
                                .link("https://myntra.com/shoes/example")
                                .build()
                        ))
                        .build()
                ));
                System.out.println("Sample deals seeded successfully");
            }
        } catch (Exception e) {
            System.out.println("Database seed skipped because MongoDB is not reachable or not configured correctly");
            e.printStackTrace();
        }
    }
}