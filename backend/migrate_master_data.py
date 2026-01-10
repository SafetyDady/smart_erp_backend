#!/usr/bin/env python3
"""
Migration: Add Cost Centers and Cost Elements master data tables
SQLite-safe backwards compatible migration
"""

import sqlite3
import sys
from pathlib import Path
from datetime import datetime

def migrate_master_data():
    """Add cost_centers and cost_elements master tables"""
    db_path = "smart_erp.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Starting master data migration...")
        
        # Create cost_centers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cost_centers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created cost_centers table")
        
        # Create cost_elements table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cost_elements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created cost_elements table")
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON cost_centers(code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON cost_centers(is_active)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cost_elements_code ON cost_elements(code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cost_elements_active ON cost_elements(is_active)")
        print("✓ Created indexes")
        
        # Insert some default data if tables are empty
        cursor.execute("SELECT COUNT(*) FROM cost_centers")
        cc_count = cursor.fetchone()[0]
        
        if cc_count == 0:
            default_cost_centers = [
                ('PROD01', 'Production Line 1'),
                ('PROD02', 'Production Line 2'),
                ('MAINT', 'Maintenance Department'),
                ('QC', 'Quality Control'),
                ('ADMIN', 'Administration')
            ]
            
            cursor.executemany(
                "INSERT INTO cost_centers (code, name) VALUES (?, ?)",
                default_cost_centers
            )
            print("✓ Inserted default cost centers")
        
        cursor.execute("SELECT COUNT(*) FROM cost_elements")
        ce_count = cursor.fetchone()[0]
        
        if ce_count == 0:
            default_cost_elements = [
                ('MATERIALS', 'Raw Materials'),
                ('SUPPLIES', 'Office Supplies'),
                ('REPAIRS', 'Maintenance & Repairs'),
                ('LABOR', 'Labor Costs'),
                ('OVERHEAD', 'General Overhead')
            ]
            
            cursor.executemany(
                "INSERT INTO cost_elements (code, name) VALUES (?, ?)",
                default_cost_elements
            )
            print("✓ Inserted default cost elements")
        
        conn.commit()
        print("✓ Migration completed successfully")
        
        # Verify the changes
        cursor.execute("SELECT COUNT(*) FROM cost_centers WHERE is_active = 1")
        active_cc = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM cost_elements WHERE is_active = 1")
        active_ce = cursor.fetchone()[0]
        
        print(f"✓ Active Cost Centers: {active_cc}")
        print(f"✓ Active Cost Elements: {active_ce}")
        
    except sqlite3.Error as e:
        print(f"✗ Migration failed: {e}")
        return False
        
    finally:
        if conn:
            conn.close()
    
    return True

if __name__ == "__main__":
    if migrate_master_data():
        print("\nMaster data migration completed successfully!")
    else:
        print("\nMaster data migration failed!")
        sys.exit(1)