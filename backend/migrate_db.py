#!/usr/bin/env python3
"""
Database Migration Script
Add base_unit and cost_per_base_unit columns to products table
"""
import sqlite3
import os

def migrate_database():
    db_path = "smart_erp.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database {db_path} not found")
        return False
        
    print(f"🔄 Migrating database: {db_path}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📋 Current columns: {columns}")
        
        # Add base_unit column if not exists
        if 'base_unit' not in columns:
            print("➕ Adding base_unit column...")
            cursor.execute("""
                ALTER TABLE products 
                ADD COLUMN base_unit VARCHAR(10) DEFAULT 'PCS'
            """)
            print("✅ base_unit column added")
        else:
            print("ℹ️ base_unit column already exists")
            
        # Add cost_per_base_unit column if not exists  
        if 'cost_per_base_unit' not in columns:
            print("➕ Adding cost_per_base_unit column...")
            cursor.execute("""
                ALTER TABLE products 
                ADD COLUMN cost_per_base_unit DECIMAL(10,4)
            """)
            print("✅ cost_per_base_unit column added")
        else:
            print("ℹ️ cost_per_base_unit column already exists")
            
        # Update existing products with default values
        print("🔄 Updating existing products...")
        cursor.execute("""
            UPDATE products 
            SET base_unit = 'PCS',
                cost_per_base_unit = cost
            WHERE base_unit IS NULL OR cost_per_base_unit IS NULL
        """)
        
        affected_rows = cursor.rowcount
        print(f"✅ Updated {affected_rows} products")
        
        # Commit changes
        conn.commit()
        
        # Verify final schema
        cursor.execute("PRAGMA table_info(products)")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"🎯 Final columns: {final_columns}")
        
        # Check sample data
        cursor.execute("SELECT id, name, base_unit, cost_per_base_unit FROM products LIMIT 3")
        samples = cursor.fetchall()
        print(f"📊 Sample data: {samples}")
        
        conn.close()
        print("🎉 Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    migrate_database()