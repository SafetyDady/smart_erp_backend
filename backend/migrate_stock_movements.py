#!/usr/bin/env python3
"""
Database Migration Script - Stock Movements
Add unit conversion columns to stock_movements table
"""
import sqlite3
import os

def migrate_stock_movements():
    db_path = "smart_erp.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database {db_path} not found")
        return False
        
    print(f"🔄 Migrating stock_movements table: {db_path}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(stock_movements)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📋 Current columns: {columns}")
        
        # List of new columns to add
        new_columns = [
            ("qty_input", "DECIMAL(10,3)", "NOT NULL DEFAULT 0"),
            ("unit_input", "VARCHAR(10)", "NOT NULL DEFAULT 'PCS'"),
            ("multiplier_to_base", "DECIMAL(10,6)", "NOT NULL DEFAULT 1.0"),
            ("qty_base", "DECIMAL(10,3)", "NOT NULL DEFAULT 0"),
            ("unit_cost_input", "DECIMAL(10,4)", "NULL"),
            ("unit_cost_base", "DECIMAL(10,4)", "NULL"),
            ("value_total", "DECIMAL(12,2)", "NULL")
        ]
        
        # Add each column if not exists
        for col_name, col_type, col_constraint in new_columns:
            if col_name not in columns:
                print(f"➕ Adding {col_name} column...")
                cursor.execute(f"""
                    ALTER TABLE stock_movements 
                    ADD COLUMN {col_name} {col_type} {col_constraint}
                """)
                print(f"✅ {col_name} column added")
            else:
                print(f"ℹ️ {col_name} column already exists")
        
        # Update existing records with calculated values
        print("🔄 Updating existing stock movements...")
        
        # For existing movements, set input = base values and default multiplier
        cursor.execute("""
            UPDATE stock_movements 
            SET qty_input = quantity,
                unit_input = 'PCS',
                multiplier_to_base = 1.0,
                qty_base = quantity,
                unit_cost_input = NULL,
                unit_cost_base = NULL,
                value_total = NULL
            WHERE qty_input = 0 OR qty_input IS NULL
        """)
        
        affected_rows = cursor.rowcount
        print(f"✅ Updated {affected_rows} stock movements")
        
        # Commit changes
        conn.commit()
        
        # Verify final schema
        cursor.execute("PRAGMA table_info(stock_movements)")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"🎯 Final columns: {final_columns}")
        
        # Check sample data
        cursor.execute("""
            SELECT id, product_id, movement_type, qty_input, unit_input, qty_base, unit_cost_input, value_total 
            FROM stock_movements 
            LIMIT 3
        """)
        samples = cursor.fetchall()
        print(f"📊 Sample data: {samples}")
        
        conn.close()
        print("🎉 Stock movements migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    migrate_stock_movements()