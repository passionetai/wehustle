# Plan: Add Google reCAPTCHA v2 to Search Forms

**Goal:** Implement Google reCAPTCHA v2 ("I'm not a robot" checkbox) on the main city search and quick city search forms in `index.html` to prevent bot submissions.

**Target Forms:**
*   Main city search (`#city-input` + `#get-hustle-btn`) in `index.html`
*   Quick city search (`#quick-city-input` + `#quick-search-btn`) in `index.html`

**CAPTCHA Service:** Google reCAPTCHA v2 ("I'm not a robot" Checkbox)

**Prerequisites (User Action):**

1.  Go to the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/).
2.  Register your site (e.g., `wehustle.it`).
3.  Choose **reCAPTCHA v2** -> **"I'm not a robot" Checkbox**.
4.  Accept the terms of service.
5.  Obtain the **Site Key** and **Secret Key**. These are required for implementation.

**Implementation Steps:**

1.  **Frontend (`index.html`):**
    *   **Add reCAPTCHA API Script:** Include `<script src="https://www.google.com/recaptcha/api.js" async defer></script>` in the `<head>`.
    *   **Add reCAPTCHA Widgets:**
        *   Place `<div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>` near the main search button (`#get-hustle-btn`). Replace `YOUR_SITE_KEY` with your actual Site Key.
        *   Place `<div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>` near the quick search button (`#quick-search-btn`). Replace `YOUR_SITE_KEY` with your actual Site Key.

2.  **Frontend (`script.js`):**
    *   **Modify Form Submission Logic:** Update the JavaScript event listeners for `#get-hustle-btn` and `#quick-search-btn`.
    *   **Check CAPTCHA:** Before sending data to the server, use `grecaptcha.getResponse()` for the relevant widget. Check if the response is empty.
    *   **Get Token:** If the response is not empty, it's the `g-recaptcha-response` token.
    *   **Include Token:** Add this token to the data sent to the backend (e.g., as part of the form data or request body).
    *   **Error Handling:** If the CAPTCHA response is empty, prevent form submission and display an error message (e.g., "Please complete the CAPTCHA").

3.  **Backend (Server-Side Logic - Conceptual):**
    *   *(Requires implementation on your server)*
    *   **Receive Token:** Modify server endpoint(s) handling search requests to receive the `g-recaptcha-response` token.
    *   **Verify Token:** Make a server-to-server POST request to `https://www.google.com/recaptcha/api/siteverify`.
        *   **Payload:** `secret=YOUR_SECRET_KEY&response=TOKEN_FROM_FRONTEND` (Replace `YOUR_SECRET_KEY` and `TOKEN_FROM_FRONTEND`).
    *   **Process Response:** Check the `success` field in Google's JSON response.
        *   `true`: Proceed with search.
        *   `false`: Reject request (bot).

4.  **Styling (`styles.css` - Optional):**
    *   Add CSS rules if needed to adjust the layout/spacing of the reCAPTCHA widgets.

**Diagram:**

```mermaid
graph TD
    A[User: Get reCAPTCHA Keys] --> B(Frontend: index.html);
    B --> C[Add API Script];
    B --> D[Add Widget 1 (Main Search)];
    B --> E[Add Widget 2 (Quick Search)];

    F(Frontend: script.js) --> G{Handle Main Search Submit};
    G --> H[Check reCAPTCHA 1];
    H -- Solved --> I[Get Token 1];
    I --> J[Send City + Token 1 to Backend];
    H -- Not Solved --> K[Show Error];

    F --> L{Handle Quick Search Submit};
    L --> M[Check reCAPTCHA 2];
    M -- Solved --> N[Get Token 2];
    N --> O[Send City + Token 2 to Backend];
    M -- Not Solved --> P[Show Error];

    Q(Backend: Server Endpoint) --> R{Receive Request};
    R --> S[Verify Token w/ Google (Secret Key)];
    S -- Success --> T[Process Search];
    S -- Failure --> U[Reject Request];

    V(Styling: styles.css) --> W[Adjust Widget Style];

    subgraph Frontend
        direction LR
        B --- F --- V
    end

    subgraph Backend
        Q
    end

    C & D & E --> F;
    J & O --> Q;
    T & U --> X(End);
    K & P & W --> X;

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style Q fill:#ccf,stroke:#333,stroke-width:2px