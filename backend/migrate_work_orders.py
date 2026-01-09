#!/usr/bin/env python3
"""
Work Orders table migration
Creates work_orders table for MVP implementation
"""
import sqlite3
from pathlib import Path

def create_work_orders_table():
    """Create work_orders table"""
    db_path = Path(__file__).parent / "smart_erp.db"
    
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        
        # Create work_orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS work_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wo_number TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'OPEN',
                cost_center TEXT NOT NULL,
                cost_element TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME
            )
        """)
        
        # Create index for faster queries
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wo_number ON work_orders(wo_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_status ON work_orders(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON work_orders(created_at)")
        
        conn.commit()
        print("✓ work_orders table created successfully")

if __name__ == "__main__":
    create_work_orders_table()
    print("Work Orders migration completed")