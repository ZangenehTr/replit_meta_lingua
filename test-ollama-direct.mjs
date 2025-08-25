import axios from 'axios';

const OLLAMA_HOST = 'http://45.89.239.250:11434';
const MODEL = 'llama3.2:3b';

console.log('Testing Direct Ollama Connection...\n');

async function testOllama() {
  try {
    // Test 1: Check if Ollama is accessible
    console.log('1. Checking Ollama availability...');
    const tagsResponse = await axios.get(`${OLLAMA_HOST}/api/tags`, {
      timeout: 30000
    });
    console.log('✅ Ollama is accessible');
    console.log('   Available models:', tagsResponse.data.models?.map(m => m.name).join(', ') || 'None');
    
    // Test 2: Generate a simple completion
    console.log('\n2. Testing text generation...');
    const generateResponse = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: MODEL,
      prompt: 'What is the capital of France? Answer in one word.',
      stream: false,
      temperature: 0.1
    }, {
      timeout: 60000
    });
    
    console.log('✅ Text generation successful');
    console.log('   Response:', generateResponse.data.response);
    
    // Test 3: Generate JSON response
    console.log('\n3. Testing JSON generation...');
    const jsonResponse = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: MODEL,
      prompt: 'List 3 common English greetings',
      system: 'You are a helpful assistant. Always respond with valid JSON. Example: {"greetings": ["hello", "hi", "hey"]}',
      stream: false,
      temperature: 0.1
    }, {
      timeout: 60000
    });
    
    console.log('✅ JSON generation successful');
    console.log('   Response:', jsonResponse.data.response);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(jsonResponse.data.response);
      console.log('   ✅ Valid JSON:', parsed);
    } catch (e) {
      console.log('   ⚠️ Response is not valid JSON');
    }
    
    console.log('\n✅ All Ollama tests passed!');
    
  } catch (error) {
    console.error('\n❌ Ollama test failed:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('   Timeout - server is too slow to respond');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused - server may be down');
    } else if (error.response) {
      console.error('   Server error:', error.response.status, error.response.statusText);
    }
  }
}

testOllama();