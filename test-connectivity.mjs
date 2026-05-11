import fetch from 'node-fetch';

async function test() {
  console.log('Testing connectivity to api.openai.com...');
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data received (first 2 models):', JSON.stringify(data.data?.slice(0, 2)));
  } catch (err) {
    console.error('Error connecting to OpenAI:', err.message);
    if (err.code) console.error('Error code:', err.code);
  }
}

test();
