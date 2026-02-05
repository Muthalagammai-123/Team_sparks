const fs = require('fs');
const path = require('path');

async function testGroq() {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    });

    const apiKey = env['XAI_API_KEY'] || env['GROQ_API_KEY'];
    console.log('Using API Key starting with:', apiKey?.substring(0, 10));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello in JSON format' }],
            response_format: { type: 'json_object' }
        })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

    fs.writeFileSync('groq_test_result.txt', `Status: ${response.status}\nResponse: ${text}`, 'utf8');
}

testGroq();
