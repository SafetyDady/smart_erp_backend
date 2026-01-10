# Stock Movement Contract & Standards

## Overview

This document defines the standardized contract for stock movement operations in the Smart ERP system. All movement types now use consistent ID-based cost allocation to ensure data integrity and prevent future issues.

## Movement Type Standards

### RECEIVE
- **Purpose**: Receiving inventory from suppliers
- **Required Fields**: `product_id`, `qty_input`, `unit_input`, `unit_cost_input`
- **Cost Allocation**: None (inventory receiving)
- **Validation**: No cost allocation fields allowed

```json
{
  "product_id": 1,
  "movement_type": "RECEIVE",
  "qty_input": 10,
  "unit_input": "PCS",
  "unit_cost_input": 100.00,
  "note": "Purchase from supplier XYZ"
}
```

### ISSUE
- **Purpose**: Issuing inventory for general usage/sales
- **Required Fields**: `product_id`, `qty_input`, `cost_center_id`, `cost_element_id`
- **Cost Allocation**: Manual selection of cost center and cost element by ID
- **Validation**: Both cost_center_id and cost_element_id must be valid and active

```json
{
  "product_id": 1,
  "movement_type": "ISSUE",
  "qty_input": 5,
  "unit_input": "PCS",
  "cost_center_id": 2,
  "cost_element_id": 1,
  "note": "Issue for quality control testing"
}
```

### CONSUME
- **Purpose**: Consuming materials/components for production work orders
- **Required Fields**: `product_id`, `qty_input`, `work_order_id`, `cost_element_id`
- **Cost Allocation**: Cost center derived from work order, cost element manually selected
- **Validation**: Work order must be active (OPEN status), cost element must be valid

```json
{
  "product_id": 1,
  "movement_type": "CONSUME",
  "qty_input": 2,
  "unit_input": "PCS",
  "work_order_id": 1,
  "cost_element_id": 1,
  "note": "Consumption for work order W002"
}
```

## Breaking Changes & Migration

### Phase 12 Update - ISSUE Standardization

**Effective Date**: January 10, 2026

**Changes**:
1. ISSUE movements now require `cost_center_id` and `cost_element_id` (integer IDs)
2. Deprecated fields `cost_center` and `cost_element` (string codes) are no longer accepted
3. Backend will reject requests using deprecated fields with clear error messages

**Backward Compatibility**:
- Existing movement records remain unchanged
- Database still stores cost codes as strings for compatibility
- Only new API requests must use ID-based fields

**Migration Path**:
- All frontend applications must be updated to send IDs instead of codes
- Use dropdown selections with ID values from master data APIs
- No data migration required for existing records

## Validation Rules

### Cost Center Validation (ISSUE only)
```sql
SELECT id, code, name FROM cost_centers 
WHERE id = ? AND is_active = 1
```

### Cost Element Validation (ISSUE & CONSUME)
```sql
SELECT id, code, name FROM cost_elements 
WHERE id = ? AND is_active = 1
```

### Work Order Validation (CONSUME only)
```sql
SELECT id, wo_number, cost_center FROM work_orders 
WHERE id = ? AND status = 'OPEN'
```

## Error Handling

### Deprecated Field Usage
```json
{
  "detail": "cost_center field is deprecated. Use cost_center_id instead"
}
```

### Invalid ID References
```json
{
  "detail": "Invalid or inactive cost center ID: 999"
}
```

### Missing Required Fields
```json
{
  "detail": "cost_center_id is required for ISSUE movements"
}
```

## Frontend Implementation Guidelines

### Dropdown Data Sources
- Cost Centers: `GET /master-data/cost-centers?active=true`
- Cost Elements: `GET /master-data/cost-elements?active=true`
- Work Orders: `GET /stock/active-work-orders`

### Payload Construction
```javascript
// ISSUE Movement
if (movementType === 'ISSUE') {
  payload.cost_center_id = parseInt(selectedCostCenterId);
  payload.cost_element_id = parseInt(selectedCostElementId);
  // DO NOT send cost_center or cost_element strings
}

// CONSUME Movement
if (movementType === 'CONSUME') {
  payload.work_order_id = parseInt(selectedWorkOrderId);
  payload.cost_element_id = parseInt(selectedCostElementId);
  // cost_center will be derived from work_order
}
```

## Freeze Rules Compliance

This standardization complies with all existing freeze rules:

1. **CONSUME Logic Unchanged**: Work order cost center derivation remains the same
2. **No ADJUST Access**: ADJUST movements remain blocked in freeze phase
3. **Dropdown Enforcement**: No free-text entry for cost allocation fields
4. **Data Consistency**: ID-based validation prevents invalid cost allocations

## Testing Checklist

- [ ] RECEIVE movement creates without cost allocation
- [ ] ISSUE movement requires and validates cost_center_id + cost_element_id
- [ ] CONSUME movement requires work_order_id + cost_element_id
- [ ] Deprecated fields (cost_center/cost_element strings) are rejected
- [ ] Invalid IDs return proper error messages
- [ ] Work order cost center derivation works correctly
- [ ] Existing data remains accessible and unaffected

## Support & Troubleshooting

### Common Issues
1. **422 Validation Error**: Check that all required ID fields are provided and valid
2. **400 Deprecated Field**: Remove cost_center/cost_element string fields from payload
3. **404 Not Found**: Verify that referenced IDs exist and are active

### Contact
For technical issues with this contract implementation, refer to the development team or system architecture documentation.

---

**Document Version**: 1.0  
**Last Updated**: January 10, 2026  
**Next Review**: Phase 13 Planning