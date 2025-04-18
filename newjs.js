// --- Configuration and Globals ---
const GEMINI_CONFIG = {
  API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  API_KEY: "AIzaSyAd27ptuNgUsenf_vw2eQodBmm9kE-D8cE", // Replace with your actual key if needed
  IMAGE_API_URL: "https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent",
  IMAGE_API_KEY: "AIzaSyAd27ptuNgUsenf_vw2eQodBmm9kE-D8cE" // Replace if different
};

let currentDisplayedHustles = [];
let currentCity = "";
let previousHustleNames = [];
let scrollPosition = 0; // For mobile menu scroll lock

const diversityPrompt = `
DIVERSITY REQUIREMENTS: Generate hustles that are diverse across these dimensions:
- BUSINESS MODELS: Include variety (subscription, marketplace, service, product, etc.)
- TARGET AUDIENCES: Target different demographics (students, professionals, seniors, etc.)
- REVENUE STREAMS: Each hustle must have at least 3 distinct revenue streams
- AVOID SIMILARITY: No two hustles should have similar business models or target audiences

Ensure each hustle uses a different monetization strategy and appeals to a different audience.
`;

// --- Core Functions ---

function scrollToHustleOutput() {
  const e = document.getElementById("hustle-output");
  if (e) setTimeout(() => e.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

async function fetchHustleData(city) {
  if (window.searchInProgress) {
    console.log("Search already in progress, ignoring new request");
    return;
  }
  window.searchInProgress = true;
  try {
    showHustleLoading(city);
    const hustleOutput = document.getElementById("hustle-output");
    if (hustleOutput) {
      hustleOutput.style.display = "block";
      // scrollToHustleOutput(); // Removed: Scrolling is now handled in showHustleLoading
    }
    updateProgressBar();
    let hustleResults = await fetchHustleFromGemini(city);
    renderHustles(hustleResults, city, true, hustleOutput);
    document.querySelectorAll(".city-btn").forEach(btn => {
      if (btn.getAttribute("data-city") === city || btn.textContent.trim() === city) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  } catch (e) {
    console.error("Error in fetchHustleData:", e); // Log the actual error
    showError(e.message || "An unexpected error occurred fetching hustle data.");
  } finally {
    window.searchInProgress = false;
    // Re-enable buttons
    document.querySelectorAll(".city-btn, #get-hustle-btn, #refresh-btn, #more-diverse-btn").forEach(btn => {
        if(btn) {
            btn.disabled = false;
            btn.style.cursor = "pointer";
            btn.classList.remove("loading");
            // Restore original text if needed (simple example)
            if(btn.hasAttribute('data-original-text')) {
                btn.textContent = btn.getAttribute('data-original-text');
            }
        }
    });
  }
}

// --- Rendering Functions ---

function renderHustles(hustles, city, isGeminiResponse, outputElement) {
  if (window.progressTimeout) {
    clearTimeout(window.progressTimeout);
    window.progressTimeout = null;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.transition = 'width 0.2s ease-out';
      progressFill.style.width = '100%';
    }
  }
  if (window.progressInterval) {
    clearInterval(window.progressInterval);
    window.progressInterval = null;
  }

  // Set up Intersection Observer for scroll animations
  const observeCards = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, { threshold: 0.1 }); // Trigger when 10% of the card is visible

    // Observe all hustle cards
    document.querySelectorAll('.hustle-card').forEach(card => {
      observer.observe(card);
    });
  };

  currentDisplayedHustles = hustles || [];
  currentCity = city;

  const output = outputElement || document.getElementById('hustle-output');
  if (!output) return;
  output.innerHTML = '';

  if (!Array.isArray(hustles) || hustles.length === 0) {
    output.innerHTML = `<div class="error">No hustle ideas found for ${city}. Try refreshing or searching another city.</div>`;
    return;
  }

  const heading = document.createElement('h2');
  heading.className = 'hustles-heading text-3xl md:text-4xl font-extrabold text-center mb-2'; // Restore class name + Tailwind
  heading.textContent = `${city} Hustle Ideas`;

  const subheading = document.createElement('span');
  subheading.className = 'hustles-subheading block text-lg text-gray-500 font-medium mt-1'; // Restore class name + Tailwind
  subheading.textContent = `Unique Side Business Opportunities for ${city}`;
  heading.appendChild(subheading);
  output.appendChild(heading);

  const instructionSubtitle = document.createElement('p');
  instructionSubtitle.className = 'hustles-subtitle text-center text-sm text-gray-400 uppercase tracking-wider mt-4 mb-6'; // Restore class name + Tailwind
  instructionSubtitle.textContent = 'COPY, SAVE OR REFRESH NEW HUSTLE IDEAS';
  output.appendChild(instructionSubtitle);

  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'hustle-cards-container';
  output.appendChild(cardsContainer);

  hustles.forEach((hustle, index) => {
    if (hustle && typeof hustle === 'object') {
        const card = createHustleCard(hustle, city, isGeminiResponse); // Assuming createHustleCard is defined
        card.querySelectorAll('[data-hustle-index]').forEach(btn => btn.setAttribute('data-hustle-index', index));
        cardsContainer.appendChild(card);
    } else {
        console.warn(`Skipping invalid hustle data at index ${index}:`, hustle);
    }
  });

  const refreshBtnContainer = document.createElement('div');
  refreshBtnContainer.className = 'refresh-button-container';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'refresh-btn';
  refreshBtn.id = 'refresh-btn';
  refreshBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg> Refresh Ideas`;
  refreshBtnContainer.appendChild(refreshBtn);

  const moreDiverseBtn = document.createElement('button');
  moreDiverseBtn.className = 'refresh-btn';
  moreDiverseBtn.id = 'more-diverse-btn';
  moreDiverseBtn.style = 'margin-left: 10px; background: linear-gradient(135deg, var(--accent-color) 0%, var(--secondary-color) 100%);';
  moreDiverseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg> Get More Diverse Hustle`;
  refreshBtnContainer.appendChild(moreDiverseBtn);

  output.appendChild(refreshBtnContainer);

  // Call listener setups AFTER elements are added to the DOM
  setupButtonListeners(hustles, city);
  setupHustleCardListeners(hustles);

  // Initialize scroll animations
  observeCards();
}

function createHustleCard(hustle, city, isGeminiResponse = true) {
  const card = document.createElement("div");
  card.className = "hustle-card";
  const difficulty = (hustle.difficulty && typeof hustle.difficulty === 'string') ? hustle.difficulty.toLowerCase() : 'unknown';
  card.setAttribute("data-difficulty", difficulty);

  let savedHustles = JSON.parse(localStorage.getItem('savedHustles') || '[]');
  const isAlreadySaved = savedHustles.some(saved => saved.name === hustle.name);

  const physicalDigital = classifyPhysicalDigital(hustle);
  const businessCustomer = classifyBusinessCustomer(hustle);

 card.innerHTML = `
            <div class="copy-button-container">
            <button class="copy-hustle-btn inline-flex items-center gap-1 px-2 py-1 border border-transparent rounded-md text-xs font-medium" data-hustle-index="0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
                <button class="save-hustle-btn inline-flex items-center gap-1 px-2 py-1 border border-transparent rounded-md text-xs font-medium ${isAlreadySaved ? 'saved' : ''}" data-hustle-index="0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isAlreadySaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    ${isAlreadySaved ? 'Saved' : 'Save'}
                </button>
                <button class="share-hustle-btn inline-flex items-center gap-1 px-2 py-1 border border-transparent rounded-md text-xs font-medium" data-hustle-index="0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Share
                </button>
            </div>
            <h3>${(hustle.name || 'Unnamed Hustle').replace(/['"*\n]/g, " ").trim()}</h3>
            <div class="hustle-tags">
                <span class="hustle-diversity-tag tag-${physicalDigital}">${physicalDigital}</span>
                <span class="hustle-diversity-tag tag-${businessCustomer}">${businessCustomer.toUpperCase()}</span>
            </div>
            <div class="hustle-details">
                <p><strong>Executive Summary:</strong> ${hustle.summary || 'No summary available.'}</p>

                <div class="hustle-metrics">
                    <span class="metric"><strong>Difficulty:</strong> ${hustle.difficulty || 'N/A'}</span>
                    <span class="metric metric-profitability"><strong>Profitability:</strong> <span class="profit-badge">${formatProfitability(hustle.profitability)}</span></span>
                    <span class="metric"><strong>Initial Cost:</strong> ${hustle.cost || 'N/A'}</span>
                </div>

                <div class="metrics-section">
                    <h4>Key Metrics</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <strong>Startup Time:</strong><br>${hustle.metrics?.startupTime || 'N/A'}
                        </div>
                        <div class="metric-item">
                            <strong>Break-even:</strong><br>${hustle.metrics?.breakEven || 'N/A'}
                        </div>
                        <div class="metric-item">
                            <strong>Scalability:</strong><br>${hustle.metrics?.scalability || 'N/A'}
                        </div>
                    </div>
                </div>

                <div class="action-plan-section">
                    <h4>Action Plan (First Month)</h4>
                        <div class="timeline">
                            ${hustle.actionPlan && hustle.actionPlan.length > 0 ? hustle.actionPlan.map(((plan, planIndex) => `
                                <div class="timeline-item">
                                    <div class="timeline-marker">${planIndex + 1}</div>
                                    <div class="timeline-content">${plan}</div>
                                </div>
                            `)).join("") : '<p>No action plan provided.</p>'}
                        </div>
                </div>

                <div class="resources-section">
                    <h4>Resources</h4>
                    <div class="resources-grid">
                        <div class="resource-item">
                            <strong>🛠️ Tools:</strong>
                            <ul>${hustle.resources?.tools && hustle.resources.tools.length > 0 ? hustle.resources.tools.map((tool => `<li>${tool}</li>`)).join("") : '<li>N/A</li>'}</ul>
                        </div>
                        <div class="resource-item">
                            <strong>💻 Platforms:</strong>
                            <ul>${hustle.resources?.platforms && hustle.resources.platforms.length > 0 ? hustle.resources.platforms.map((platform => `<li>${platform}</li>`)).join("") : '<li>N/A</li>'}</ul>
                        </div>
                        <div class="resource-item">
                            <strong>👥 Communities:</strong>
                            <ul>${hustle.resources?.communities && hustle.resources.communities.length > 0 ? hustle.resources.communities.map((community => `<li>${community}</li>`)).join("") : '<li>N/A</li>'}</ul>
                        </div>
                    </div>
                </div>

                <div class="monetization-section">
                    <h4>Monetization Streams</h4>
                        <div class="monetization-list">
                            ${hustle.monetization && hustle.monetization.length > 0 ? hustle.monetization.map(((stream, streamIndex) => `
                                <div class="monetization-item">
                                    <span class="monetization-number">${streamIndex + 1}</span>
                                    <span class="monetization-content">${stream}</span>
                                </div>
                            `)).join("") : '<p>No monetization streams provided.</p>'}
                        </div>
                </div>

                <div class="risks-section">
                    <h4>Risk Analysis</h4>
                        ${hustle.risks && hustle.risks.length > 0 ? hustle.risks.map((risk => `
                            <div class="risk-item">
                                <div class="risk-challenge">
                                    <strong>⚠️ Challenge:</strong> ${risk.challenge || 'N/A'}
                                </div>
                                ${risk.impact ? `<div class="risk-impact"><strong>📊 Impact:</strong> ${risk.impact}</div>` : ''}
                                <div class="risk-solution">
                                    <strong>💡 Solution:</strong> ${risk.solution || 'N/A'}
                                </div>
                                ${risk.expected ? `<div class="risk-expected"><strong>📈 Expected:</strong> ${risk.expected}</div>` : ''}
                            </div>
                        `)).join("") : '<p>No risk analysis provided.</p>'}
                </div>
            </div>`;

  return card;
}

function updateProgressBar() {
  const progressFill = document.querySelector('.progress-fill');
  if (!progressFill) return;
  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
  void progressFill.offsetWidth;
  progressFill.style.transition = 'width 28s ease-out'; // Use a realistic duration
  progressFill.style.width = '100%';
  window.progressTimeout = setTimeout(() => {
      if(progressFill) progressFill.style.width = '100%';
      window.progressTimeout = null;
  }, 28000);
}

function showHustleLoading(city) {
  const hustleOutput = document.getElementById('hustle-output');
  if (!hustleOutput) return;
  hustleOutput.style.display = 'block';
  hustleOutput.innerHTML = `<div class="loading-card"><div class="loading"><div class="loader-circle"></div><span>Scanning hustle opportunities in <span id="loading-city">${city}</span>...</span><div class="progress-bar"><div class="progress-fill"></div></div><div class="loading-subtext">We are scanning for the best hustles... Please be patient.</div></div></div>`;
  updateProgressBar(); // Start progress bar when loading shows

  // Scroll loading card into view smoothly and centered
  setTimeout(() => {
    const loadingCard = hustleOutput.querySelector('.loading-card');
    if (loadingCard) {
      loadingCard.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        console.warn("Could not find .loading-card to scroll to.");
    }
  }, 50); // Small delay to ensure DOM update before scrolling
}

function showError(message) {
  if (window.progressTimeout) {
      clearTimeout(window.progressTimeout);
      window.progressTimeout = null;
  }
  const hustleOutput = document.getElementById("hustle-output");
  if (hustleOutput) {
    hustleOutput.style.display = "block";
    hustleOutput.innerHTML = `<div class="error">${message}</div>`;
    scrollToHustleOutput();
  }
}

// --- Classification Helpers ---

function classifyBusinessModel(monetization) {
  if (!monetization || !Array.isArray(monetization)) return 'unknown';
  const text = monetization.join(' ').toLowerCase();
  if (text.includes('subscription')) return 'subscription';
  if (text.includes('commission') || text.includes('marketplace') || text.includes('platform fee')) return 'marketplace';
  if (text.includes('service') || text.includes('consulting') || text.includes('hourly')) return 'service';
  if (text.includes('product') || text.includes('merchandise') || text.includes('retail')) return 'product';
  if (text.includes('advertising') || text.includes('sponsorship')) return 'advertising';
  if (text.includes('rental') || text.includes('leasing')) return 'rental';
  if (text.includes('workshop') || text.includes('training') || text.includes('course')) return 'education';
  return 'other';
}

function classifyAudience(summary) {
  if (!summary || typeof summary !== 'string') return 'unknown';
  const text = summary.toLowerCase();
  if (text.includes('student')) return 'students';
  if (text.includes('professional')) return 'professionals';
  if (text.includes('senior')) return 'seniors';
  if (text.includes('tourist')) return 'tourists';
  if (text.includes('parent') || text.includes('family')) return 'families';
  if (text.includes('pet owner')) return 'pet owners';
  if (text.includes('homeowner')) return 'homeowners';
  if (text.includes('business') || text.includes('b2b')) return 'businesses';
  return 'general';
}

function classifyPhysicalDigital(hustle) {
  if (!hustle) return 'unknown';
  const allText = [hustle.summary || '', hustle.monetization?.join(' ') || '', hustle.resources?.tools?.join(' ') || '', hustle.resources?.platforms?.join(' ') || ''].join(' ').toLowerCase();
  const physicalIndicators = ['store','shop','physical','location','space','venue','equipment','in-person','hands-on','material','build','craft','product','manufacture','delivery','transport','vehicle','restaurant','food','retail','brick'];
  const digitalIndicators = ['online','digital','virtual','remote','website','app','platform','software','content','social media','e-commerce','subscription','web','internet','tech','digital product','saas','blog','podcast','stream'];
  let physicalScore=0, digitalScore=0;
  physicalIndicators.forEach(term=>{if(allText.includes(term)) physicalScore++});
  digitalIndicators.forEach(term=>{if(allText.includes(term)) digitalScore++});
  if(physicalScore>digitalScore) return 'physical';
  if(digitalScore>physicalScore) return 'digital';
  return 'hybrid';
}

function classifyBusinessCustomer(hustle) {
  if (!hustle) return 'unknown';
  const allText = [hustle.summary || '', hustle.monetization?.join(' ') || ''].join(' ').toLowerCase();
  const b2bIndicators = ['business','corporate','company','enterprise','organization','b2b','client','professional','agency','commercial','wholesale','industry','vendor','supplier','service provider','consultant'];
  const b2cIndicators = ['consumer','customer','individual','people','personal','user','b2c','retail','public','direct-to-consumer','household','resident','family','student','parent','senior','general public'];
  let b2bScore=0, b2cScore=0;
  b2bIndicators.forEach(term=>{if(allText.includes(term)) b2bScore++});
  b2cIndicators.forEach(term=>{if(allText.includes(term)) b2cScore++});
  const audience = classifyAudience(hustle.summary || '');
  if(['businesses','professionals'].includes(audience)) b2bScore+=2;
  if(['students','families','seniors','tourists','pet owners','homeowners','general'].includes(audience)) b2cScore+=2;
  if(b2bScore>b2cScore) return 'b2b';
  if(b2cScore>b2bScore) return 'b2c';
  return 'mixed';
}

// --- Gemini API Interaction ---

async function fetchHustleFromGemini(city, attempt = 0, isTrending = false, specificHustleName = null) {
  let prompt;
  if (specificHustleName) {
    // Prompt for a single, specific hustle
    prompt = `Generate the full detailed breakdown for the side hustle named "${specificHustleName}" specifically for ${city}. Ensure the output format EXACTLY matches the structure required for parsing, including all sections: Name, Executive Summary, Difficulty, Profitability, Cost, Key Metrics (Startup Time, Break-even Point, Scalability), Action Plan (4 weeks), Resources (Tools, Platforms, Communities), Monetization (3 streams), and Risk Analysis (2 challenges with solutions). Provide complete, specific, and realistic details for EVERY section. Responses with placeholders, generic answers, or incomplete sections will be rejected.`;
    console.log(`Generating details for specific hustle: ${specificHustleName} in ${city}`);
  } else {
    // Original prompt for 3 diverse hustles
    prompt = `Generate exactly 2 highly unique and unconventional side hustles tailored to ${city}'s local economy, culture, demographics, and untapped opportunities. Avoid common ideas like food delivery, tutoring, or generic freelancing. ${previousHustleNames.length > 0 ? `Do not repeat these previous ideas: ${previousHustleNames.join(", ")}.` : ""} ${diversityPrompt} Format EXACTLY like:\n\nName: [Business Name]\nExecutive Summary: [2-3 sentences describing the opportunity]\nDifficulty: [Easy/Medium/Hard]\nProfitability: [$/month range with specific numbers]\nCost: [Initial cost breakdown with specific numbers]\n\nKey Metrics:\n- Startup Time: [X weeks based on complexity, must be specific]\n- Break-even Point: [Y months with calculation based on costs and revenue]\n- Scalability: [Low/Medium/High with detailed explanation]\n\nAction Plan (First Month):\nWeek 1: [specific actionable milestone with measurable outcome]\nWeek 2: [specific actionable milestone with measurable outcome]\nWeek 3: [specific actionable milestone with measurable outcome]\nWeek 4: [specific actionable milestone with measurable outcome]\n\nResources:\n- Tools: [List exactly 3-5 specific tools with actual names and brief purpose]\n- Platforms: [List exactly 2-3 specific platforms with actual names]\n- Communities: [1 specific local community in ${city} + 1 specific online community]\n\nMonetization:\n1. [Primary revenue stream with exact pricing and volume estimates]\n2. [Secondary revenue stream with exact pricing and volume estimates]\n3. [Additional revenue stream with exact pricing and volume estimates]\n\nRisk Analysis:\n- Challenge: [specific realistic risk with quantifiable impact]\n  Solution: [detailed actionable mitigation steps]\n- Challenge: [specific realistic risk with quantifiable impact]\n  Solution: [detailed actionable mitigation steps]\n\nCRITICAL INSTRUCTION: You MUST provide complete, specific, and realistic details for EVERY section of ALL 2 hustles. Omitting or providing vague details for any section will force a retry. Each hustle must be distinct, creative, and rooted in ${city}'s unique characteristics (e.g., local industries, climate, population trends, or subcultures). Every metric must include specific numbers, every action must be measurable, and every solution must be actionable. Responses with placeholders, generic answers, or incomplete sections will be rejected.`;
    console.log(`Generating 2 diverse hustles for: ${city}`);
  }

  try {
    console.log(`Making API request to Gemini (Attempt ${attempt + 1})...`);
    const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }],
        generationConfig: { maxOutputTokens: 1500, temperature: 1.2, topP: .9, topK: 50 }
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}): ${errorText}`);
        throw new Error(`API Error (${response.status}). Check console for details.`);
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!responseText) throw new Error("Empty response from Gemini API.");

    console.log("API response received, parsing hustles...");
    const hustles = parseHustles(responseText, city); // Assuming parseHustles is defined
    if (!hustles || hustles.length === 0) throw new Error("Could not parse hustle data format.");

    // Basic validation (can be expanded)
    const qualityCheck = hustles.map(h => validateHustleQuality(h)); // Assuming validateHustleQuality is defined
    const avgCompleteness = qualityCheck.reduce((sum, h) => sum + h.completeness, 0) / qualityCheck.length;

    if (avgCompleteness < 0.8 && attempt < 2) {
        console.warn(`Validation failed (Avg Completeness: ${avgCompleteness.toFixed(2)}). Retrying...`);
        return fetchHustleFromGemini(city, attempt + 1, isTrending, specificHustleName); // Pass specificHustleName on retry
    } else if (avgCompleteness < 0.8) {
        console.error("Validation failed after multiple attempts. Using fallback.");
        return getFallbackHustles(city); // Assuming getFallbackHustles is defined
    }

    console.log("Validation passed.");
    previousHustleNames.push(...hustles.map(h => h.name).filter(Boolean));
    previousHustleNames = [...new Set(previousHustleNames)].slice(-9); // Keep unique, limit history

    return hustles;

  } catch (error) {
    console.error("Error fetching/processing Gemini data:", error);
    if (attempt < 2) {
        console.warn("Retrying due to error...");
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        return fetchHustleFromGemini(city, attempt + 1, isTrending, specificHustleName); // Pass specificHustleName on retry
    } else {
        console.error("All fetch attempts failed. Using fallback hustles.");
        return getFallbackHustles(city);
    }
  }
}

// --- Function to Display Specific Hustle Details ---

async function displaySpecificHustleDetails(hustleName, city) {
  if (window.searchInProgress) {
    console.log("Search already in progress, ignoring new request for specific hustle details");
    return;
  }
  window.searchInProgress = true;
  try {
    // Modify loading message slightly if desired
    showHustleLoading(city); // You could enhance this to show `Loading details for ${hustleName}...`
    const hustleOutput = document.getElementById("hustle-output");
    if (hustleOutput) {
      hustleOutput.style.display = "block";
      scrollToHustleOutput();
    }
    updateProgressBar(); // Show progress

    // Fetch only the specific hustle
    let hustleResult = await fetchHustleFromGemini(city, 0, false, hustleName);

    // Render the single hustle (renderHustles expects an array)
    renderHustles(hustleResult, city, true, hustleOutput);

    // Optional: Deactivate city buttons if needed, or handle differently
    document.querySelectorAll(".city-btn").forEach(btn => {
      btn.classList.remove("active");
    });

  } catch (e) {
    console.error(`Error in displaySpecificHustleDetails for ${hustleName}:`, e);
    showError(e.message || `An unexpected error occurred fetching details for ${hustleName}.`);
  } finally {
    window.searchInProgress = false;
    // Re-enable buttons (consider which ones are relevant here)
    document.querySelectorAll(".city-btn, #get-hustle-btn, #refresh-btn, #more-diverse-btn, .trending-details-btn").forEach(btn => {
        if(btn) {
            btn.disabled = false;
            btn.style.cursor = "pointer";
            btn.classList.remove("loading");
            if(btn.hasAttribute('data-original-text')) {
                btn.textContent = btn.getAttribute('data-original-text');
            }
        }
    });
  }
}


// --- Utility Functions (Parsing, Validation, Fallbacks, etc.) ---

function parseHustles(e,t){const n=[],i=e.split(/Name:/g).filter((e=>e.trim()));for(const e of i.slice(0,3)){const t="Name:"+e,i={name:"",summary:"",difficulty:"",profitability:"",cost:"",metrics:{startupTime:"",breakEven:"",scalability:""},actionPlan:[],resources:{tools:[],platforms:[],communities:[]},monetization:[],risks:[]},s=t.match(/Name:\s*(.+?)(?=\n|Executive)/);s&&(i.name=s[1].trim());const o=t.match(/Executive Summary:\s*(.+?)(?=\n|Difficulty)/s);o&&(i.summary=o[1].trim());const a=t.match(/Difficulty:\s*(.+?)(?=\n|Profitability)/);a&&(i.difficulty=a[1].trim());const r=t.match(/Profitability:\s*(.+?)(?=\n|Cost)/);r&&(i.profitability=r[1].trim());const l=t.match(/Cost:\s*(.+?)(?=\n|Key Metrics)/);l&&(i.cost=l[1].trim());const c=t.match(/Key Metrics:\s*(.+?)(?=\n\nAction Plan)/s);if(c){const e=c[1],t=e.match(/Startup Time:\s*(.+?)(?=\n|-)/);t&&(i.metrics.startupTime=t[1].trim());const n=e.match(/Break-even Point:\s*(.+?)(?=\n|-)/);n&&(i.metrics.breakEven=n[1].trim());const s=e.match(/Scalability:\s*(.+?)(?=\n|$)/);s&&(i.metrics.scalability=s[1].trim())}const m=t.match(/Action Plan \(First Month\):\s*(.+?)(?=\n\nResources)/s);if(m){const e=m[1].match(/Week \d+:.*?(?=\n|$)/g);e&&(i.actionPlan=e.map((e=>e.trim())))}const u=t.match(/Resources:\s*(.+?)(?=\n\nMonetization)/s);if(u){const e=u[1],t=e.match(/Tools:\s*(.+?)(?=\n|Platforms)/);t&&(i.resources.tools=t[1].split(",").map((e=>e.trim())).filter((e=>e)));const n=e.match(/Platforms:\s*(.+?)(?=\n|Communities)/);n&&(i.resources.platforms=n[1].split(",").map((e=>e.trim())).filter((e=>e)));const s=e.match(/Communities:\s*(.+?)(?=\n|$)/);s&&(i.resources.communities=s[1].split(",").map((e=>e.trim())).filter((e=>e)))}const d=t.match(/Monetization:\s*(.+?)(?=\n\nRisk Analysis)/s);if(d){const e=d[1].match(/\d+\.\s*.*?(?=\n|$)/g);e&&(i.monetization=e.map((e=>e.replace(/^\d+\.\s*/,"").trim())))}const p=t.match(/Risk Analysis:\s*(.+?)(?=$)/s);if(p){const e=p[1],t=e.match(/Challenge:\s*.*?(?=\n|$)/g),n=e.match(/Solution:\s*.*?(?=\n|-|$)/g);if(t&&n)for(let e=0;e<Math.min(t.length,n.length);e++)i.risks.push({challenge:t[e].replace("Challenge:","").trim(),solution:n[e].replace("Solution:","").trim()})}i.name&&i.summary&&n.push(i)}return n.length>0?n:null}

function validateHustleQuality(e){const t={name:.05,summary:.1,difficulty:.05,profitability:.05,cost:.05,metrics:{startupTime:.05,breakEven:.05,scalability:.05},actionPlan:.15,resources:{tools:.05,platforms:.05,communities:.05},monetization:.2,risks:.2};let n=0;for(const[i,s]of Object.entries(t))if("object"==typeof s)for(const[t,o]of Object.entries(s))e[i]?.[t]&&("string"==typeof e[i][t]?e[i][t].length>0:!Array.isArray(e[i][t])||e[i][t].length>0)&&(n+=o);else e[i]&&("string"==typeof e[i]?e[i].length>0:!Array.isArray(e[i])||e[i].length>0)&&(n+=s);return Array.isArray(e.actionPlan)&&e.actionPlan.length>=4&&(n+=.025),Array.isArray(e.monetization)&&e.monetization.length>=3&&(n+=.05),Array.isArray(e.risks)&&e.risks.length>=2&&(n+=.05),Array.isArray(e.resources?.tools)&&e.resources.tools.length>=3&&(n+=.025),Array.isArray(e.resources?.platforms)&&e.resources.platforms.length>=2&&(n+=.025),Array.isArray(e.resources?.communities)&&e.resources.communities.length>=2&&(n+=.025),{hustle:e,completeness:n,isHighQuality:n>=.9}}
function getFallbackHustles(e){return[{name:`${e} Local Experiences Tour Guide`,summary:`Offer unique, themed walking tours focused on specific areas or interests in ${e}, appealing to tourists and locals. Leverage local knowledge and create memorable experiences beyond typical tourist traps.`,difficulty:"Medium",profitability:"$500 - $2000/month",cost:"$150 (Website domain, initial marketing materials)",metrics:{startupTime:"4-6 weeks",breakEven:"2-3 months",scalability:"Medium - Can expand to multiple tour themes and hire additional guides"},actionPlan:['Week 1: Define tour themes (e.g., "Hidden Gems of Downtown", "Literary History Tour", "Local Cuisine Experience"). Research routes and points of interest.',"Week 2: Create website or landing page with tour descriptions, schedules, and booking information.","Week 3: Market tours online through social media and local listings. Offer introductory discounts.","Week 4: Conduct initial tours, gather feedback, and refine the tour experience."],resources:{tools:["Booking software","Portable microphone/speaker","Digital camera"],platforms:["TripAdvisor","Airbnb Experiences"],communities:[`${e} Tourism Board`,"Facebook Group: Tour Guides Worldwide"]},monetization:["Standard tours: $25-40 per person for 2-hour experiences","Premium/private tours: $150-200 for groups up to 6 people","Custom corporate team-building tours: $400-600 per event"],risks:[{challenge:"Seasonal tourism fluctuations",solution:"Develop special off-season tours targeting locals and business travelers"},{challenge:"Competition from established tour companies",solution:"Focus on unique niches and specialized knowledge that larger companies don't cover"}]},{name:`${e} Mobile Pet Grooming Service`,summary:`Provide convenient, stress-free pet grooming services directly at customers' homes in ${e}. Cater to busy pet owners who value convenience and pets that experience anxiety in traditional grooming environments.`,difficulty:"Medium",profitability:"$1,500 - $4,000/month",cost:"$2,000 - $5,000 (Equipment, supplies, vehicle modifications)",metrics:{startupTime:"6-8 weeks",breakEven:"4-6 months",scalability:"High - Can add additional mobile units and groomers"},actionPlan:["Week 1: Research local pet demographics and competitors. Obtain necessary licenses and insurance.","Week 2: Purchase equipment and supplies. Set up booking and payment system.","Week 3: Create website and social media presence. Begin targeted marketing to pet owners.","Week 4: Offer promotional pricing for initial customers to build reviews and referrals."],resources:{tools:["Mobile grooming equipment","Scheduling software","Pet-friendly cleaning supplies"],platforms:["Instagram","NextDoor"],communities:[`${e} Pet Owners Association`,"Online Pet Groomers Network"]},monetization:["Basic grooming package: $65-85 per small dog, $85-120 per large dog","Premium spa packages: $100-150 including specialized treatments","Membership subscriptions: $50/month discount for recurring monthly appointments"],risks:[{challenge:"Vehicle and equipment maintenance issues",solution:"Establish relationships with reliable mechanics and keep backup equipment"},{challenge:"Handling difficult or aggressive pets",solution:"Obtain specialized training in animal behavior and implement clear policies for pet evaluation"}]},{name:`${e} Local Food Delivery Collective`,summary:`Create a cooperative delivery service exclusively for local, independent restaurants in ${e} that can't afford high fees from mainstream delivery apps. Provide fair pricing for restaurants and better compensation for drivers.`,difficulty:"Hard",profitability:"$2,000 - $6,000/month",cost:"$3,000 - $8,000 (App development, marketing, legal setup)",metrics:{startupTime:"10-12 weeks",breakEven:"8-10 months",scalability:"Medium - Limited to local market but can expand to neighboring areas"},actionPlan:["Week 1: Survey local restaurants about pain points with current delivery services. Begin legal formation of cooperative structure.","Week 2: Develop initial version of ordering platform or app. Begin recruiting delivery drivers.","Week 3: Onboard first 5-10 restaurant partners and conduct platform testing.","Week 4: Soft launch with limited service area and hours. Gather feedback for improvements."],resources:{tools:["Order management software","Route optimization tools","Payment processing system"],platforms:["Custom mobile app","Instagram"],communities:[`${e} Restaurant Association`,"Independent Restaurant Alliance"]},monetization:["Restaurant commission: 10-15% of order value (versus 25-35% from major apps)","Customer delivery fee: $3.99-5.99 based on distance","Premium membership option: $9.99/month for free delivery and priority service"],risks:[{challenge:"Competition from well-funded delivery apps",solution:"Emphasize local ownership, better restaurant economics, and community support in marketing"},{challenge:"Technology reliability issues",solution:"Implement backup systems and clear manual processes for when technical issues arise"}]}]}

// Format profitability string for display
function formatProfitability(profitString) {
    if (!profitString) return 'N/A';
    // Clean up the profitability string and ensure proper formatting
    // Remove any backslash before a dollar sign, and normalize dash spacing
    return profitString.replace(/\\\$/g, '$').replace(/\s*-\s*/g, ' - ');
}

// --- Event Listener Setup ---

function setupButtonListeners(hustles, city) {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    // Clone and replace to remove old listeners before adding new one
    const newRefreshBtn = refreshBtn.cloneNode(true);
    refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
    newRefreshBtn.onclick = async function() { // Use onclick for simplicity here
      if (!city || window.searchInProgress) return;
      this.disabled = true;
      this.innerHTML = 'Refreshing...'; // Add loading indicator
      try {
        await fetchHustleData(city);
      } catch (e) {
        console.error("Refresh error:", e);
        showError(e.message || 'Failed to refresh');
      } finally {
         // Ensure button is re-enabled and text restored
         this.disabled = false;
         this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg> Refresh Ideas`;
      }
    }
  }

  const moreDiverseBtn = document.getElementById('more-diverse-btn');
  if (moreDiverseBtn) {
    const newMoreDiverseBtn = moreDiverseBtn.cloneNode(true);
    moreDiverseBtn.parentNode.replaceChild(newMoreDiverseBtn, moreDiverseBtn);
    newMoreDiverseBtn.onclick = async function() { // Use onclick
      if (!city || window.searchInProgress) return;
      this.disabled = true;
      this.innerHTML = 'Generating...'; // Add loading indicator
      try {
        // Placeholder: In a real scenario, call generateAlternativeHustle or similar
        console.log("Fetching diverse hustles...");
        await fetchHustleData(city); // Re-fetch for now as placeholder
      } catch (e) {
        console.error("Diverse fetch error:", e);
        showError(e.message || 'Failed to generate diverse ideas');
      } finally {
         this.disabled = false;
         this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg> Get More Diverse Hustle`;
      }
    }
  }
}

function setupHustleCardListeners(hustles) {
  if (!hustles) return; // Guard against undefined hustles

  document.querySelectorAll('.copy-hustle-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = function() { // Use onclick
      const index = parseInt(this.getAttribute('data-hustle-index'), 10);
      if (!isNaN(index) && hustles[index]) {
        const textToCopy = formatHustleForCopy(hustles[index]);
        navigator.clipboard.writeText(textToCopy).then(() => {
          this.textContent = 'Copied!';
          setTimeout(() => { this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`; }, 1500);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
          this.textContent = 'Error';
          setTimeout(() => { this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`; }, 1500);
        });
      }
    }
  });

  document.querySelectorAll('.save-hustle-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = function() { // Use onclick
      const index = parseInt(this.getAttribute('data-hustle-index'), 10);
      if (isNaN(index) || !hustles[index]) return;

      const hustleToSave = hustles[index];
      let saved = JSON.parse(localStorage.getItem('savedHustles') || '[]');
      const existsIndex = saved.findIndex(h => h.name === hustleToSave.name);

      if (existsIndex === -1) {
        saved.push(hustleToSave);
        this.classList.add('saved');
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Saved`; // Update icon and text
      } else {
        saved.splice(existsIndex, 1);
        this.classList.remove('saved');
        this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Save`; // Update icon and text
      }
      localStorage.setItem('savedHustles', JSON.stringify(saved));
    }
  });

   document.querySelectorAll('.share-hustle-btn').forEach(btn => {
       const newBtn = btn.cloneNode(true);
       btn.parentNode.replaceChild(newBtn, btn);
       newBtn.onclick = function() { // Use onclick
           // Share logic here...
           console.log("Share button clicked");
       }
   });
}

// Placeholder for formatHustleForCopy
function formatHustleForCopy(hustle) {
    return `${hustle.name}\n\n${hustle.summary}`;
}

// --- Initialization ---

// --- Helper function for Start Hustling buttons ---
function handleStartHustlingClick(event) {
  event.preventDefault(); // Prevent default link/button behavior
  const cityInputElement = document.getElementById('city-input');
  if (cityInputElement) {
    // Scroll the input into view first
    cityInputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Add a small delay before focusing to allow scroll to finish smoothly
    setTimeout(() => {
        // preventScroll helps avoid potential jumps after smooth scroll finishes
        cityInputElement.focus({ preventScroll: true });
    }, 350); // Adjust delay if needed (300-500ms is usually good)
  } else {
    console.warn("City input element (#city-input) not found for scrolling/focusing.");
  }
}

function setupMainPageListeners() {
  console.log("Setting up main page listeners..."); // Debug log
  const cityInput = document.getElementById('city-input');
  const getHustleBtn = document.getElementById('get-hustle-btn');
  const cityBtns = document.querySelectorAll('.city-btn');
  const refreshResultsBtn = document.getElementById('refresh-results'); // In results section
  const tryAgainBtn = document.getElementById('try-again'); // In results section
  const startHustlingDesktopBtn = document.getElementById('start-hustling-btn-desktop');
  const startHustlingMobileBtn = document.getElementById('start-hustling-btn-mobile');

  // --- Listeners for Main Search ---
  if (getHustleBtn && cityInput) {
    getHustleBtn.onclick = () => {
      console.log("Search button clicked");
      const city = cityInput.value.trim();
      if (city) {
          getHustleBtn.setAttribute('data-original-text', getHustleBtn.textContent);
          getHustleBtn.disabled = true;
          getHustleBtn.textContent = 'Searching...';
          fetchHustleData(city);
      } else {
          showError('Please enter a city name');
      }
    };
    cityInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            getHustleBtn.click();
        }
    };
  } else {
      console.warn("Search button or city input not found.");
  }

  cityBtns.forEach(btn => {
    btn.setAttribute('data-original-text', btn.textContent);
    btn.onclick = () => {
      console.log("City button clicked:", btn.textContent);
      const city = btn.textContent.trim();
      if (cityInput) cityInput.value = city;
      cityBtns.forEach(b => { b.disabled = true; b.style.cursor = 'not-allowed'; });
      btn.textContent = 'Loading...';
      btn.classList.add('loading');
      fetchHustleData(city);
    };


  });

  // --- Listeners for Start Hustling Buttons ---
  if (startHustlingDesktopBtn) {
    startHustlingDesktopBtn.onclick = handleStartHustlingClick;
  } else {
    console.warn("Desktop 'Start Hustling' button (#start-hustling-btn-desktop) not found.");
  }
  if (startHustlingMobileBtn) {
    startHustlingMobileBtn.onclick = handleStartHustlingClick;
  } else {
    console.warn("Mobile 'Start Hustling' button (#start-hustling-btn-mobile) not found.");
  }

  // --- Listener for CTA 'Find Hustles' button ---
  const findHustlesCtaBtn = document.getElementById('find-hustles-cta-btn');
  if (findHustlesCtaBtn) {
      // Use the same helper function for consistency
      findHustlesCtaBtn.onclick = handleStartHustlingClick;
  } else {
    console.warn("CTA 'Find Hustles' button (#find-hustles-cta-btn) not found.");
  }


  // --- Listeners for Results Section Buttons ---
  if (refreshResultsBtn) {
    refreshResultsBtn.onclick = () => {
      console.log("Refresh results clicked");
      const city = document.getElementById('results-city')?.textContent.trim() || cityInput?.value.trim();
      if (city) fetchHustleData(city);
    };
  }
  if (tryAgainBtn) {
    tryAgainBtn.onclick = () => {
      console.log("Try again clicked");
      const city = cityInput?.value.trim();
      if (city) fetchHustleData(city);
    };
  }

  // --- Listeners for Trending Section ---
  const trendingCityInput = document.getElementById('trending-city-input');
  const refreshTrendingBtn = document.getElementById('refresh-trending-btn');
  // NOTE: We no longer modify the trendingContainer's initial state here.

  if (refreshTrendingBtn && trendingCityInput) {
    // Using onclick instead of addEventListener to match other event bindings in the code
    refreshTrendingBtn.onclick = () => {
      const city = trendingCityInput.value.trim();
      console.log("Trending refresh button clicked for city:", city); // Debug log
      if (city) {
        // Store original text before disabling
        refreshTrendingBtn.setAttribute('data-original-text', refreshTrendingBtn.textContent);
        refreshTrendingBtn.disabled = true;
        refreshTrendingBtn.textContent = 'Loading...';
        loadTrendingHustles(city); // Load only if city is provided
      } else {
        trendingCityInput.focus(); // Prompt user to enter a city
      }
    };
  }

  if (trendingCityInput) {
    // Using onkeypress instead of addEventListener to match other event bindings
    trendingCityInput.onkeypress = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const city = trendingCityInput.value.trim();
        console.log("Enter pressed in trending city input for city:", city); // Debug log
        if (city) {
          refreshTrendingBtn.setAttribute('data-original-text', refreshTrendingBtn.textContent);
          refreshTrendingBtn.disabled = true;
          refreshTrendingBtn.textContent = 'Loading...';
          loadTrendingHustles(city); // Load only if city is provided
        } else {
          trendingCityInput.focus(); // Prompt user to enter a city
        }
      }
    };
  }
}


// --- City Button See-Saw Scroll Animation ---
let throttleTimeout = null;
let lastScrollTime = 0;
const throttleDelay = 50; // ms - adjust for smoother/less frequent updates

function handleCityButtonScrollAnimation() {
    const cityButtons = document.querySelectorAll('.city-btn');
    if (!cityButtons || cityButtons.length === 0) return;

    // Check if the button section is roughly in view (optimization)
    const firstButtonRect = cityButtons[0].getBoundingClientRect();
    if (firstButtonRect.bottom < 0 || firstButtonRect.top > window.innerHeight) {
        // Section not visible, maybe reset buttons if needed?
        // cityButtons.forEach(btn => btn.style.transform = 'translateY(0)');
        return;
    }

    const maxOffsetVh = 2.5; // 2.5vh up or down
    const maxOffsetPx = (maxOffsetVh / 100) * window.innerHeight;
    // Use a factor based on scroll position to drive the sine wave
    // Modulo ensures the pattern repeats, adjust 500 for frequency
    const scrollFactor = (window.scrollY % 500) / 500;

    cityButtons.forEach((btn, index) => {
        // Calculate offset using sine wave. Add PI for odd buttons to alternate phase.
        const phaseOffset = (index % 2 === 0) ? 0 : Math.PI;
        const translateYValue = Math.sin(scrollFactor * Math.PI * 2 + phaseOffset) * maxOffsetPx;
        btn.style.transform = `translateY(${translateYValue.toFixed(2)}px)`;
    });
}

function throttledScrollHandler() {
    const now = Date.now();
    if (now - lastScrollTime < throttleDelay) {
        // Clear any existing timeout to ensure the latest scroll event gets processed after delay
        clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            lastScrollTime = Date.now();
            handleCityButtonScrollAnimation();
        }, throttleDelay);
    } else {
        lastScrollTime = now;
        handleCityButtonScrollAnimation();
    }
}
// --- End City Button Animation ---

// --- DOMContentLoaded ---
// This should be the very last thing executed
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed");
  setupMainPageListeners();
  // // REMOVED: loadTrendingHustles(); // Ensure this is NOT called on initial load

  // --- Scroll Animation Logic ---
  const scrollElements = document.querySelectorAll('.scroll-animate');

  const elementObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // If the element is intersecting (visible)
      if (entry.isIntersecting) {
        // Add the 'is-visible' class
        entry.target.classList.add('is-visible');
        // Stop observing the element once it's visible
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1 // Trigger when 10% of the element is visible
  });

  scrollElements.forEach(el => {
    elementObserver.observe(el);
  });
  // --- End Scroll Animation Logic ---



  // --- FAQ Accordion Logic ---
  const faqToggles = document.querySelectorAll('.faq-toggle');
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling; // Assumes content div is immediately after button
      const icon = toggle.querySelector('svg');

      if (content && content.classList.contains('faq-content')) {
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180'); // Assumes you have a CSS class for rotation
      }
    });
  });

  // --- Add Scroll Listener for City Button Animation ---
  window.addEventListener('scroll', throttledScrollHandler);
  // --- End Scroll Listener ---

  // Add other initializations if needed (e.g., mobile menu, FAQ toggles)
});


// --- Trending Hustles Logic ---

const popularCities = ['New York', 'London', 'Tokyo', 'Los Angeles', 'Chicago', 'Paris', 'Berlin', 'Sydney', 'Toronto', 'Singapore', 'Dubai', 'Mumbai'];

const trendingCardStyles = [
  { // Style 1 (Indigo/Purple)
    gradient: 'from-indigo-50 to-purple-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>`
  },
  { // Style 2 (Yellow/Orange)
    gradient: 'from-yellow-50 to-orange-50',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
  },
  { // Style 3 (Blue/Cyan)
    gradient: 'from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>`
  },
   { // Style 4 (Green/Teal)
    gradient: 'from-green-50 to-teal-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`
  }
];

async function loadTrendingHustles(targetCity) {
  const container = document.getElementById('trending-cards-container');
    const cityInput = document.getElementById('trending-city-input');
    const refreshBtn = document.getElementById('refresh-trending-btn');
    const description = container?.closest('section')?.querySelector('p');

    if (!container || !cityInput || !refreshBtn || !description || !targetCity) {
        console.error("Missing required elements or target city for loading trending hustles.");
        if(container) container.innerHTML = `<div class="error-placeholder" style="text-align: center; padding: 2rem; color: #ef4444; width: 100%; align-self: center;">Could not load. Please enter a city and try again.</div>`;
    return;
  }

    // ---> Clear container BEFORE showing loading state <---
    container.innerHTML = '';
    // ---> Apply Flex for Loader Centering <---
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.minHeight = '200px'; // Ensure container has height for loader

    // ---> Loading State <---
    description.textContent = `Loading trends ${targetCity ? 'for ' + targetCity : ''}...`; // Update loading text
    container.innerHTML = `
        <div class="loading-indicator" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
            <div style="border: 4px solid #f3f4f6; border-top: 4px solid #fbbf24; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 0.75rem; color: #6b7280;">Fetching hustle ideas for ${targetCity}...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
    refreshBtn.disabled = true;
    refreshBtn.classList.add('loading');
    // ---> End of Loading State <---

    try {
        // Modify prompt based on whether a query (city or passion) was provided
        const prompt = targetCity
          ? `Generate 4 brief, currently trending side hustle ideas related to "${targetCity}" (this could be a city or a passion/topic). For each, provide:\n1. Name: [Hustle Name]\n2. Location: [A relevant major city OR 'Remote']\n3. Description: [A single, concise sentence describing the hustle and its connection to "${targetCity}"]\n\nFormat each hustle clearly, separated by a blank line.`
          : `Generate 4 brief, currently trending side hustle ideas suitable for major cities. For each, provide:\n1. Name: [Hustle Name]\n2. Location: [A relevant major city, e.g., New York, London, Tokyo]\n3. Description: [A single, concise sentence describing the hustle]\n\nFormat each hustle clearly, separated by a blank line. Example:\nName: AI Prompt Engineer\nLocation: San Francisco\nDescription: Craft high-quality prompts for AI models to generate desired outputs for businesses.`;

        // Call Gemini with the constructed prompt
        let hustleResults = await fetchHustleFromGemini(targetCity, 0, true); // Pass city/query, not the prompt

        if (hustleResults && hustleResults.length > 0) {
            renderTrendingHustles(hustleResults.slice(0, 4), targetCity);
            description.textContent = `See what's hot right now in ${targetCity}`;
        } else {
            console.log(`No trending hustles found for ${targetCity}.`);
            container.innerHTML = `<div class="error-placeholder" style="text-align: center; padding: 2rem; color: #9ca3af; width: 100%; align-self: center;">Could not find trending hustles for ${targetCity}. Try another city.</div>`;
            description.textContent = `Could not find trends for ${targetCity}. Try another city.`;
        }
    } catch (error) {
        console.error(`Error loading trending hustles for ${targetCity}:`, error);
        container.innerHTML = `<div class="error-placeholder" style="text-align: center; padding: 2rem; color: #ef4444; width: 100%; align-self: center;">Error loading trending hustles for ${targetCity}. Please try again.</div>`;
        description.textContent = `Error loading trends for ${targetCity}.`;
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.classList.remove('loading');
        if (refreshBtn.hasAttribute('data-original-text')) {
            refreshBtn.textContent = refreshBtn.getAttribute('data-original-text');
            refreshBtn.removeAttribute('data-original-text');
        }
        if (container.children.length > 0 && !container.querySelector('.loading-indicator') && !container.querySelector('.error-placeholder')) {
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'stretch';
    } else {
            container.style.alignItems = 'center';
        }
    }
}

function renderTrendingHustles(hustles, city) {
  const container = document.getElementById('trending-cards-container');

  if (!container) return;

    container.innerHTML = '';

    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'stretch';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1.5rem';
    container.style.minHeight = '';
    container.classList.remove('scroll-snap', 'no-scrollbar', 'overflow-x-auto');
    container.style.scrollSnapType = '';

    if (!Array.isArray(hustles) || hustles.length === 0) {
        console.error("renderTrendingHustles called with no hustles");
        return;
    }

    hustles.forEach((hustle, index) => {
        if (hustle && typeof hustle === 'object') {
            const card = createTrendingHustleCard(hustle, index, city);
            container.appendChild(card);
        } else {
            console.warn("Skipping invalid trending hustle data:", hustle);
        }
    });


}

function createTrendingHustleCard(hustleData, index, city) {
  const card = document.createElement('div');
    const style = trendingCardStyles[index % trendingCardStyles.length];

    card.className = `flex flex-col flex-shrink-0 w-72 bg-gradient-to-br ${style.gradient} rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow card-hover`;

    const hustleName = hustleData.name || 'Trending Hustle Idea';
    const hustleCity = city || hustleData.city || 'Unknown City';
    const hustleSummary = hustleData.summary || 'An exciting new opportunity available now.';

  card.innerHTML = `
        <div class="icon-container ${style.iconBg} ${style.iconColor} mb-4 w-12 h-12 rounded-lg flex items-center justify-center">
            ${style.iconSvg}
    </div>
        <h3 class="font-bold text-xl mb-2">${hustleName}</h3>
        <p class="text-gray-600 text-sm mb-4">${hustleCity}</p>
        <p class="text-gray-700 mb-6">${hustleSummary}</p>
        <button
            class="trending-details-btn w-full py-3 px-4 bg-white rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200 flex items-center justify-center space-x-2"
            data-hustle-name="${hustleName}"
            data-hustle-city="${hustleCity}"
            type="button"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>See Details</span>
        </button>
  `;

  return card;
}