/**
 * Simple test to verify Products API integration
 * Tests that the frontend can communicate with the backend properly
 */

// Test API endpoint directly
const testProductsAPI = async () => {
  console.log('🧪 Testing Products API Integration...')
  console.log('Backend URL:', 'http://127.0.0.1:8001')
  console.log('Products Endpoint:', '/inventory/products')
  console.log('---')

  try {
    const response = await fetch('http://127.0.0.1:8001/inventory/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`✅ Response Status: ${response.status}`)
    console.log(`✅ Response OK: ${response.ok}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Data received: ${Array.isArray(data) ? data.length : 0} products`)
      console.log('📦 Sample data structure:', data[0] || 'No products found (empty array)')
      
      // Test the frontend transformation function
      if (typeof transformProductData !== 'undefined') {
        const transformed = transformProductData(data)
        console.log('🔄 Transformed data:', transformed.length, 'items')
      }
      
      return { success: true, data, status: response.status }
    } else {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
      return { success: false, error: `${response.status} ${response.statusText}`, status: response.status }
    }
    
  } catch (error) {
    console.error(`❌ Network Error:`, error.message)
    return { success: false, error: error.message, status: 0 }
  }
}

// Test role-based data shaping
const testRoleShaping = (products) => {
  console.log('\n🧪 Testing Role-based Data Shaping...')
  
  if (typeof shapeProductsByRole === 'undefined') {
    console.log('⚠️ shapeProductsByRole function not available')
    return
  }

  const roles = ['owner', 'manager', 'staff']
  const sampleProduct = {
    id: 1,
    name: 'Test Product',
    sku: 'TEST-001',
    type: 'product',
    category: 'Test',
    unit: 'pcs',
    price: 100.00,
    cost: 50.00,
    status: 'active',
    image: 'https://via.placeholder.com/100',
    stockLevel: 25,
    minStockLevel: 10,
    location: 'Test Location',
    supplier: 'Test Supplier'
  }

  roles.forEach(role => {
    const shaped = shapeProductsByRole([sampleProduct], role)
    const product = shaped[0]
    console.log(`📋 ${role.toUpperCase()} sees:`)
    console.log(`   - Price: ${product.price !== undefined ? '$' + product.price : 'Hidden'}`)
    console.log(`   - Cost: ${product.cost !== undefined ? '$' + product.cost : 'Hidden'}`)
    console.log(`   - Margin: ${product.margin !== undefined ? product.margin + '%' : 'Hidden'}`)
  })
}

// Run tests when page loads
window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting Products Integration Tests...')
  console.log('Time:', new Date().toLocaleTimeString())
  console.log('='.repeat(50))
  
  // Test API
  testProductsAPI().then(result => {
    console.log('\n📊 Test Results:')
    console.log('API Test:', result.success ? '✅ PASSED' : '❌ FAILED')
    if (!result.success) {
      console.log('Error:', result.error)
    }
    
    // Test role shaping with sample data
    testRoleShaping()
    
    console.log('\n' + '='.repeat(50))
    console.log('🎯 Test Summary:')
    console.log('- Backend API:', result.success ? '✅ Connected' : '❌ Failed')
    console.log('- Status Code:', result.status)
    console.log('- Products Found:', result.success ? (result.data?.length || 0) : 'N/A')
    console.log('\n📝 Manual Test: Open DevTools Console to see results')
    console.log('🔗 Navigate to Products page to test UI integration')
  })
})