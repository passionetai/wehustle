// script.js - Secure Production Version
let hustleOptions = [];
let hustleIndex = 0;
let nextClickCount = 0;

// Secure API Configuration
const GEMINI_CONFIG = {
  API_KEY: 'AIzaSyCoX-1KlUbGaztGYqq_I5OEC3MwEnPT40A', // 🔒 Replace with your valid key
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  PROMPT_TEMPLATE: city => `Generate 3 side hustles for ${city}. Format EXACTLY like:

Name: [Business Name]
Difficulty: [Easy/Medium/Hard]
Profitability: [$/month range]
Cost: [Initial cost]
Steps:
1. Step one
2. Step two
3. Step three
---
`
};

async function getHustle(city) {
  const outputDiv = document.getElementById('hustle-output');
  try {
    outputDiv.innerHTML = '<div class="loading">🔍 Scanning hustle opportunities in '+city+'...</div>';
    
    hustleOptions = await fetchHustleFromGemini(city);
    hustleIndex = 0;
    nextClickCount = 0;
    
    if (!hustleOptions.length) throw new Error('No hustles found');
    displayCurrentHustle();
  } catch (error) {
    console.error('Hustle Error:', error);
    outputDiv.innerHTML = `<div class="error">⚠️ ${error.message}. Showing example hustles.</div>`;
    hustleOptions = getFallbackHustles(city);
    displayCurrentHustle();
  }
}

async function fetchHustleFromGemini(city) {
  try {
    const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: GEMINI_CONFIG.PROMPT_TEMPLATE(city)
          }]
        }],
        safetySettings: [{
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.9
        }
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return parseHustles(rawText) || getFallbackHustles(city);
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to connect to hustle database');
  }
}

function parseHustles(rawText) {
  const hustles = [];
  const hustleBlocks = rawText.split('---').filter(b => b.trim());

  for (const block of hustleBlocks.slice(0, 3)) { // Only process first 3 hustles
    const lines = block.split('\n').filter(l => l.trim());
    const hustle = { name: '', difficulty: '', profitability: '', cost: '', steps: [] };

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch(key.trim().toLowerCase()) {
        case 'name':
          hustle.name = value;
          break;
        case 'difficulty':
          hustle.difficulty = value.replace(/[^a-zA-Z\/]/g, '');
          break;
        case 'profitability':
          hustle.profitability = value;
          break;
        case 'cost':
          hustle.cost = value.replace(/(?:^|\s)\$/g, '').trim();
          break;
        default:
          if (/^\d+\./.test(line.trim())) {
            hustle.steps.push(line.trim().replace(/^\d+\.\s*/, ''));
          }
      }
    }

    if (hustle.name && hustle.steps.length >= 3) {
      hustles.push(hustle);
    }
  }

  return hustles.length >= 2 ? hustles : null; // Require at least 2 valid hustles
}

// UI Functions
function displayCurrentHustle() {
  const outputDiv = document.getElementById('hustle-output');
  outputDiv.innerHTML = '';
  
  const currentHustle = hustleOptions[hustleIndex];
  const hustleCard = document.createElement('div');
  
  hustleCard.className = 'hustle-card';
  hustleCard.innerHTML = `
    <h3>${currentHustle.name}</h3>
    <div class="hustle-details">
      <p><strong>Difficulty:</strong> ${currentHustle.difficulty}</p>
      <p><strong>Profitability:</strong> $${currentHustle.profitability}/month</p>
      <p><strong>Initial Cost:</strong> $${currentHustle.cost}</p>
    </div>
    <div class="hustle-steps">
      <h4>Step-by-Step Guide:</h4>
      <ul>${currentHustle.steps.map(step => `<li>${step}</li>`).join('')}</ul>
    </div>
    <div class="card-actions">
      <button id="next-btn" class="city-btn">${nextClickCount >= 2 ? '🔒 Unlock More' : '🔄 New Idea'}</button>
    </div>
  `;

  outputDiv.appendChild(hustleCard);
  document.getElementById('next-btn').addEventListener('click', nextHustle);
}

function nextHustle() {
  nextClickCount++;
  
  if (nextClickCount < 3) {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * hustleOptions.length);
    } while (newIndex === hustleIndex);
    
    hustleIndex = newIndex;
    displayCurrentHustle();
  } else {
    window.location.href = '#';
    alert('🌟 Premium features coming soon! Stay tuned!');
  }
}

// Event Listeners
document.getElementById('get-hustle-btn').addEventListener('click', () => {
  const city = document.getElementById('city-input').value.trim();
  if (city) getHustle(city);
});

document.querySelectorAll('.city-btn').forEach(btn => {
  btn.addEventListener('click', () => getHustle(btn.dataset.city));
});

// Fallback Data (keep your existing getFallbackHustles implementation)