# Phase 13B Curl Test Commands

## Test 1: Material cost < 1 THB => 400 Bad Request
```bash
curl -X POST http://127.0.0.1:8002/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cheap Material",
    "sku": "CHEAP-MAT",
    "product_type": "material",
    "cost": 0.50,
    "unit": "kg"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```
Expected: HTTP 400 with validation error "Material cost must be >= 1.00 THB"

## Test 2: ADJUST by manager => 403 Forbidden  
```bash
curl -X POST http://127.0.0.1:8002/inventory/adjustments \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "adjustment": -5,
    "note": "Damage adjustment"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```
Expected: HTTP 403 with "Only owners can adjust stock quantities"

## Test 3: RECEIVE increases stock balance
```bash
# First create a product
curl -X POST http://127.0.0.1:8002/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Steel Bar 12mm",
    "sku": "STL-12MM",
    "product_type": "material",
    "cost": 15.75,
    "unit": "meter"
  }'

# Then RECEIVE stock
curl -X POST http://127.0.0.1:8002/inventory/movements \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "movement_type": "RECEIVE",
    "quantity": 50,
    "note": "Initial inventory"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Check stock balance
curl http://127.0.0.1:8002/inventory/products/1/stock \
  -w "\nHTTP Status: %{http_code}\n"
```
Expected: HTTP 200, balance_after: 50, on_hand: 50