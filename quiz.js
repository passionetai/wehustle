// quiz.js - Hustle Quiz Functionality

// Show debug status in UI for troubleshooting
const DEBUG = false;

// Gemini API Configuration is now imported from script.js
// The GEMINI_CONFIG declaration has been removed to avoid duplication

// Store previously generated hustles for uniqueness
const PREVIOUS_HUSTLES = JSON.parse(localStorage.getItem('previousHustles')) || [];

// Debug logging function
function log(message, data) {
    if (DEBUG) {
        console.log(message, data || '');
        updateDebugStatus(message);
    }
}

// Update debug status UI
function updateDebugStatus(message) {
    if (DEBUG) {
        const statusDisplay = document.getElementById('debug-status');
        const statusMessage = document.getElementById('status-message');
        
        if (statusDisplay && statusMessage) {
            statusDisplay.style.display = 'block';
            statusMessage.textContent = message;
        }
    }
}

// Wait for DOM to be fully loaded
log('Quiz.js loading...');

let currentStep = 1;
const totalSteps = 5; // Assuming 5 questions based on HTML structure

document.addEventListener('DOMContentLoaded', function() {
    log('DOM loaded, initializing quiz');
    initDebugUI();
    initQuizNavigation(); // Setup Next/Prev buttons
    initScrollToTopButton();
    showStep(currentStep); // Show the first step initially
    log('Quiz initialization complete');
});

// Initialize debug UI
function initDebugUI() {
    const debugUI = document.getElementById('debug-status');
    if (!debugUI && DEBUG) {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-status';
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '80px';
        debugDiv.style.right = '20px';
        debugDiv.style.background = 'rgba(0,0,0,0.7)';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '10px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.maxWidth = '300px';
        debugDiv.style.zIndex = '1000';
        
        const statusHTML = '<strong>Quiz Status:</strong> <span id="status-message">Initializing</span>';
        debugDiv.innerHTML = statusHTML;
        
        document.body.appendChild(debugDiv);
    }
}

// Initialize quiz form
// Renamed from initQuizForm - now only handles final submission
function setupQuizSubmission() {
     const form = document.getElementById('hustle-quiz');
     const submitButton = document.getElementById('submit-btn'); // Use ID now

     if (!form || !submitButton) {
         log('Error: Quiz form or submit button not found!');
         return;
     }

     log('Setting up final submit listener');

     // Remove previous listeners if any (safer)
     const newSubmitButton = submitButton.cloneNode(true);
     submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

     newSubmitButton.addEventListener('click', function(e) {
         e.preventDefault();
         log('Submit button clicked');
         if (validateStep(currentStep)) { // Validate last step before submitting
            processQuizSubmission();
         } else {
            alert('Please answer the current question.');
         }
     });
}

// Function to validate if an answer is selected for the current step
function validateStep(stepNumber) {
    const currentStepDiv = document.getElementById(`step${stepNumber}`);
    if (!currentStepDiv) return false;
    const selectedAnswer = currentStepDiv.querySelector(`input[name="q${stepNumber}"]:checked`);
    return selectedAnswer !== null;
}


// Function to handle Next/Prev button clicks and step transitions
function initQuizNavigation() {
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (!nextBtn || !prevBtn || !submitBtn) {
        log('Error: Navigation buttons not found!');
        return;
    }

    nextBtn.addEventListener('click', () => {
        log(`Next button clicked on step ${currentStep}`);
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        } else {
            alert('Please select an answer before proceeding.');
            log(`Validation failed for step ${currentStep}`);
        }
    });

    prevBtn.addEventListener('click', () => {
        log(`Previous button clicked on step ${currentStep}`);
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    // Final submission listener setup is now separate
    setupQuizSubmission();
}

// Function to show the correct step and update UI elements
function showStep(stepNumber) {
    log(`Showing step ${stepNumber}`);
    const steps = document.querySelectorAll('.quiz-step');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBar = document.getElementById('quiz-progress-bar');
    const questionNumberDisplay = document.getElementById('current-question-number');

    steps.forEach(step => step.classList.add('hidden'));

    const currentStepDiv = document.getElementById(`step${stepNumber}`);
    if (currentStepDiv) {
        currentStepDiv.classList.remove('hidden');
    } else {
        log(`Error: Step div not found for step ${stepNumber}`);
        return; // Avoid errors if step div doesn't exist
    }

    // Update Progress Bar & Question Number
    if (progressBar) {
        const progressPercentage = (stepNumber / totalSteps) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
     if (questionNumberDisplay) {
        questionNumberDisplay.textContent = stepNumber;
    }


    // Update Button Visibility & State
    if (prevBtn) {
        prevBtn.disabled = stepNumber === 1;
    }
    if (nextBtn) {
        nextBtn.classList.toggle('hidden', stepNumber === totalSteps);
    }
     if (submitBtn) {
        submitBtn.classList.toggle('hidden', stepNumber !== totalSteps);
    }
}

// Process the quiz submission
function processQuizSubmission() {
    // Get form values
    const workPreference = document.querySelector('input[name="q1"]:checked')?.value;
    const hoursCommitment = document.querySelector('input[name="q2"]:checked')?.value;
    const skillLevel = document.querySelector('input[name="q3"]:checked')?.value;
    const interest = document.querySelector('input[name="q4"]:checked')?.value;
    const budget = document.querySelector('input[name="q5"]:checked')?.value;
    
    log(`Selected preferences: Work: ${workPreference}, Hours: ${hoursCommitment}, Skill: ${skillLevel}, Interest: ${interest}, Budget: ${budget}`);
    
    // Validate inputs
    if (!workPreference || !hoursCommitment || !skillLevel || !interest || !budget) {
        alert('Please answer all questions before submitting.');
        log('Validation failed: Missing answers');
        return;
    }
    
    // Show loading UI
    showLoadingUI();
    
    // Get hustle recommendation
    log('Getting hustle recommendation from Gemini API');
    getHustleRecommendation(workPreference, hoursCommitment, skillLevel, interest, budget)
        .then(result => {
            // Validate and post-process the result
            const validatedResult = validateAndRefineResult(result);
            if (validatedResult) {
                displayResults(validatedResult);
                // Store the hustle name for uniqueness
                PREVIOUS_HUSTLES.push(validatedResult.name);
                localStorage.setItem('previousHustles', JSON.stringify(PREVIOUS_HUSTLES));
            } else {
                // Retry with a modified prompt
                log('Result validation failed, retrying with modified prompt');
                getHustleRecommendation(workPreference, hoursCommitment, skillLevel, interest, budget, true)
                    .then(displayResults)
                    .catch(handleError);
            }
        })
        .catch(handleError);
}

// Show loading UI with a random tip
function showLoadingUI() {
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) {
        log('Error: Quiz container not found');
        return;
    }
    
    log('Showing loading UI');
    
    // Random loading tip
    const tips = [
        "Did you know? 80% of successful side hustles start with a clear plan.",
        "Pro tip: Networking with local entrepreneurs can boost your hustle.",
        "Fun fact: The gig economy is expected to grow by 15% in 2025!"
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    quizContainer.innerHTML = `
        <div class="loading">
            <div class="loader-circle"></div>
            <span>Finding your perfect hustle based on your preferences...</span>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div style="font-size: 0.8em; margin-top: 10px; color: #666;">
                We are generating a unique hustle idea just for you. This takes up to 15 seconds. Please be patient.
            </div>
            <div style="font-size: 0.9em; margin-top: 10px; color: #007AFF;">
                ${randomTip}
            </div>
        </div>
    `;
    
    // Start progress animation
    startProgressBar();
}

// Start progress bar animation
function startProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    if (!progressFill) {
        log('Error: Progress bar element not found');
        return;
    }
    
    log('Starting progress animation');
    
    progressFill.style.width = '0%';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 20;
        if (progress > 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressFill.style.width = `${progress}%`;
        log(`Progress: ${progress}%`);
    }, 3000);
}

// Get hustle recommendation from Gemini API or fallback
async function getHustleRecommendation(workPreference, hoursCommitment, skillLevel, interest, budget, retry = false) {
    try {
        log('Attempting to call Gemini API');
        const result = await generateHustleWithGemini(workPreference, hoursCommitment, skillLevel, interest, budget, retry);
        log('API call successful', result);
        return result;
    } catch (error) {
        log('API call failed, using fallback', error);
        return getFallbackHustle(workPreference, hoursCommitment, skillLevel, interest, budget);
    }
}

// Generate hustle using Gemini API
async function generateHustleWithGemini(workPreference, hoursCommitment, skillLevel, interest, budget, retry) {
    try {
        // Convert form values to descriptive terms
        const workDesc = workPreference === 'outdoors' ? 'outdoors/in-person' : 'indoors/remote';
        
        let timeDesc;
        if (hoursCommitment === 'less10') {
            timeDesc = 'less than 10 hours per week (very part-time)';
        } else if (hoursCommitment === '10-20') {
            timeDesc = '10-20 hours per week (moderate time commitment)';
        } else {
            timeDesc = 'more than 20 hours per week (significant time commitment)';
        }
        
        const skillDesc = skillLevel === 'beginner' ? 'beginner with no prior experience' : 
                        skillLevel === 'intermediate' ? 'intermediate with some experience' : 
                        'advanced with strong skills';
        
        const interestDesc = interest === 'creative' ? 'creative work like art or design' : 
                           interest === 'technical' ? 'technical work like tech or data analysis' : 
                           'social work like events or teaching';
        
        const budgetDesc = budget === 'low' ? 'low budget under $100' : 
                         budget === 'medium' ? 'medium budget between $100 and $500' : 
                         'high budget over $500';
        
        log(`Creating prompt for ${workDesc}, ${timeDesc}, ${skillDesc}, ${interestDesc}, ${budgetDesc}`);
        
        // Create prompt for Gemini
        let prompt = `Generate a unique, unconventional side hustle idea for someone who prefers working ${workDesc}, can commit ${timeDesc}, has a skill level of ${skillDesc}, is interested in ${interestDesc}, and has a ${budgetDesc}.

        The hustle should be highly creative, specific, and realistic, tailored to the user's preferences. It must be adaptable to any city and not tied to a specific location. Avoid generic ideas like "freelance writer," "Etsy seller," or "dog walker." Instead, think of innovative, niche ideas that align with the user's interests and constraints.

        Examples of unique hustles:
        - "Urban Foraging Guide": Leading tours to teach people how to forage edible plants in city parks (outdoors, social interest, low budget).
        - "Virtual Reality Memory Lane": Creating VR experiences for seniors to relive past memories (indoors, technical interest, high budget).
        - "Eco-Friendly Micro-Gardening Kits": Selling DIY kits for small-space gardening with a focus on sustainability (outdoors, creative interest, medium budget).

        Do not repeat any of these previously generated hustles: ${PREVIOUS_HUSTLES.join(', ') || 'none'}. Ensure the idea is completely new and distinct.

        Format your response using this EXACT structure, including all sections:

        Name: [Unique and catchy name for the hustle]

        Description: [3-4 sentences describing the hustle concept, target market, and unique value proposition]

        Earnings: [Realistic $/month range AND potential hourly rate range, e.g., "$500-$1200/month ($25-$40/hour)"]
        Earning Factors: [Briefly explain 1-2 key factors influencing earnings potential, e.g., "Depends on number of clients and local demand"]

        Difficulty: [Easy/Medium/Hard - with brief justification]

        Benefits:
        1. [Specific benefit 1]
        2. [Specific benefit 2]
        3. [Specific benefit 3]

        Action Steps:
        1. [First step to get started]
        2. [Second step]
        3. [Third step]
        4. [Fourth step]

        Provide ONLY this structured response with NO additional text.`;
        
        // Modify prompt on retry to encourage better results
        if (retry) {
            prompt += `\n\nThe previous attempt did not meet quality standards. Please generate a more creative and specific idea, ensuring the earnings are realistic, the difficulty matches the user's skill level, and the action steps are actionable and detailed.`;
        }
        
        log('Making API request');
        
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 1.0, // Increase temperature for more creativity
                    maxOutputTokens: 1000
                }
            })
        });
        
        log(`API response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (!generatedText) {
            throw new Error('Empty response from API');
        }
        
        log('Parsing API response');
        return parseGeminiResponse(generatedText);
    } catch (error) {
        log('Gemini API error', error);
        throw error;
    }
}

// Parse Gemini response
function parseGeminiResponse(text) {
    try {
        const hustle = {
            name: '',
            description: '',
            earnings: '',
            difficulty: '',
            benefits: [],
            actionSteps: []
        };
        
        const nameMatch = text.match(/Name:\s*(.+?)(?=\n|$)/);
        if (nameMatch) hustle.name = nameMatch[1].trim();
        
        const descMatch = text.match(/Description:\s*(.+?)(?=\n\n|$)/s);
        if (descMatch) hustle.description = descMatch[1].trim();
        
        const earningsMatch = text.match(/Earnings:\s*(.+?)(?=\n|$)/);
        if (earningsMatch) hustle.earnings = earningsMatch[1].trim();
        
        const difficultyMatch = text.match(/Difficulty:\s*(.+?)(?=\n|$)/);
        if (difficultyMatch) hustle.difficulty = difficultyMatch[1].trim();
        
        const benefitsSection = text.match(/Benefits:\s*([\s\S]*?)(?=\n\nAction Steps:|$)/);
        if (benefitsSection) {
            const benefitLines = benefitsSection[1].match(/\d+\.\s*(.+?)(?=\n|$)/g) || [];
            hustle.benefits = benefitLines.map(line => line.replace(/^\d+\.\s*/, '').trim());
        }
        
        const stepsSection = text.match(/Action Steps:\s*([\s\S]*?)(?=\n\n|$)/);
        if (stepsSection) {
            const stepLines = stepsSection[1].match(/\d+\.\s*(.+?)(?=\n|$)/g) || [];
            hustle.actionSteps = stepLines.map(line => line.replace(/^\d+\.\s*/, '').trim());
        }
        
        if (!hustle.name || !hustle.description || !hustle.earnings) {
            throw new Error('Failed to parse complete hustle information');
        }
        
        log('Successfully parsed hustle data', hustle);
        return hustle;
    } catch (error) {
        log('Error parsing Gemini response', error);
        throw error;
    }
}

// Validate and refine the generated result
function validateAndRefineResult(result) {
    // Check for generic or low-quality results
    const genericKeywords = ['freelance', 'etsy', 'dog walker', 'tutor', 'delivery driver'];
    const isGeneric = genericKeywords.some(keyword => result.name.toLowerCase().includes(keyword) || result.description.toLowerCase().includes(keyword));
    
    if (isGeneric) {
        log('Result rejected: Generic idea detected');
        return null;
    }
    
    // Check if the result is a repeat
    if (PREVIOUS_HUSTLES.includes(result.name)) {
        log('Result rejected: Duplicate idea detected');
        return null;
    }
    
    // Validate earnings
    const earningsMatch = result.earnings.match(/\$(\d+)-?\$?(\d+)?/);
    if (!earningsMatch) {
        log('Result rejected: Invalid earnings format');
        return null;
    }
    const minEarnings = parseInt(earningsMatch[1], 10);
    const maxEarnings = parseInt(earningsMatch[2] || earningsMatch[1], 10);
    if (minEarnings < 100 || maxEarnings > 10000) {
        log('Result rejected: Unrealistic earnings');
        return null;
    }
    
    // Validate difficulty
    const difficultyLevels = ['Easy', 'Medium', 'Hard'];
    const difficultyText = result.difficulty.split('-')[0].trim();
    if (!difficultyLevels.includes(difficultyText)) {
        log('Result rejected: Invalid difficulty');
        return null;
    }
    
    // Validate benefits and action steps
    if (result.benefits.length < 3 || result.actionSteps.length < 4) {
        log('Result rejected: Incomplete benefits or action steps');
        return null;
    }
    
    // Refine earnings to ensure consistency
    result.earnings = `$${minEarnings}-$${maxEarnings} per month`;
    
    return result;
}

// Enhanced fallback hustle logic
function getFallbackHustle(workPreference, hoursCommitment, skillLevel, interest, budget) {
    log(`Using fallback hustle for ${workPreference}, ${hoursCommitment}, ${skillLevel}, ${interest}, ${budget}`);
    
    // Define a set of fallback hustles
    const fallbackHustles = [
        {
            name: 'Urban Foraging Guide',
            description: 'Lead small group tours in urban parks to teach people how to identify and forage edible plants, focusing on sustainability and local food sources.',
            earnings: '$600-$1,500 per month',
            difficulty: 'Medium - Requires knowledge of local plants and safety regulations.',
            benefits: ['Promotes sustainable living', 'Low startup costs', 'Engaging outdoor activity'],
            actionSteps: [
                'Research local edible plants and safety guidelines',
                'Create a tour itinerary and marketing materials',
                'Partner with local parks for permissions',
                'Promote tours through social media and community boards'
            ],
            match: { workPreference: 'outdoors', hoursCommitment: '10-20', skillLevel: 'intermediate', interest: 'social', budget: 'low' }
        },
        {
            name: 'Virtual Reality Memory Lane',
            description: 'Develop VR experiences for seniors to relive past memories, such as their childhood neighborhoods or historical events, using affordable VR tech.',
            earnings: '$1,200-$3,000 per month',
            difficulty: 'Hard - Requires technical skills in VR development.',
            benefits: ['Meaningful impact on seniors', 'High profit margins', 'Scalable to other demographics'],
            actionSteps: [
                'Learn basic VR development using Unity or Unreal Engine',
                'Interview seniors to gather memory details',
                'Create a few sample VR experiences',
                'Market to retirement homes and senior centers'
            ],
            match: { workPreference: 'indoors', hoursCommitment: 'more20', skillLevel: 'advanced', interest: 'technical', budget: 'high' }
        },
        {
            name: 'Eco-Friendly Micro-Gardening Kits',
            description: 'Design and sell DIY micro-gardening kits for small spaces, focusing on sustainable materials and native plants, perfect for urban dwellers.',
            earnings: '$800-$2,000 per month',
            difficulty: 'Medium - Needs creativity and basic sourcing skills.',
            benefits: ['Eco-friendly business', 'Flexible production schedule', 'Appeals to urban markets'],
            actionSteps: [
                'Source sustainable materials for kits',
                'Design a few kit prototypes with instructions',
                'Set up an online store on platforms like Shopify',
                'Promote through eco-friendly blogs and social media'
            ],
            match: { workPreference: 'outdoors', hoursCommitment: '10-20', skillLevel: 'intermediate', interest: 'creative', budget: 'medium' }
        },
        {
            name: 'Niche Podcast Producer',
            description: 'Offer podcast production services for niche communities, such as local history buffs or hobbyists, handling recording, editing, and distribution.',
            earnings: '$500-$1,800 per month',
            difficulty: 'Medium - Requires audio editing skills.',
            benefits: ['Work from home', 'Builds a portfolio', 'Recurring clients'],
            actionSteps: [
                'Learn audio editing with free tools like Audacity',
                'Identify niche communities in your area',
                'Offer a free pilot episode to attract clients',
                'Create a simple website to showcase services'
            ],
            match: { workPreference: 'indoors', hoursCommitment: 'less10', skillLevel: 'beginner', interest: 'creative', budget: 'low' }
        }
    ];
    
    // Score each hustle based on how well it matches the user's preferences
    const scoredHustles = fallbackHustles.map(hustle => {
        let score = 0;
        if (hustle.match.workPreference === workPreference) score += 3;
        if (hustle.match.hoursCommitment === hoursCommitment) score += 2;
        if (hustle.match.skillLevel === skillLevel) score += 2;
        if (hustle.match.interest === interest) score += 2;
        if (hustle.match.budget === budget) score += 1;
        return { hustle, score };
    });
    
    // Sort by score and pick the best match
    scoredHustles.sort((a, b) => b.score - a.score);
    const bestMatch = scoredHustles[0].hustle;
    
    return {
        name: bestMatch.name,
        description: bestMatch.description,
        earnings: bestMatch.earnings,
        difficulty: bestMatch.difficulty,
        benefits: bestMatch.benefits,
        actionSteps: bestMatch.actionSteps
    };
}

// Display results with a refine option
function displayResults(result) {
    log('Displaying results', result);
    
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) {
        log('Error: Quiz container not found for results display');
        return;
    }
    
    // Adapt quiz result data to match the structure expected by hustle card styling
    const hustleData = {
        name: result.name || "Recommended Hustle",
        summary: result.description || "Based on your quiz answers.",
        difficulty: result.difficulty || "N/A",
        profitability: result.earnings || "N/A", // Map earnings to profitability
        earningFactors: result.earningFactors || "", // Include earning factors
        cost: "N/A", // Quiz result doesn't provide cost
        metrics: {}, // Quiz result doesn't provide metrics
        actionPlan: result.actionSteps || [], // Map actionSteps to actionPlan
        resources: {}, // Quiz result doesn't provide resources
        monetization: [], // Quiz result doesn't provide monetization
        risks: [] // Quiz result doesn't provide risks
    };

    // Use structure similar to createHustleCard, omitting sections without data
    const resultsHTML = `
        <div class="hustle-card">
             <h3>${hustleData.name}</h3>
             
             <div class="hustle-details">
                 <p><strong>Summary:</strong> ${hustleData.summary}</p>
                 
                 <div class="hustle-metrics">
                     <span class="metric"><strong>Difficulty:</strong> ${hustleData.difficulty}</span>
                 </div>

                 <div class="metrics-section">
                    <h4>Potential Earnings</h4>
                    <div class="p-2 bg-green-50 rounded">
                        <p class="text-lg font-semibold text-green-800">${hustleData.profitability}</p>
                        ${hustleData.earningFactors ? `<p class="text-sm text-gray-600 mt-1">Factors: ${hustleData.earningFactors}</p>` : ''}
                    </div>
                 </div>

                 ${hustleData.actionPlan && hustleData.actionPlan.length > 0 ? `
                 <div class="action-plan-section">
                     <h4>Getting Started (Action Steps)</h4>
                         <div class="timeline">
                             ${hustleData.actionPlan.map(((plan, planIndex) => `
                                 <div class="timeline-item">
                                     <div class="timeline-marker">S${planIndex + 1}</div>
                                     <div class="timeline-content">${plan}</div>
                                 </div>
                             `)).join("")}
                         </div>
                 </div>` : ''}

                 <!-- Sections like Resources, Monetization, Risks are omitted as data isn't available from quiz result -->

             </div>
             <div class="result-actions mt-6 flex justify-center gap-4">
                 <a href="index.html#city-input" class="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">Find Similar Hustles</a>
                 <button class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors" onclick="window.location.reload()">Retake Quiz</button>
             </div>
        </div>
    `;
    
    quizContainer.innerHTML = resultsHTML;
    
    quizContainer.scrollIntoView({ behavior: 'smooth' });
    log('Results displayed successfully');
}

// Handle errors
function handleError(error) {
    log('Error occurred', error);
    
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) return;
    
    quizContainer.innerHTML = `
        <div class="error">
            <h3>Something went wrong</h3>
            <p>We couldn't generate your hustle recommendation. Please try again.</p>
            <button class="action-btn" onclick="window.location.reload()">Retry Quiz</button>
        </div>
    `;
}

// Initialize scroll to top button
function initScrollToTopButton() {
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    if (!scrollTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    });
    
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// initParticles function removed as particles.js is no longer used.