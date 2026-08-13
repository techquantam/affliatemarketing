import sys

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    stores_data = """
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
                        "listedPrice": 999.00,
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
                        "listedPrice": 11999.00,
                        "cashbackPercent": 12.0,
                        "link": "https://myntra.com/shoes/example"
                    }
                ]
            },
            {
                "_id": "d3",
                "name": "HP Pavilion 15.6\\\" Touchscreen Laptop (Intel Core i5, 16GB RAM)",
                "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300",
                "offerText": "Save Rs. 11,000",
                "link": "https://flipkart.com/laptop/example",
                "cashback": "8.5%",
                "status": "active",
                "createdAt": datetime.now(),
                "comparisons": [
                    {
                        "platform": "Flipkart",
                        "listedPrice": 54990.00,
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
                        "listedPrice": 449.00,
                        "cashbackPercent": 7.0,
                        "link": "https://nykaa.com/beauty/example"
                    }
                ]
            }
        ]
        db.deals.insert_many(deals)
        print(f"[✓] Created {len(deals)} deals")
"""

    if "db.products.insert_many(products)" in content:
        content = content.replace("db.products.insert_many(products)\n        print(f\"[✓] Created {len(products)} products\")", 
                                  "db.products.insert_many(products)\n        print(f\"[✓] Created {len(products)} products\")\n\n" + stores_data)
        
    with open(filename, 'w') as f:
        f.write(content)

process_file('init-db.py')
