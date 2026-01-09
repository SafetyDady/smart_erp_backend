"""
Safe Migration: Add work_order_id to stock_movements table
Created: 2026-01-09
Purpose: Enable CONSUME movements to be linked to Work Orders

This migration includes:
- Forward migration: Add work_order_id column
- Rollback capability: Remove work_order_id column  
- Data integrity checks
- Safe error handling
"""

import sys
import os
from datetime import datetime

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from sqlalchemy import create_engine, text, Column, Integer, ForeignKey, inspect
from sqlalchemy.orm import sessionmaker
from app.database import DATABASE_URL
from app.models import Base

def get_db_session():
    """Create database session"""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    return Session(), engine

def check_column_exists(engine, table_name, column_name):
    """Check if column already exists"""
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    return any(col['name'] == column_name for col in columns)

def migration_forward():
    """Add work_order_id column to stock_movements table"""
    print("🔄 Starting forward migration: Add work_order_id column")
    
    session, engine = get_db_session()
    
    try:
        # Check if column already exists
        if check_column_exists(engine, 'stock_movements', 'work_order_id'):
            print("⚠️  Column 'work_order_id' already exists in stock_movements table")
            print("✅ Migration already applied - skipping")
            return True
            
        # Check if work_orders table exists
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if 'work_orders' not in tables:
            print("❌ Work Orders table does not exist")
            print("   Please ensure work_orders table exists before running this migration")
            return False
        
        # Add the column with foreign key constraint
        print("📝 Adding work_order_id column...")
        
        # For SQLite, we need to add column without constraint first
        if 'sqlite' in DATABASE_URL.lower():
            session.execute(text("ALTER TABLE stock_movements ADD COLUMN work_order_id INTEGER"))
            print("✅ work_order_id column added successfully")
        else:
            # For PostgreSQL
            session.execute(text("""
                ALTER TABLE stock_movements 
                ADD COLUMN work_order_id INTEGER 
                REFERENCES work_orders(id)
            """))
            print("✅ work_order_id column added with foreign key constraint")
        
        session.commit()
        
        # Verify the addition
        if check_column_exists(engine, 'stock_movements', 'work_order_id'):
            print("✅ Migration completed successfully")
            print("   - work_order_id column added to stock_movements")
            print("   - Column is nullable (allows existing records)")
            return True
        else:
            print("❌ Migration verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        session.rollback()
        return False
    finally:
        session.close()

def migration_rollback():
    """Remove work_order_id column from stock_movements table"""
    print("🔄 Starting rollback migration: Remove work_order_id column")
    
    session, engine = get_db_session()
    
    try:
        # Check if column exists
        if not check_column_exists(engine, 'stock_movements', 'work_order_id'):
            print("⚠️  Column 'work_order_id' does not exist in stock_movements table")
            print("✅ Rollback already applied - skipping")
            return True
        
        # Check if there are any CONSUME movements with work_order_id
        result = session.execute(text("""
            SELECT COUNT(*) as count 
            FROM stock_movements 
            WHERE work_order_id IS NOT NULL
        """))
        count = result.fetchone()[0]
        
        if count > 0:
            print(f"⚠️  Found {count} stock movements with work_order_id")
            response = input("Continue with rollback? This will lose work order associations (y/N): ")
            if response.lower() != 'y':
                print("❌ Rollback cancelled by user")
                return False
        
        # Remove the column
        print("📝 Removing work_order_id column...")
        
        if 'sqlite' in DATABASE_URL.lower():
            # SQLite doesn't support DROP COLUMN directly - need to recreate table
            print("🔄 SQLite detected - recreating table without work_order_id column")
            session.execute(text("PRAGMA foreign_keys=off"))
            
            # Create temporary table
            session.execute(text("""
                CREATE TABLE stock_movements_temp AS 
                SELECT id, product_id, movement_type, qty_input, unit_input, 
                       multiplier_to_base, qty_base, unit_cost_input, unit_cost_base,
                       value_total, quantity, balance_after, performed_by, performed_at,
                       created_at, note, reversal_of_id, reversed_at, reversed_by
                FROM stock_movements
            """))
            
            # Drop original table
            session.execute(text("DROP TABLE stock_movements"))
            
            # Rename temp table
            session.execute(text("ALTER TABLE stock_movements_temp RENAME TO stock_movements"))
            
            session.execute(text("PRAGMA foreign_keys=on"))
        else:
            # For PostgreSQL
            session.execute(text("ALTER TABLE stock_movements DROP COLUMN work_order_id"))
        
        session.commit()
        
        # Verify the removal
        if not check_column_exists(engine, 'stock_movements', 'work_order_id'):
            print("✅ Rollback completed successfully")
            print("   - work_order_id column removed from stock_movements")
            return True
        else:
            print("❌ Rollback verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        session.rollback()
        return False
    finally:
        session.close()

def main():
    """Main migration script"""
    print("=" * 60)
    print("📦 Smart ERP - Database Migration")
    print("   Add work_order_id to stock_movements")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python migrate_work_order_id.py forward   # Apply migration")
        print("  python migrate_work_order_id.py rollback  # Rollback migration")
        print("  python migrate_work_order_id.py status    # Check migration status")
        return
    
    command = sys.argv[1].lower()
    
    if command == 'forward':
        success = migration_forward()
        if success:
            print(f"\n🎉 Migration completed at {datetime.now()}")
        else:
            print(f"\n💥 Migration failed at {datetime.now()}")
            sys.exit(1)
            
    elif command == 'rollback':
        success = migration_rollback()
        if success:
            print(f"\n🎉 Rollback completed at {datetime.now()}")
        else:
            print(f"\n💥 Rollback failed at {datetime.now()}")
            sys.exit(1)
            
    elif command == 'status':
        session, engine = get_db_session()
        try:
            has_column = check_column_exists(engine, 'stock_movements', 'work_order_id')
            print(f"Migration status: {'✅ Applied' if has_column else '❌ Not applied'}")
            
            if has_column:
                result = session.execute(text("""
                    SELECT COUNT(*) as total, 
                           COUNT(work_order_id) as with_wo 
                    FROM stock_movements
                """))
                row = result.fetchone()
                print(f"Stock movements: {row[0]} total, {row[1]} with work orders")
        finally:
            session.close()
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()