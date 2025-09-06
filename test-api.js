// Simple test script to trigger the API and see logs
const testData = {
  formData: {
    birthday: "07/01/1967",
    investmentAmount: "130000", 
    retirementAge: "62",
    longevityEstimate: "100",
    retirementMonth: "1",
    retirementYear: "2030",
    username: "test@example.com",
    password: "testpassword"
  }
};

// Replace with your actual Vercel deployment URL
const VERCEL_URL = "https://your-deployment-url.vercel.app";

async function testAPI() {
  try {
    console.log("🚀 Testing API call to trigger debug logs...");
    
    const response = await fetch(`${VERCEL_URL}/api/vercfunctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log("📊 Response:", result);
    
    if (!response.ok) {
      console.log("❌ Error response - check Vercel logs for debug output");
    } else {
      console.log("✅ Success - check Vercel logs for debug output");
    }
    
  } catch (error) {
    console.error("🔥 Network error:", error);
    console.log("💡 Check Vercel logs for server-side debug output");
  }
}

// Uncomment and update the URL to test
// testAPI();

console.log(`
🔍 HOW TO VIEW LOGS:

1. WEB DASHBOARD:
   - Go to https://vercel.com
   - Select your project: nextjs-boilerplate  
   - Click "Functions" or "Deployments"
   - Click on /api/vercfunctions function
   - Click "View Function Logs"

2. UPDATE THIS SCRIPT:
   - Replace VERCEL_URL with your actual deployment URL
   - Uncomment the testAPI() call at the bottom
   - Run: node test-api.js

3. FIND YOUR DEPLOYMENT URL:
   - In Vercel dashboard -> Deployments -> latest deployment
   - Copy the URL (like: https://nextjs-boilerplate-abc123.vercel.app)
`);
