#!/usr/bin/env python3
"""
Migration: Add cost allocation fields to stock_movements table
SQLite-safe backwards compatible migration

Adds:
- cost_center TEXT NULL
- cost_element TEXT NULL  
- ref_type TEXT NULL
"""

import sqlite3
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

def migrate_cost_allocation():
    """Add cost allocation fields to stock_movements table"""
    db_path = "smart_erp.db"
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Starting cost allocation migration...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(stock_movements)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add cost_center column if it doesn't exist
        if 'cost_center' not in columns:
            cursor.execute("ALTER TABLE stock_movements ADD COLUMN cost_center TEXT NULL")
            print("✓ Added cost_center column")
        else:
            print("- cost_center column already exists")
        
        # Add cost_element column if it doesn't exist
        if 'cost_element' not in columns:
            cursor.execute("ALTER TABLE stock_movements ADD COLUMN cost_element TEXT NULL")
            print("✓ Added cost_element column")
        else:
            print("- cost_element column already exists")
            
        # Add ref_type column if it doesn't exist
        if 'ref_type' not in columns:
            cursor.execute("ALTER TABLE stock_movements ADD COLUMN ref_type TEXT NULL")
            print("✓ Added ref_type column")
        else:
            print("- ref_type column already exists")
        
        # Commit changes
        conn.commit()
        print("✓ Migration completed successfully")
        
        # Verify the changes
        cursor.execute("PRAGMA table_info(stock_movements)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"✓ Verified columns: {', '.join(columns)}")
        
    except sqlite3.Error as e:
        print(f"✗ Migration failed: {e}")
        return False
        
    finally:
        if conn:
            conn.close()
    
    return True

if __name__ == "__main__":
    if migrate_cost_allocation():
        print("\nMigration completed successfully!")
    else:
        print("\nMigration failed!")
        sys.exit(1)