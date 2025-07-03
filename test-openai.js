import OpenAI from 'openai';

// Test OpenAI API connection
async function testOpenAI() {
  try {
    console.log('Testing OpenAI API connection...');
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 7) + '...');
    
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use cheaper model for testing
      messages: [
        {
          role: "user",
          content: "Say 'Hello, this is a test!' in one sentence."
        }
      ],
      max_tokens: 50
    });

    console.log('✅ OpenAI API test successful!');
    console.log('Response:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('❌ OpenAI API test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    return false;
  }
}

testOpenAI();