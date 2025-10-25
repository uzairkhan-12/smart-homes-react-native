// Test script to verify React Native compatibility
import { fetchWithTimeout } from '../utils/fetch';

export async function testMobileCompatibility() {
  console.log('🧪 Testing mobile compatibility...');
  
  try {
    // Test basic timeout functionality
    console.log('Testing fetchWithTimeout...');
    
    const response = await fetchWithTimeout('http://192.168.100.216:8080/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ fetchWithTimeout works:', data);
      return true;
    } else {
      console.log('❌ Response not OK:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ fetchWithTimeout failed:', error);
    return false;
  }
}

// Test function for light control
export async function testLightControl(entityId: string = 'light.boarda_buttonswitch_a') {
  console.log('🔆 Testing light control...');
  
  try {
    const response = await fetchWithTimeout('http://192.168.100.216:8080/ha-api/services/light/turn_on', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZGIwM2M1Y2Y2ZWI0MGFmYjNhMTUxNmU0Mzk4ZGQxOSIsImlhdCI6MTc1NzgwNDAxMiwiZXhwIjoyMDczMTY0MDEyfQ.bhrLV6mhfbVnhr7cuwyncUq1R_0SYT6RDWlHPRveZ1A',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entity_id: entityId }),
      timeout: 10000
    });
    
    if (response.ok) {
      console.log('✅ Light control works!');
      return true;
    } else {
      console.log('❌ Light control failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Light control error:', error);
    return false;
  }
}