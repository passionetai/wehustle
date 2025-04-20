// WeHustleIt Blog JavaScript

// Global variables
let currentPage = 1;
let postsPerPage = CMS_CONFIG ? CMS_CONFIG.postsPerPage : 8;
let allPosts = [];
let filteredPosts = [];
let categories = [];
let tags = [];

// DOM Elements (will be initialized after DOM is loaded)
let blogPosts;
let blogSearch;
let categoryFilter;
let sortPosts;
let prevPageBtn;
let nextPageBtn;
let currentPageSpan;
let totalPagesSpan;
let noResults;
let resetFiltersBtn;

// Data Loading Functions
async function loadData() {
    try {
        // For local development without a server, we'll use a fallback to localStorage
        let data;

        // First try to get from localStorage (most recent data)
        const backupData = localStorage.getItem('cms_data_backup');

        if (backupData) {
            data = JSON.parse(backupData);
            console.log('Using data from localStorage');
        } else {
            try {
                // If no localStorage data, try to fetch from file
                const response = await fetch('cms/posts/posts.json');
                data = await response.json();
                console.log('Using data from file');
            } catch (error) {
                console.error('Could not fetch data from file:', error);
                throw new Error('No blog data available');
            }
        }

        allPosts = data.posts || [];
        categories = data.categories || [];
        tags = data.tags || [];

        filteredPosts = [...allPosts];

        // Initialize UI
        populateCategoryFilter();
        applyFilters(); // This will also render posts
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load blog posts. Please try again later.');
    }
}

function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Post Rendering Functions
function renderPosts() {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    blogPosts.innerHTML = '';

    if (postsToShow.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    postsToShow.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'bg-white rounded-xl shadow-lg overflow-hidden flex flex-col card-hover';

        const date = new Date(post.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        postElement.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-6 flex flex-col flex-grow">
                <div class="flex items-center text-xs text-gray-500 mb-2">
                    <span>${formattedDate}</span>
                    <span class="mx-2">•</span>
                    <span>${post.categories.join(', ')}</span>
                </div>
                <h2 class="text-xl font-bold mb-2 text-gray-800">${post.title}</h2>
                <p class="text-gray-600 text-sm mb-4 flex-grow">${post.excerpt}</p>
                <a href="blog/${post.slug}.html" class="mt-auto text-yellow-600 hover:text-orange-500 font-semibold text-sm">Read More &rarr;</a>
            </div>
        `;

        blogPosts.appendChild(postElement);
    });

    // Update pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Filter Functions
function applyFilters() {
    const searchTerm = blogSearch.value.trim().toLowerCase();
    const categoryValue = categoryFilter.value;
    const sortValue = sortPosts.value;

    filteredPosts = allPosts.filter(post => {
        // Apply search filter
        const matchesSearch = searchTerm === '' ||
            post.title.toLowerCase().includes(searchTerm) ||
            post.excerpt.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm);

        // Apply category filter
        const matchesCategory = categoryValue === '' || post.categories.includes(categoryValue);

        return matchesSearch && matchesCategory;
    });

    // Apply sorting
    if (sortValue === 'newest') {
        filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === 'oldest') {
        filteredPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortValue === 'title') {
        filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Reset to first page
    currentPage = 1;

    renderPosts();
}

function resetFilters() {
    blogSearch.value = '';
    categoryFilter.value = '';
    sortPosts.value = 'newest';

    filteredPosts = [...allPosts];
    currentPage = 1;

    renderPosts();
}

function showError(message) {
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    errorElement.innerHTML = `
        <span class="block sm:inline">${message}</span>
        <button class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
        </button>
    `;

    document.body.appendChild(errorElement);

    // Add click event to close button
    const closeButton = errorElement.querySelector('button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(errorElement);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(errorElement)) {
            document.body.removeChild(errorElement);
        }
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    blogPosts = document.getElementById('blog-posts');
    blogSearch = document.getElementById('blog-search');
    categoryFilter = document.getElementById('category-filter');
    sortPosts = document.getElementById('sort-posts');
    prevPageBtn = document.getElementById('prev-page');
    nextPageBtn = document.getElementById('next-page');
    currentPageSpan = document.getElementById('current-page');
    totalPagesSpan = document.getElementById('total-pages');
    noResults = document.getElementById('no-results');
    resetFiltersBtn = document.getElementById('reset-filters');

    // Check if we're on the blog page
    if (blogPosts) {
        // Load data
        loadData();

        // Add event listeners
        blogSearch.addEventListener('input', () => {
            // Debounce search input
            clearTimeout(blogSearch.timer);
            blogSearch.timer = setTimeout(() => {
                applyFilters();
            }, 300);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            applyFilters();
        });

        categoryFilter.addEventListener('change', applyFilters);
        sortPosts.addEventListener('change', applyFilters);

        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPosts();
                // Scroll to top of blog posts
                blogPosts.scrollIntoView({ behavior: 'smooth' });
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderPosts();
                // Scroll to top of blog posts
                blogPosts.scrollIntoView({ behavior: 'smooth' });
            }
        });

        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Check if we're on a single blog post page
    const postContent = document.getElementById('post-content');
    if (postContent) {
        loadSinglePost();
    }
});

// Single Post Page Functions
async function loadSinglePost() {
    try {
        // Get post ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (!postId) {
            showError('Post not found.');
            return;
        }

        // Load posts data
        let data;

        // First try to get from localStorage (most recent data)
        const backupData = localStorage.getItem('cms_data_backup');

        if (backupData) {
            data = JSON.parse(backupData);
            console.log('Using data from localStorage for single post');
        } else {
            try {
                // If no localStorage data, try to fetch from file
                const response = await fetch('cms/posts/posts.json');
                data = await response.json();
                console.log('Using data from file for single post');
            } catch (error) {
                console.error('Could not fetch data from file:', error);
                throw new Error('No blog data available');
            }
        }

        const post = data.posts.find(p => p.id === postId);

        if (!post) {
            showError('Post not found.');
            return;
        }

        // Update page title
        document.title = `${post.title} - WeHustle It Blog`;

        // Update meta tags
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', post.excerpt);
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', `${post.title} - WeHustle It Blog`);
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.setAttribute('content', post.excerpt);
        }

        // Render post
        renderSinglePost(post);

        // Load related posts
        loadRelatedPosts(post, data.posts);
    } catch (error) {
        console.error('Error loading post:', error);
        showError('Failed to load blog post. Please try again later.');
    }
}

function renderSinglePost(post) {
    const postTitle = document.getElementById('post-title');
    const postMeta = document.getElementById('post-meta');
    const postImage = document.getElementById('post-image');
    const postContent = document.getElementById('post-content');
    const postCategories = document.getElementById('post-categories');
    const postTags = document.getElementById('post-tags');

    if (!postTitle || !postMeta || !postImage || !postContent) {
        return;
    }

    // Format date
    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update elements
    postTitle.textContent = post.title;

    postMeta.innerHTML = `
        <span class="text-gray-600">${formattedDate}</span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="text-gray-600">By ${post.author}</span>
    `;

    postImage.src = post.image;
    postImage.alt = post.title;

    postContent.innerHTML = post.content;

    // Render categories
    if (postCategories) {
        postCategories.innerHTML = '';
        post.categories.forEach(category => {
            const link = document.createElement('a');
            link.href = `blog.html?category=${encodeURIComponent(category)}`;
            link.className = 'inline-block bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2';
            link.textContent = category;
            postCategories.appendChild(link);
        });
    }

    // Render tags
    if (postTags) {
        postTags.innerHTML = '';
        post.tags.forEach(tag => {
            const link = document.createElement('a');
            link.href = `blog.html?tag=${encodeURIComponent(tag)}`;
            link.className = 'inline-block bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2';
            link.textContent = tag;
            postTags.appendChild(link);
        });
    }
}

function loadRelatedPosts(currentPost, allPosts) {
    const relatedPostsContainer = document.getElementById('related-posts');
    if (!relatedPostsContainer) return;

    // Find posts with matching categories or tags
    const relatedPosts = allPosts.filter(post => {
        if (post.id === currentPost.id) return false; // Skip current post

        // Check for matching categories
        const hasMatchingCategory = post.categories.some(category =>
            currentPost.categories.includes(category)
        );

        // Check for matching tags
        const hasMatchingTag = post.tags.some(tag =>
            currentPost.tags.includes(tag)
        );

        return hasMatchingCategory || hasMatchingTag;
    });

    // Sort by date (newest first) and take up to 3
    relatedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const postsToShow = relatedPosts.slice(0, 3);

    // Render related posts
    relatedPostsContainer.innerHTML = '';

    if (postsToShow.length === 0) {
        relatedPostsContainer.innerHTML = '<p class="text-gray-500 text-center">No related posts found.</p>';
        return;
    }

    postsToShow.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'bg-white rounded-xl shadow-lg overflow-hidden flex flex-col card-hover';

        const date = new Date(post.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        postElement.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-6 flex flex-col flex-grow">
                <div class="flex items-center text-xs text-gray-500 mb-2">
                    <span>${formattedDate}</span>
                    <span class="mx-2">•</span>
                    <span>${post.categories.join(', ')}</span>
                </div>
                <h2 class="text-xl font-bold mb-2 text-gray-800">${post.title}</h2>
                <p class="text-gray-600 text-sm mb-4 flex-grow">${post.excerpt}</p>
                <a href="blog/${post.slug}.html" class="mt-auto text-yellow-600 hover:text-orange-500 font-semibold text-sm">Read More &rarr;</a>
            </div>
        `;

        relatedPostsContainer.appendChild(postElement);
    });
}
