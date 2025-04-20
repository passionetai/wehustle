// WeHustleIt Blog Post JavaScript

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to get slug from URL path
function getSlugFromPath() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    // Remove .html extension if present
    return filename.replace(/\.html$/, '');
}

// Function to load a single blog post
async function loadBlogPost() {
    // Get post slug from URL
    let postSlug = getUrlParameter('slug');

    // If no slug parameter, try to get it from the path
    if (!postSlug) {
        postSlug = getSlugFromPath();
    }

    if (!postSlug) {
        showError('Post not found. Invalid URL.');
        return;
    }

    try {
        // Get blog posts data
        let data;

        // First try to get from localStorage (most recent data)
        const backupData = localStorage.getItem('cms_data_backup');

        if (backupData) {
            data = JSON.parse(backupData);
            console.log('Using data from localStorage for blog post');
        } else {
            try {
                // If no localStorage data, try to fetch from file
                const response = await fetch('../cms/posts/posts.json');
                data = await response.json();
                console.log('Using data from file for blog post');
            } catch (error) {
                console.error('Could not fetch data from file:', error);
                throw new Error('No blog data available');
            }
        }

        // Find the post by slug
        const post = data.posts.find(p => p.slug === postSlug);

        if (!post) {
            showError('Post not found.');
            return;
        }

        // Update page title and meta tags
        updateMetaTags(post);

        // Render the post
        renderBlogPost(post);

        // Load related posts
        loadRelatedPosts(post, data.posts);

        // Hide loading state
        hideLoading();
    } catch (error) {
        console.error('Error loading blog post:', error);
        showError('Failed to load blog post. Please try again later.');
    }
}

// Function to update meta tags
function updateMetaTags(post) {
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
}

// Function to render a blog post
function renderBlogPost(post) {
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
        <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${formattedDate}
        </span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            By ${post.author}
        </span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ${Math.ceil(post.content.length / 1000)} min read
        </span>
    `;

    postImage.src = post.image;
    postImage.alt = post.title;

    // Add blog-content class to the post content
    postContent.className = 'prose prose-yellow max-w-none mb-12 blog-content';
    postContent.innerHTML = post.content;

    // Render categories
    if (postCategories) {
        postCategories.innerHTML = '';
        post.categories.forEach(category => {
            const link = document.createElement('a');
            link.href = `../blog.html?category=${encodeURIComponent(category)}`;
            link.className = 'inline-block bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2 hover:bg-yellow-200 transition-colors duration-200 flex items-center';
            link.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                ${category}
            `;
            postCategories.appendChild(link);
        });
    }

    // Render tags
    if (postTags) {
        postTags.innerHTML = '';
        post.tags.forEach(tag => {
            const link = document.createElement('a');
            link.href = `../blog.html?tag=${encodeURIComponent(tag)}`;
            link.className = 'inline-block bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2 hover:bg-gray-200 transition-colors duration-200 flex items-center';
            link.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                ${tag}
            `;
            postTags.appendChild(link);
        });
    }
}

// Function to load related posts
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
        postElement.className = 'bg-white rounded-xl shadow-lg overflow-hidden flex flex-col card-hover transform transition-all duration-300 hover:scale-[1.02]';

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
                <a href="${post.slug}.html" class="mt-auto inline-flex items-center text-yellow-600 hover:text-orange-500 font-semibold text-sm group">
                    <span>Read More</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </a>
            </div>
        `;

        relatedPostsContainer.appendChild(postElement);
    });
}

// Function to show error message
function showError(message) {
    const postLoading = document.getElementById('post-loading');
    const postContainer = document.getElementById('post-container');
    const errorContainer = document.getElementById('error-container');

    if (postLoading) postLoading.classList.add('hidden');
    if (postContainer) postContainer.classList.add('hidden');

    if (errorContainer) {
        errorContainer.classList.remove('hidden');
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }
}

// Function to hide loading state
function hideLoading() {
    const postLoading = document.getElementById('post-loading');
    const postContainer = document.getElementById('post-container');

    if (postLoading) postLoading.classList.add('hidden');
    if (postContainer) postContainer.classList.remove('hidden');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPost();
});
