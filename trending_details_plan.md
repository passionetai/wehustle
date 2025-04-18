# Plan: Display Trending Hustle Details

**Objective:** Implement functionality for the "See Details" button in the "Trending Hustles" section of `newindex.html`. When clicked, fetch the full details for the specific hustle and display them in the main results area (`#hustle-output`).

**Approach:** Search Integration (Leverage existing search/display logic).

## Steps:

1.  **Modify `createTrendingHustleCard` function (in `newjs.js`):**
    *   Add `data-hustle-name` and `data-hustle-city` attributes to the "See Details" button, storing the hustle's name and city.
    *   Add a unique class `trending-details-btn` to the button.

2.  **Modify `fetchHustleFromGemini` function (in `newjs.js`):**
    *   Add an optional parameter `specificHustleName = null`.
    *   Adjust the prompt logic:
        *   If `specificHustleName` is provided, prompt the API for full details of *only* that hustle in the given city.
        *   Otherwise, use the existing prompt for 3 diverse hustles.
    *   Ensure `parseHustles` handles responses containing only one hustle.

3.  **Create `displaySpecificHustleDetails` function (in `newjs.js`):**
    *   Takes `hustleName` and `city` as arguments.
    *   Calls `showHustleLoading(city)` (potentially with modified text).
    *   Calls `fetchHustleFromGemini(city, 0, false, hustleName)`.
    *   Calls `renderHustles` with the single hustle result.
    *   Calls `scrollToHustleOutput()`.

4.  **Add Event Listener (in `newjs.js`):**
    *   Add a delegated event listener for `.trending-details-btn` clicks within `#trending-cards-container`.
    *   On click:
        *   Prevent default action.
        *   Get `hustleName` and `city` from the button's data attributes.
        *   Call `displaySpecificHustleDetails(hustleName, city)`.

## Flow Diagram (Mermaid):

```mermaid
graph TD
    A[User Clicks "See Details" on Trending Card] --> B{Event Listener (.trending-details-btn)};
    B --> C[Get hustleName & city from data attributes];
    C --> D[Call displaySpecificHustleDetails(hustleName, city)];
    D --> E[showHustleLoading()];
    D --> F[Call fetchHustleFromGemini(city, specificHustleName)];
    F --> G{API Call (Prompt for specific hustle)};
    G --> H[API Response (Details for 1 hustle)];
    H --> I[parseHustles (Handles 1 hustle)];
    I --> J[renderHustles (Displays 1 hustle in #hustle-output)];
    J --> K[scrollToHustleOutput()];

    subgraph newjs.js Functions
        D
        E
        F
        I
        J
        K
    end

    subgraph HTML Elements
        A
    end