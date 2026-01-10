#!/usr/bin/env python3
"""
Create demo products for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Product

def create_demo_products():
    """Create demo products"""
    
    # Database connection
    engine = create_engine("sqlite:///smart_erp.db")
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("Creating demo products...")
        
        # Check if already exists
        existing_products = db.query(Product).count()
        if existing_products > 0:
            print(f"Products already exist ({existing_products} records). Skipping...")
            return
            
        # Demo Products
        products = [
            Product(
                name="Widget A",
                sku="WGT-001",
                product_type="PRODUCT",
                category="Widgets",
                unit="pcs",
                base_unit="pcs",
                cost=10.0,
                cost_per_base_unit=10.0,
                price=15.0,
                created_by="1"
            ),
            Product(
                name="Material B",
                sku="MAT-001", 
                product_type="MATERIAL",
                category="Raw Materials",
                unit="kg",
                base_unit="kg",
                cost=5.0,
                cost_per_base_unit=5.0,
                price=None,
                created_by="1"
            ),
            Product(
                name="Consumable C",
                sku="CON-001",
                product_type="CONSUMABLE", 
                category="Supplies",
                unit="box",
                base_unit="pcs",
                cost=1.0,
                cost_per_base_unit=0.1,
                price=None,
                created_by="1"
            )
        ]
        
        for product in products:
            db.add(product)
        
        db.commit()
        
        print(f"✅ Created {len(products)} demo products")
        print("\nDemo products created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating demo products: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_products()