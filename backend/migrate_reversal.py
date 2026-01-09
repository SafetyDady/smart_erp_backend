#!/usr/bin/env python3
"""
Database Migration - Add Reversal Columns
Add reversal tracking columns to stock_movements table
"""
import sqlite3
import os

def migrate_reversal_columns():
    db_path = "smart_erp.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database {db_path} not found")
        return False
        
    print(f"🔄 Adding reversal columns to stock_movements: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current schema
        cursor.execute("PRAGMA table_info(stock_movements)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📋 Current columns: {len(columns)} columns")
        
        # Add reversal columns if not exist
        new_columns = [
            ("reversal_of_id", "INTEGER", "NULL"),
            ("reversed_at", "DATETIME", "NULL"), 
            ("reversed_by", "VARCHAR(100)", "NULL")
        ]
        
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
        
        # Add foreign key index for reversal_of_id
        try:
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_movements_reversal 
                ON stock_movements(reversal_of_id)
            """)
            print("✅ Reversal index created")
        except Exception as e:
            print(f"⚠️ Index creation: {e}")
        
        conn.commit()
        
        # Verify final schema
        cursor.execute("PRAGMA table_info(stock_movements)")
        final_columns = [column[1] for column in cursor.fetchall()]
        print(f"🎯 Final columns: {len(final_columns)} columns")
        
        conn.close()
        print("🎉 Reversal columns migration completed!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    migrate_reversal_columns()