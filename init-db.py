#!/usr/bin/env python3
"""
MongoDB Database Initialization Script
Populates the affiliate_app database with initial test data including admin users
"""

from datetime import datetime, timedelta
from pymongo import MongoClient
try:
    from dotenv import load_dotenv
    base_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(base_dir, '.env'))
    load_dotenv(os.path.join(base_dir, 'backend', '.env'))
except ImportError:
    pass

# MongoDB Connection - Update with your Atlas connection string
MONGO_URI = os.getenv('MONGO_URI') or os.getenv('MONGODB_URI') or 'mongodb://localhost:27017/affiliate_db'

def init_database():
    """Initialize the database with test data"""
    try:
        print(f"[INFO] Connecting to MongoDB: {MONGO_URI}")
        client = MongoClient(MONGO_URI)
        db = client.affiliate_db
        
        # Clear existing collections
        print("[INFO] Clearing existing data...")
        db.users.delete_many({})
        db.products.delete_many({})
        db.tracked_orders.delete_many({})
        db.cashbacks.delete_many({})
        db.wallets.delete_many({})
        
        # Create admin users
        print("[INFO] Creating admin users...")
        admin_users = [
            {
                "_id": "admin001",
                "name": "Cyvanta Admin",
                "email": "admin@cyvanta.com",
                "passwordHash": "admin123",  # In production, this should be hashed
                "phone": "+91 9876543210",
                "referralCode": "ADMIN001",
                "referredBy": None,
                "role": "ADMIN",
                "status": "active",
                "createdAt": datetime.now(),
                "updatedAt": datetime.now()
            },
            {
                "_id": "admin002",
                "name": "Finance Admin",
                "email": "finance@cyvanta.com",
                "passwordHash": "admin123",
                "phone": "+91 8765432109",
                "referralCode": "ADMIN002",
                "referredBy": None,
                "role": "ADMIN",
                "status": "active",
                "createdAt": datetime.now(),
                "updatedAt": datetime.now()
            }
        ]
        
        db.users.insert_many(admin_users)
        print(f"[✓] Created {len(admin_users)} admin users")
        
        # Create regular users
        print("[INFO] Creating regular users...")
        regular_users = [
            {
                "_id": "u1",
                "name": "Rahul Sharma",
                "email": "rahul.sharma@gmail.com",
                "passwordHash": "user123",
                "phone": "+91 9876543210",
                "referralCode": "RAHUL50",
                "referredBy": None,
                "role": "USER",
                "status": "active",
                "sharedCommissionRate": None,
                "createdAt": datetime.now() - timedelta(days=50),
                "updatedAt": datetime.now()
            },
            {
                "_id": "u2",
                "name": "Sneha Patel",
                "email": "sneha.patel@gmail.com",
                "passwordHash": "user123",
                "phone": "+91 8765432109",
                "referralCode": "SNEHA12",
                "referredBy": "RAHUL50",
                "role": "USER",
                "status": "active",
                "sharedCommissionRate": None,
                "createdAt": datetime.now() - timedelta(days=45),
                "updatedAt": datetime.now()
            },
            {
                "_id": "u3",
                "name": "Amit Verma",
                "email": "amit.verma@gmail.com",
                "passwordHash": "user123",
                "phone": "+91 7654321098",
                "referralCode": "AMIT99",
                "referredBy": "RAHUL50",
                "role": "USER",
                "status": "active",
                "sharedCommissionRate": None,
                "createdAt": datetime.now() - timedelta(days=40),
                "updatedAt": datetime.now()
            },
            {
                "_id": "u4",
                "name": "Pooja Hegde",
                "email": "pooja.hegde@gmail.com",
                "passwordHash": "user123",
                "phone": "+91 6543210987",
                "referralCode": "POOJA45",
                "referredBy": "SNEHA12",
                "role": "USER",
                "status": "active",
                "sharedCommissionRate": None,
                "createdAt": datetime.now() - timedelta(days=38),
                "updatedAt": datetime.now()
            },
            {
                "_id": "u5",
                "name": "Rohan Joshi",
                "email": "rohan.joshi@gmail.com",
                "passwordHash": "user123",
                "phone": "+91 5432109876",
                "referralCode": "ROHAN88",
                "referredBy": None,
                "role": "USER",
                "status": "blocked",
                "sharedCommissionRate": None,
                "createdAt": datetime.now() - timedelta(days=30),
                "updatedAt": datetime.now()
            }
        ]
        
        db.users.insert_many(regular_users)
        print(f"[✓] Created {len(regular_users)} regular users")
        
        # Create products
        print("[INFO] Creating products...")
        products = [
            {
                "name": "boAt Rockerz 450 Bluetooth Headphones",
                "platform": "Amazon",
                "price": 29.99,
                "cashbackValue": 10.0,
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "name": "Adidas UltraBoost 22 Running Shoes",
                "platform": "Myntra",
                "price": 110.00,
                "cashbackValue": 12.0,
                "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "name": "HP Pavilion Touchscreen Laptop",
                "platform": "Flipkart",
                "price": 549.99,
                "cashbackValue": 8.5,
                "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300",
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "name": "Cetaphil Daily Facial Cleanser",
                "platform": "Nykaa Beauty",
                "price": 14.99,
                "cashbackValue": 7.0,
                "image": "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=300",
                "status": "active",
                "createdAt": datetime.now()
            }
        ]
        
        result = db.products.insert_many(products)
        print(f"[✓] Created {len(products)} products")


        # Create stores
        print("[INFO] Creating stores...")
        db.stores.delete_many({})
        stores = [
            {
                "_id": "amazon",
                "name": "Amazon",
                "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                "cashbackRate": "10%",
                "description": "Shop groceries, home equipment, kitchen essentials, and electronics with special cash bonuses.",
                "category": "grocery",
                "isPopular": True,
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "_id": "myntra",
                "name": "Myntra",
                "logo": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png",
                "cashbackRate": "12%",
                "description": "Explore trendy lifestyle collections, designer clothes, sports sneakers, and cosmetics.",
                "category": "fashion",
                "isPopular": True,
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "_id": "flipkart",
                "name": "Flipkart",
                "logo": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg",
                "cashbackRate": "8.5%",
                "description": "Leading platform for mobile electronics, large home appliances, books, and home decors.",
                "category": "electronics",
                "isPopular": True,
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "_id": "ajio",
                "name": "Ajio",
                "logo": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Ajio_Logo.svg",
                "cashbackRate": "15%",
                "description": "Sleek luxury fashion and handpicked streetwear brands from independent designers.",
                "category": "fashion",
                "isPopular": True,
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "_id": "nykaa",
                "name": "Nykaa Beauty",
                "logo": "https://upload.wikimedia.org/wikipedia/commons/5/5b/Nykaa_Logo.svg",
                "cashbackRate": "7%",
                "description": "Premium cosmetic brands, organic lipsticks, haircare, and skin treatment formulas.",
                "category": "health",
                "isPopular": False,
                "status": "active",
                "createdAt": datetime.now()
            },
            {
                "_id": "makemytrip",
                "name": "MakeMyTrip",
                "logo": "https://upload.wikimedia.org/wikipedia/commons/f/fb/MakeMyTrip_Logo.svg",
                "cashbackRate": "9%",
                "description": "Book domestic flights, international vacations, hotels, and intercity cab packages.",
                "category": "travel",
                "isPopular": False,
                "status": "active",
                "createdAt": datetime.now()
            }
        ]
        db.stores.insert_many(stores)
        print(f"[✓] Created {len(stores)} stores")
        
        # Create deals
        print("[INFO] Creating deals...")
        db.deals.delete_many({})
        deals = [
            {
                "_id": "d1",
                "name": "boAt Rockerz 450 Bluetooth On-Ear Headphones with Mic",
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
                "offerText": "Up to 50% Off",
                "link": "https://amazon.in/dp/example",
                "cashback": "10%",
                "status": "active",
                "createdAt": datetime.now(),
                "comparisons": [
                    {
                        "platform": "Amazon",
                        "listedPrice": 29.99,
                        "cashbackPercent": 10.0,
                        "link": "https://amazon.in/dp/example"
                    }
                ]
            },
            {
                "_id": "d2",
                "name": "Adidas UltraBoost 22 Performance Athletic Sports Shoes",
                "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
                "offerText": "Flat 30% Off",
                "link": "https://myntra.com/shoes/example",
                "cashback": "12%",
                "status": "active",
                "createdAt": datetime.now(),
                "comparisons": [
                    {
                        "platform": "Myntra",
                        "listedPrice": 110.00,
                        "cashbackPercent": 12.0,
                        "link": "https://myntra.com/shoes/example"
                    }
                ]
            },
            {
                "_id": "d3",
                "name": "HP Pavilion 15.6\" Touchscreen Laptop (Intel Core i5, 16GB RAM)",
                "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300",
                "offerText": "Save $250",
                "link": "https://flipkart.com/laptop/example",
                "cashback": "8.5%",
                "status": "active",
                "createdAt": datetime.now(),
                "comparisons": [
                    {
                        "platform": "Flipkart",
                        "listedPrice": 549.99,
                        "cashbackPercent": 8.5,
                        "link": "https://flipkart.com/laptop/example"
                    }
                ]
            },
            {
                "_id": "d4",
                "name": "Cetaphil Daily Facial Cleanser - Hydrating Skincare Gel",
                "image": "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=300",
                "offerText": "15% Off",
                "link": "https://nykaa.com/beauty/example",
                "cashback": "7%",
                "status": "active",
                "createdAt": datetime.now(),
                "comparisons": [
                    {
                        "platform": "Nykaa Beauty",
                        "listedPrice": 14.99,
                        "cashbackPercent": 7.0,
                        "link": "https://nykaa.com/beauty/example"
                    }
                ]
            }
        ]
        db.deals.insert_many(deals)
        print(f"[✓] Created {len(deals)} deals")

        
        # Create wallets for users
        print("[INFO] Creating wallets...")
        wallets = [
            {
                "userId": "u1",
                "approvedBalance": 250.50,
                "pendingBalance": 120.75,
                "createdAt": datetime.now()
            },
            {
                "userId": "u2",
                "approvedBalance": 150.00,
                "pendingBalance": 45.50,
                "createdAt": datetime.now()
            },
            {
                "userId": "u3",
                "approvedBalance": 300.00,
                "pendingBalance": 200.00,
                "createdAt": datetime.now()
            },
            {
                "userId": "u4",
                "approvedBalance": 50.00,
                "pendingBalance": 25.00,
                "createdAt": datetime.now()
            },
            {
                "userId": "u5",
                "approvedBalance": 0.0,
                "pendingBalance": 0.0,
                "createdAt": datetime.now()
            }
        ]
        
        db.wallets.insert_many(wallets)
        print(f"[✓] Created {len(wallets)} wallets")
        
        # Create indexes
        print("[INFO] Creating database indexes...")
        db.users.create_index("email", unique=True)
        db.users.create_index("referralCode", unique=True)
        db.products.create_index("name")
        print("[✓] Indexes created")
        
        print("\n" + "="*50)
        print("✓ Database initialization completed successfully!")
        print("="*50)
        print("\nTest Admin Users:")
        print("  1. admin@cyvanta.com / admin123 (Main Admin)")
        print("  2. finance@cyvanta.com / admin123 (Finance Admin)")
        print("\nTest Users:")
        for user in regular_users:
            print(f"  • {user['email']} / user123 ({user['status']})")
        print("\n" + "="*50)
        
        client.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {str(e)}")
        return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)
