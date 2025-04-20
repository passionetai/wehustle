// WeHustleIt CMS Admin JavaScript

// Global variables
let currentPage = 1;
let postsPerPage = CMS_CONFIG.postsPerPage;
let allPosts = [];
let filteredPosts = [];
let categories = [];
let tags = [];
let currentPostId = null;
let deleteItemType = null;
let deleteItemId = null;

// Initialize TinyMCE with premium features
tinymce.init({
    selector: '#post-content',
    plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount advlist advtable autosave code fullscreen help importcss insertdatetime nonbreaking pagebreak preview quickbars save searchreplace table template visualchars',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat | code fullscreen help',
    height: 500,
    promotion: false,
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
    image_advtab: true,
    image_caption: true,
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    toolbar_mode: 'sliding',
    contextmenu: 'link image table',
    skin: 'oxide',
    content_css: 'default',
    content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:16px }'
});

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const tabPosts = document.getElementById('tab-posts');
const tabNewPost = document.getElementById('tab-new-post');
const tabCategories = document.getElementById('tab-categories');
const tabSettings = document.getElementById('tab-settings');

const contentPosts = document.getElementById('content-posts');
const contentNewPost = document.getElementById('content-new-post');
const contentCategories = document.getElementById('content-categories');
const contentSettings = document.getElementById('content-settings');

const postsList = document.getElementById('posts-list');
const postSearch = document.getElementById('post-search');
const categoryFilter = document.getElementById('category-filter');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');

const postForm = document.getElementById('post-form');
const postFormTitle = document.getElementById('post-form-title');
const postIdInput = document.getElementById('post-id');
const postTitleInput = document.getElementById('post-title');
const postSlugInput = document.getElementById('post-slug');
const postExcerptInput = document.getElementById('post-excerpt');
const postAuthorInput = document.getElementById('post-author');
const postDateInput = document.getElementById('post-date');
const postImageInput = document.getElementById('post-image');
const postCategoriesSelect = document.getElementById('post-categories');
const postTagsInput = document.getElementById('post-tags');
const savePostBtn = document.getElementById('save-post');
const imageUpload = document.getElementById('image-upload');

const categoriesList = document.getElementById('categories-list');
const tagsList = document.getElementById('tags-list');
const addCategoryBtn = document.getElementById('add-category');
const addTagBtn = document.getElementById('add-tag');
const categoryForm = document.getElementById('category-form');
const tagForm = document.getElementById('tag-form');
const newCategoryInput = document.getElementById('new-category');
const newTagInput = document.getElementById('new-tag');
const saveCategoryBtn = document.getElementById('save-category');
const saveTagBtn = document.getElementById('save-tag');
const cancelCategoryBtn = document.getElementById('cancel-category');
const cancelTagBtn = document.getElementById('cancel-tag');

const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// Authentication Functions
function checkAuth() {
    const token = localStorage.getItem('cms_auth_token');
    if (!token) {
        showLoginScreen();
    } else {
        hideLoginScreen();
        loadData();
    }
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
}

function hideLoginScreen() {
    loginScreen.classList.add('hidden');
}

function login(username, password) {
    // In a real application, this would be a server request
    // For this demo, we'll use a simple check against the config

    // Create a SHA-256 hash of the password
    const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    hashPassword(password).then(hashedPassword => {
        if (username === CMS_CONFIG.adminUsername && hashedPassword === CMS_CONFIG.adminPasswordHash) {
            // Create a simple token (in a real app, this would be a JWT or similar)
            const token = btoa(username + ':' + new Date().getTime());
            localStorage.setItem('cms_auth_token', token);
            hideLoginScreen();
            loadData();
        } else {
            loginError.classList.remove('hidden');
        }
    });
}

function logout() {
    localStorage.removeItem('cms_auth_token');
    showLoginScreen();
}

// Tab Functions
function switchTab(tabId) {
    // Hide all tab contents
    contentPosts.classList.add('hidden');
    contentNewPost.classList.add('hidden');
    contentCategories.classList.add('hidden');
    contentSettings.classList.add('hidden');

    // Remove active class from all tabs
    tabPosts.classList.remove('active');
    tabNewPost.classList.remove('active');
    tabCategories.classList.remove('active');
    tabSettings.classList.remove('active');

    // Show selected tab content and mark tab as active
    if (tabId === 'posts') {
        contentPosts.classList.remove('hidden');
        tabPosts.classList.add('active');
    } else if (tabId === 'new-post') {
        contentNewPost.classList.remove('hidden');
        tabNewPost.classList.add('active');
    } else if (tabId === 'categories') {
        contentCategories.classList.remove('hidden');
        tabCategories.classList.add('active');
    } else if (tabId === 'settings') {
        contentSettings.classList.remove('hidden');
        tabSettings.classList.add('active');
        loadSettings();
    }
}

// Data Loading Functions
async function loadData() {
    try {
        // For local development without a server, we'll use a fallback to localStorage
        // In production, you would use the fetch API to get data from the server
        let data;

        try {
            // Try to fetch from file first
            const response = await fetch('../cms/posts/posts.json');
            data = await response.json();

            // Save to localStorage as backup
            localStorage.setItem('cms_data_backup', JSON.stringify(data));
        } catch (error) {
            console.warn('Could not fetch from file, using localStorage backup');

            // If fetch fails, try to get from localStorage
            const backupData = localStorage.getItem('cms_data_backup');

            if (backupData) {
                data = JSON.parse(backupData);
            } else {
                // If no backup exists, use default data
                data = {
                    posts: [
                        {
                            id: "1",
                            title: "Top 5 Side Hustles for 2025",
                            slug: "top-5-side-hustles-2025",
                            excerpt: "Discover the trending side hustles that offer the most potential for growth and income this year...",
                            content: "<p>The gig economy continues to evolve, and 2025 brings exciting new opportunities for side hustlers.</p>",
                            author: "Sarah Johnson",
                            date: "2025-01-15",
                            image: "https://picsum.photos/seed/blog1/800/600",
                            categories: ["Side Hustles", "Trends"],
                            tags: ["2025", "income", "growth", "opportunities"]
                        }
                    ],
                    categories: ["Side Hustles", "Trends"],
                    tags: ["2025", "income", "growth", "opportunities"],
                    settings: {
                        homeBlog: {
                            title: "Latest from Our Blog",
                            description: "Insights, tips, and success stories to help you on your side hustle journey",
                            count: 3
                        },
                        blogPage: {
                            title: "The WeHustleIt Blog",
                            description: "Stay updated with the latest trends, strategies, and success stories in the world of side hustles.",
                            postsPerPage: 8
                        },
                        seo: {
                            metaTitle: "WeHustle It Blog - Side Hustle Insights",
                            metaDescription: "Read the latest insights, tips, and stories about side hustles and entrepreneurship on the WeHustle It blog.",
                            metaKeywords: "blog, side hustle tips, entrepreneurship, small business advice, WeHustle It"
                        }
                    }
                };

                // Save default data to localStorage
                localStorage.setItem('cms_data_backup', JSON.stringify(data));
            }
        }

        allPosts = data.posts || [];
        categories = data.categories || [];
        tags = data.tags || [];

        // Initialize settings if they don't exist
        if (!data.settings) {
            data.settings = {
                homeBlog: {
                    title: "Latest from Our Blog",
                    description: "Insights, tips, and success stories to help you on your side hustle journey",
                    count: 3
                },
                blogPage: {
                    title: "The WeHustleIt Blog",
                    description: "Stay updated with the latest trends, strategies, and success stories in the world of side hustles.",
                    postsPerPage: 8
                },
                seo: {
                    metaTitle: "WeHustle It Blog - Side Hustle Insights",
                    metaDescription: "Read the latest insights, tips, and stories about side hustles and entrepreneurship on the WeHustle It blog.",
                    metaKeywords: "blog, side hustle tips, entrepreneurship, small business advice, WeHustle It"
                }
            };

            // Save updated data to localStorage
            localStorage.setItem('cms_data_backup', JSON.stringify(data));
        }

        filteredPosts = [...allPosts];

        // Initialize UI
        populateCategoryFilter();
        populatePostCategories();
        renderPosts();
        renderCategories();
        renderTags();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please try again.');
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

function populatePostCategories() {
    postCategoriesSelect.innerHTML = '';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        postCategoriesSelect.appendChild(option);
    });
}

// Post Rendering Functions
function renderPosts() {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    postsList.innerHTML = '';

    if (postsToShow.length === 0) {
        postsList.innerHTML = `
            <li class="px-6 py-4 text-center">
                <p class="text-gray-500">No posts found.</p>
            </li>
        `;
        return;
    }

    postsToShow.forEach(post => {
        const li = document.createElement('li');
        li.className = 'px-6 py-4 flex items-center justify-between hover:bg-gray-50';

        const date = new Date(post.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        li.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md overflow-hidden">
                    <img src="${post.image}" alt="" class="h-full w-full object-cover">
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${post.title}</div>
                    <div class="text-sm text-gray-500">${formattedDate} | ${post.categories.join(', ')}</div>
                </div>
            </div>
            <div class="flex space-x-2">
                <button class="edit-post-btn px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors" data-id="${post.id}">
                    Edit
                </button>
                <button class="delete-post-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors" data-id="${post.id}">
                    Delete
                </button>
            </div>
        `;

        postsList.appendChild(li);
    });

    // Update pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.getAttribute('data-id');
            editPost(postId);
        });
    });

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.getAttribute('data-id');
            showDeleteConfirmation('post', postId);
        });
    });
}

function renderCategories() {
    categoriesList.innerHTML = '';

    if (categories.length === 0) {
        categoriesList.innerHTML = `
            <li class="px-6 py-4 text-center">
                <p class="text-gray-500">No categories found.</p>
            </li>
        `;
        return;
    }

    categories.forEach(category => {
        const li = document.createElement('li');
        li.className = 'px-6 py-4 flex items-center justify-between hover:bg-gray-50';

        li.innerHTML = `
            <div class="text-sm font-medium text-gray-900">${category}</div>
            <div class="flex space-x-2">
                <button class="delete-category-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors" data-category="${category}">
                    Delete
                </button>
            </div>
        `;

        categoriesList.appendChild(li);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            showDeleteConfirmation('category', category);
        });
    });
}

function renderTags() {
    tagsList.innerHTML = '';

    if (tags.length === 0) {
        tagsList.innerHTML = `
            <li class="px-6 py-4 text-center">
                <p class="text-gray-500">No tags found.</p>
            </li>
        `;
        return;
    }

    tags.forEach(tag => {
        const li = document.createElement('li');
        li.className = 'px-6 py-4 flex items-center justify-between hover:bg-gray-50';

        li.innerHTML = `
            <div class="text-sm font-medium text-gray-900">${tag}</div>
            <div class="flex space-x-2">
                <button class="delete-tag-btn px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors" data-tag="${tag}">
                    Delete
                </button>
            </div>
        `;

        tagsList.appendChild(li);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            showDeleteConfirmation('tag', tag);
        });
    });
}

// Post Form Functions
function resetPostForm() {
    currentPostId = null;
    postIdInput.value = '';
    postTitleInput.value = '';
    postSlugInput.value = '';
    postExcerptInput.value = '';
    tinymce.get('post-content').setContent('');
    postAuthorInput.value = '';
    postDateInput.value = new Date().toISOString().split('T')[0]; // Today's date
    postImageInput.value = '';

    // Reset categories
    Array.from(postCategoriesSelect.options).forEach(option => {
        option.selected = false;
    });

    postTagsInput.value = '';

    postFormTitle.textContent = 'Create New Post';
    savePostBtn.textContent = 'Publish Post';
}

function editPost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    currentPostId = postId;
    postIdInput.value = postId;
    postTitleInput.value = post.title;
    postSlugInput.value = post.slug;
    postExcerptInput.value = post.excerpt;
    tinymce.get('post-content').setContent(post.content);
    postAuthorInput.value = post.author;
    postDateInput.value = post.date;
    postImageInput.value = post.image;

    // Set categories
    Array.from(postCategoriesSelect.options).forEach(option => {
        option.selected = post.categories.includes(option.value);
    });

    postTagsInput.value = post.tags.join(', ');

    postFormTitle.textContent = 'Edit Post';
    savePostBtn.textContent = 'Update Post';

    switchTab('new-post');
}

async function savePost() {
    // Get form values
    const postId = currentPostId || String(Date.now()); // Use timestamp as ID for new posts
    const title = postTitleInput.value.trim();
    const slug = postSlugInput.value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const excerpt = postExcerptInput.value.trim();
    const content = tinymce.get('post-content').getContent();
    const author = postAuthorInput.value.trim();
    const date = postDateInput.value;
    const image = postImageInput.value.trim();

    // Get selected categories
    const selectedCategories = Array.from(postCategoriesSelect.selectedOptions).map(option => option.value);

    // Parse tags
    const tagsList = postTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

    // Validate form
    if (!title) {
        alert('Please enter a title for the post.');
        return;
    }

    if (!content) {
        alert('Please enter content for the post.');
        return;
    }

    // Create post object
    const post = {
        id: postId,
        title,
        slug,
        excerpt,
        content,
        author,
        date,
        image,
        categories: selectedCategories,
        tags: tagsList
    };

    // Update or add post
    if (currentPostId) {
        // Update existing post
        const index = allPosts.findIndex(p => p.id === currentPostId);
        if (index !== -1) {
            allPosts[index] = post;
        }
    } else {
        // Add new post
        allPosts.push(post);
    }

    // Add new categories and tags if they don't exist
    selectedCategories.forEach(category => {
        if (!categories.includes(category)) {
            categories.push(category);
        }
    });

    tagsList.forEach(tag => {
        if (!tags.includes(tag)) {
            tags.push(tag);
        }
    });

    // Save data locally
    await saveData();

    // Generate permalink for the post
    if (typeof generatePermalink === 'function') {
        try {
            await generatePermalink(post);
            console.log('Permalink generated for post:', post.title);

            // Update permalinks list if visible
            if (document.getElementById('content-settings').classList.contains('hidden') === false) {
                updatePermalinksList();
            }
        } catch (error) {
            console.error('Error generating permalink:', error);
        }
    }

    // Show the post saved modal
    const postSavedModal = document.getElementById('post-saved-modal');
    const githubSuccess = document.getElementById('github-success');
    const githubNotConfigured = document.getElementById('github-not-configured');

    if (postSavedModal) {
        // Check if GitHub is configured
        if (typeof github !== 'undefined' && github.isConfigured()) {
            // Try to save to GitHub
            const githubSaveResult = await saveDataToGitHub();

            if (githubSaveResult) {
                // Show GitHub success message
                if (githubSuccess) githubSuccess.classList.remove('hidden');
                if (githubNotConfigured) githubNotConfigured.classList.add('hidden');
            } else {
                // Show GitHub not configured message
                if (githubSuccess) githubSuccess.classList.add('hidden');
                if (githubNotConfigured) githubNotConfigured.classList.remove('hidden');
            }
        } else {
            // Show GitHub not configured message
            if (githubSuccess) githubSuccess.classList.add('hidden');
            if (githubNotConfigured) githubNotConfigured.classList.remove('hidden');
        }

        postSavedModal.classList.remove('hidden');
    }

    // Reset form but don't switch tabs yet (modal will be shown first)
}

// Category and Tag Functions
function showCategoryForm() {
    categoryForm.classList.remove('hidden');
    newCategoryInput.focus();
}

function hideCategoryForm() {
    categoryForm.classList.add('hidden');
    newCategoryInput.value = '';
}

function showTagForm() {
    tagForm.classList.remove('hidden');
    newTagInput.focus();
}

function hideTagForm() {
    tagForm.classList.add('hidden');
    newTagInput.value = '';
}

async function saveCategory() {
    const category = newCategoryInput.value.trim();

    if (!category) {
        alert('Please enter a category name.');
        return;
    }

    if (categories.includes(category)) {
        alert('This category already exists.');
        return;
    }

    categories.push(category);
    await saveData();

    hideCategoryForm();
    renderCategories();
    populateCategoryFilter();
    populatePostCategories();
}

async function saveTag() {
    const tag = newTagInput.value.trim();

    if (!tag) {
        alert('Please enter a tag name.');
        return;
    }

    if (tags.includes(tag)) {
        alert('This tag already exists.');
        return;
    }

    tags.push(tag);
    await saveData();

    hideTagForm();
    renderTags();
}

// Delete Functions
function showDeleteConfirmation(type, id) {
    deleteItemType = type;
    deleteItemId = id;
    deleteModal.classList.remove('hidden');
}

function hideDeleteConfirmation() {
    deleteModal.classList.add('hidden');
    deleteItemType = null;
    deleteItemId = null;
}

async function deleteItem() {
    if (!deleteItemType || !deleteItemId) return;

    if (deleteItemType === 'post') {
        allPosts = allPosts.filter(post => post.id !== deleteItemId);
        filteredPosts = filteredPosts.filter(post => post.id !== deleteItemId);
    } else if (deleteItemType === 'category') {
        categories = categories.filter(category => category !== deleteItemId);

        // Update posts that use this category
        allPosts.forEach(post => {
            post.categories = post.categories.filter(category => category !== deleteItemId);
        });
    } else if (deleteItemType === 'tag') {
        tags = tags.filter(tag => tag !== deleteItemId);

        // Update posts that use this tag
        allPosts.forEach(post => {
            post.tags = post.tags.filter(tag => tag !== deleteItemId);
        });
    }

    await saveData();

    hideDeleteConfirmation();

    // Refresh UI
    if (deleteItemType === 'post') {
        renderPosts();
    } else if (deleteItemType === 'category') {
        renderCategories();
        populateCategoryFilter();
        populatePostCategories();
    } else if (deleteItemType === 'tag') {
        renderTags();
    }
}

// Data Saving Function
async function saveData() {
    try {
        // In a real application, this would be a server request
        // For this demo, we'll save to localStorage

        const data = {
            posts: allPosts,
            categories: categories,
            tags: tags
        };

        // Simulate a server request
        await new Promise(resolve => setTimeout(resolve, 500));

        // Save to localStorage
        localStorage.setItem('cms_data_backup', JSON.stringify(data));
        console.log('Data saved to localStorage:', data);

        // In a real application with a server, you would use fetch to send data to the server
        // For example:
        // const response = await fetch('../cms/posts/posts.json', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(data)
        // });

        // Refresh filtered posts
        filteredPosts = [...allPosts];
        applyFilters();

        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data. Please try again.');
        return false;
    }
}

// Filter Functions
function applyFilters() {
    const searchTerm = postSearch.value.trim().toLowerCase();
    const categoryValue = categoryFilter.value;

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

    // Reset to first page
    currentPage = 1;

    renderPosts();
}

// Image Upload Function
function handleImageUpload(file) {
    // In a real application, this would upload the file to a server
    // For this demo, we'll use a data URL

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        postImageInput.value = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Slug Generator Function
function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Settings Functions
function loadSettings() {
    try {
        // Get settings from localStorage
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));
        const settings = data.settings || {};

        // Homepage Blog Section
        if (settings.homeBlog) {
            document.getElementById('home-blog-title').value = settings.homeBlog.title || '';
            document.getElementById('home-blog-description').value = settings.homeBlog.description || '';
            document.getElementById('home-blog-count').value = settings.homeBlog.count || 3;
        }

        // Blog Page Settings
        if (settings.blogPage) {
            document.getElementById('blog-page-title').value = settings.blogPage.title || '';
            document.getElementById('blog-page-description').value = settings.blogPage.description || '';
            document.getElementById('blog-posts-per-page').value = settings.blogPage.postsPerPage || 8;
        }

        // SEO Settings
        if (settings.seo) {
            document.getElementById('blog-meta-title').value = settings.seo.metaTitle || '';
            document.getElementById('blog-meta-description').value = settings.seo.metaDescription || '';
            document.getElementById('blog-meta-keywords').value = settings.seo.metaKeywords || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    try {
        // Get current data
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));

        // Update settings
        data.settings = {
            homeBlog: {
                title: document.getElementById('home-blog-title').value,
                description: document.getElementById('home-blog-description').value,
                count: parseInt(document.getElementById('home-blog-count').value)
            },
            blogPage: {
                title: document.getElementById('blog-page-title').value,
                description: document.getElementById('blog-page-description').value,
                postsPerPage: parseInt(document.getElementById('blog-posts-per-page').value)
            },
            seo: {
                metaTitle: document.getElementById('blog-meta-title').value,
                metaDescription: document.getElementById('blog-meta-description').value,
                metaKeywords: document.getElementById('blog-meta-keywords').value
            }
        };

        // Save to localStorage
        localStorage.setItem('cms_data_backup', JSON.stringify(data));

        // Show success message
        alert('Settings saved successfully!');

        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. Please try again.');
        return false;
    }
}

// Export Data Function
function exportData() {
    try {
        // Get data from localStorage
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));

        if (!data) {
            alert('No data to export.');
            return;
        }

        // Convert data to JSON string with pretty formatting
        const jsonString = JSON.stringify(data, null, 2);

        // Create a blob with the data
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a link element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'posts.json';

        // Append the link to the body
        document.body.appendChild(link);

        // Click the link to trigger the download
        link.click();

        // Remove the link from the body
        document.body.removeChild(link);

        // Show instructions
        alert('Data exported successfully!\n\nTo update your site with this data:\n1. Replace the contents of cms/posts/posts.json with the downloaded file\n2. If using a web server, upload the file to your server');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Failed to export data. Please try again.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();

    // Login form
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });

    // Logout button
    logoutBtn.addEventListener('click', logout);

    // Export data button
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }

    // Tab switching
    tabPosts.addEventListener('click', () => switchTab('posts'));
    tabNewPost.addEventListener('click', () => {
        resetPostForm();
        switchTab('new-post');
    });
    tabCategories.addEventListener('click', () => switchTab('categories'));
    tabSettings.addEventListener('click', () => switchTab('settings'));

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPosts();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPosts();
        }
    });

    // Filters
    postSearch.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);

    // Post form
    savePostBtn.addEventListener('click', savePost);

    // Auto-generate slug from title
    postTitleInput.addEventListener('blur', () => {
        if (!postSlugInput.value && postTitleInput.value) {
            postSlugInput.value = generateSlug(postTitleInput.value);
        }
    });

    // Image upload
    imageUpload.addEventListener('change', e => {
        handleImageUpload(e.target.files[0]);
    });

    // Category and tag forms
    addCategoryBtn.addEventListener('click', showCategoryForm);
    cancelCategoryBtn.addEventListener('click', hideCategoryForm);
    saveCategoryBtn.addEventListener('click', saveCategory);

    addTagBtn.addEventListener('click', showTagForm);
    cancelTagBtn.addEventListener('click', hideTagForm);
    saveTagBtn.addEventListener('click', saveTag);

    // Delete confirmation
    confirmDeleteBtn.addEventListener('click', deleteItem);
    cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);

    // Settings
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Permalink Management
    const generateAllPermalinksBtn = document.getElementById('generate-all-permalinks');
    const downloadAllPermalinksBtn = document.getElementById('download-all-permalinks');
    const permalinksContainer = document.getElementById('permalinks-container');
    const permalinksCount = document.getElementById('permalinks-count');

    // Function to update the permalinks list
    function updatePermalinksList() {
        if (!permalinksContainer || !permalinksCount) return;

        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        const permalinkSlugs = Object.keys(permalinks);

        // Update count
        permalinksCount.textContent = `${permalinkSlugs.length} permalink${permalinkSlugs.length !== 1 ? 's' : ''}`;

        // Update list
        if (permalinkSlugs.length === 0) {
            permalinksContainer.innerHTML = `
                <div class="px-4 py-3 text-sm text-gray-500 text-center">
                    No permalinks generated yet. Click "Generate All Permalinks" to create them.
                </div>
            `;
            return;
        }

        // Sort permalinks by date (newest first)
        permalinkSlugs.sort((a, b) => {
            const dateA = new Date(permalinks[a].date);
            const dateB = new Date(permalinks[b].date);
            return dateB - dateA;
        });

        // Create list items
        permalinksContainer.innerHTML = '';

        permalinkSlugs.forEach(slug => {
            const permalink = permalinks[slug];
            const date = new Date(permalink.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const item = document.createElement('div');
            item.className = 'px-4 py-3 flex justify-between items-center hover:bg-gray-50';
            item.innerHTML = `
                <div>
                    <div class="text-sm font-medium text-gray-900">${permalink.title}</div>
                    <div class="text-xs text-gray-500">${formattedDate} - ${permalink.path}</div>
                </div>
                <button class="download-permalink-btn px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors" data-slug="${slug}">
                    Download
                </button>
            `;

            permalinksContainer.appendChild(item);
        });

        // Add event listeners to download buttons
        document.querySelectorAll('.download-permalink-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const slug = btn.getAttribute('data-slug');
                if (typeof downloadPermalink === 'function') {
                    downloadPermalink(slug);
                }
            });
        });
    }

    // Generate All Permalinks button
    if (generateAllPermalinksBtn) {
        generateAllPermalinksBtn.addEventListener('click', async () => {
            if (typeof generateAllPermalinks === 'function') {
                generateAllPermalinksBtn.disabled = true;
                generateAllPermalinksBtn.textContent = 'Generating...';

                try {
                    const result = await generateAllPermalinks();
                    if (result) {
                        alert('All permalinks generated successfully!');
                        updatePermalinksList();
                    } else {
                        alert('Some permalinks failed to generate. Check the console for details.');
                    }
                } catch (error) {
                    console.error('Error generating permalinks:', error);
                    alert('Error generating permalinks. Check the console for details.');
                } finally {
                    generateAllPermalinksBtn.disabled = false;
                    generateAllPermalinksBtn.textContent = 'Generate All Permalinks';
                }
            } else {
                alert('Permalink generator not available.');
            }
        });
    }

    // Download All Permalinks button
    if (downloadAllPermalinksBtn) {
        downloadAllPermalinksBtn.addEventListener('click', async () => {
            if (typeof downloadAllPermalinks === 'function') {
                downloadAllPermalinksBtn.disabled = true;
                downloadAllPermalinksBtn.textContent = 'Downloading...';

                try {
                    const result = await downloadAllPermalinks();
                    if (!result) {
                        alert('No permalinks to download. Generate permalinks first.');
                    }
                } catch (error) {
                    console.error('Error downloading permalinks:', error);
                    alert('Error downloading permalinks. Check the console for details.');
                } finally {
                    downloadAllPermalinksBtn.disabled = false;
                    downloadAllPermalinksBtn.textContent = 'Download All as ZIP';
                }
            } else {
                alert('Permalink downloader not available.');
            }
        });
    }

    // Update permalinks list when settings tab is shown
    tabSettings.addEventListener('click', () => {
        updatePermalinksList();
    });

    // Post Saved Modal
    const closePostSavedBtn = document.getElementById('close-post-saved');
    if (closePostSavedBtn) {
        closePostSavedBtn.addEventListener('click', () => {
            const postSavedModal = document.getElementById('post-saved-modal');
            if (postSavedModal) {
                postSavedModal.classList.add('hidden');
            }
            // Now switch to posts tab
            resetPostForm();
            switchTab('posts');
        });
    }
});
