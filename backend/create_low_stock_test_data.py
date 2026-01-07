# Create Low Stock Test Data
# Adds products with low stock levels for testing the low stock alert system

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Product, StockBalance

def create_low_stock_test_data():
    """Create test products with low stock levels"""
    db = SessionLocal()
    try:
        # Test products with low stock
        test_products = [
            {"name": "Test Low Stock Item 1", "sku": "LOW-001", "product_type": "PRODUCT", "category": "Test", "unit": "pcs", "cost": 5.0, "price": 8.0, "stock": 3},
            {"name": "Test Low Stock Item 2", "sku": "LOW-002", "product_type": "MATERIAL", "category": "Test", "unit": "kg", "cost": 12.0, "price": 15.0, "stock": 1},
            {"name": "Test Low Stock Item 3", "sku": "LOW-003", "product_type": "CONSUMABLE", "category": "Test", "unit": "pcs", "cost": 2.0, "price": 3.0, "stock": 7},
            {"name": "Test Normal Stock Item", "sku": "NORM-001", "product_type": "PRODUCT", "category": "Test", "unit": "pcs", "cost": 10.0, "price": 15.0, "stock": 50}
        ]

        created_count = 0
        for product_data in test_products:
            # Check if product already exists
            existing = db.query(Product).filter(Product.sku == product_data["sku"]).first()
            if existing:
                print(f"Product {product_data['sku']} already exists, skipping...")
                continue

            # Create product
            product = Product(
                name=product_data["name"],
                sku=product_data["sku"],
                product_type=product_data["product_type"],
                category=product_data["category"],
                unit=product_data["unit"],
                cost=product_data["cost"],
                price=product_data["price"],
                created_by="test_script"
            )
            db.add(product)
            db.flush()  # Get the product ID

            # Create stock balance
            stock_balance = StockBalance(
                product_id=product.id,
                on_hand=product_data["stock"],
                last_movement_id=None
            )
            db.add(stock_balance)
            created_count += 1

        db.commit()
        print(f"✅ Created {created_count} test products with low stock data")
        
        # Show low stock summary
        low_stock_products = db.query(Product).join(StockBalance).filter(StockBalance.on_hand < 10).all()
        print(f"📊 Total products with stock < 10: {len(low_stock_products)}")
        for product in low_stock_products:
            print(f"   - {product.name}: {product.stock_balance.on_hand} {product.unit}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_low_stock_test_data()