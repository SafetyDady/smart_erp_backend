"""
Create Default Warehouse and Zones
Migration script for setting up initial warehouse structure
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Warehouse, Zone, ZoneType

def create_default_warehouse():
    """Create default warehouse with standard zones"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if default warehouse already exists
        existing_warehouse = db.query(Warehouse).filter(Warehouse.code == "MAIN").first()
        if existing_warehouse:
            print("✅ Default warehouse already exists")
            return
        
        # Create default warehouse
        warehouse = Warehouse(
            code="MAIN",
            name="Main Warehouse",
            description="Primary warehouse for main operations",
            warehouse_type="MAIN"
        )
        db.add(warehouse)
        db.flush()  # Get warehouse ID
        
        print(f"✅ Created warehouse: {warehouse.code} - {warehouse.name}")
        
        # Create standard zones
        standard_zones = [
            {
                "zone_type": ZoneType.RECEIVING,
                "name": "Receiving Bay",
                "description": "Incoming goods receiving area"
            },
            {
                "zone_type": ZoneType.QC_HOLD,
                "name": "Quality Control Hold",
                "description": "Quality control inspection area"
            },
            {
                "zone_type": ZoneType.STORAGE,
                "name": "Main Storage",
                "description": "Primary storage area for available stock"
            },
            {
                "zone_type": ZoneType.PICK,
                "name": "Picking Area",
                "description": "Order picking and preparation area"
            },
            {
                "zone_type": ZoneType.DISPATCH,
                "name": "Dispatch Area",
                "description": "Ready to ship staging area"
            },
            {
                "zone_type": ZoneType.SCRAP,
                "name": "Scrap Area",
                "description": "Damaged or unusable items area"
            }
        ]
        
        zones_created = 0
        for zone_data in standard_zones:
            zone = Zone(
                warehouse_id=warehouse.id,
                zone_type=zone_data["zone_type"],
                name=zone_data["name"],
                description=zone_data["description"]
            )
            db.add(zone)
            zones_created += 1
            print(f"  ✅ Created zone: {zone_data['zone_type'].value} - {zone_data['name']}")
        
        db.commit()
        print(f"🎉 Successfully created default warehouse with {zones_created} zones")
        
        # Show zone mapping for reference
        print("\n📍 Zone Mapping:")
        print("  RECEIVING → Received")
        print("  QC_HOLD → In QC")
        print("  STORAGE → Available")
        print("  PICK → Available")
        print("  DISPATCH → Ready to Dispatch")
        print("  SCRAP → Not Usable")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating default warehouse: {str(e)}")
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    print("🏗️ Creating default warehouse and zones...")
    create_default_warehouse()
    print("✅ Done!")