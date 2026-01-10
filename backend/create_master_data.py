#!/usr/bin/env python3
"""
Create master data: Cost Centers and Cost Elements
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, CostCenter, CostElement

def create_master_data():
    """Create cost centers and cost elements"""
    
    # Database connection
    engine = create_engine("sqlite:///smart_erp.db")
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("Creating master data...")
        
        # Check if already exists
        existing_cc = db.query(CostCenter).count()
        if existing_cc > 0:
            print(f"Cost centers already exist ({existing_cc} records). Skipping...")
            return
            
        # Cost Centers
        cost_centers = [
            CostCenter(code="0111", name="Production"),
            CostCenter(code="0112", name="Quality Control"),
            CostCenter(code="0121", name="Maintenance"),
            CostCenter(code="0131", name="Research & Development"),
            CostCenter(code="0211", name="Sales"),
            CostCenter(code="0212", name="Marketing"),
            CostCenter(code="0311", name="Administration"),
            CostCenter(code="0312", name="Human Resources")
        ]
        
        for cc in cost_centers:
            db.add(cc)
        
        # Cost Elements
        cost_elements = [
            CostElement(code="4100", name="Direct Material"),
            CostElement(code="4200", name="Direct Labor"),
            CostElement(code="4300", name="Manufacturing Overhead"),
            CostElement(code="5100", name="Utilities"),
            CostElement(code="5200", name="Maintenance & Repair"),
            CostElement(code="5300", name="Supplies"),
            CostElement(code="6100", name="Salaries"),
            CostElement(code="6200", name="Benefits"),
            CostElement(code="7100", name="Depreciation"),
            CostElement(code="7200", name="Training")
        ]
        
        for ce in cost_elements:
            db.add(ce)
        
        db.commit()
        
        print(f"✅ Created {len(cost_centers)} cost centers")
        print(f"✅ Created {len(cost_elements)} cost elements")
        print("\nMaster data created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating master data: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_master_data()