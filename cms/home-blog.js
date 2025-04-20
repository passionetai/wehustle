// WeHustleIt Home Blog JavaScript

// Function to update the blog section title and description
function updateBlogSectionContent() {
    // Get the blog section title and description elements
    const blogSectionTitle = document.querySelector('.blog-section-title');
    const blogSectionDescription = document.querySelector('.blog-section-description');

    if (!blogSectionTitle || !blogSectionDescription) return;

    try {
        // Get settings from localStorage
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));
        const settings = data.settings || {};

        // Update the content if settings exist
        if (settings.homeBlog) {
            // Update the title with gradient text span
            const titleText = settings.homeBlog.title || 'Latest from Our Blog';
            const titleParts = titleText.split('Blog');

            if (titleParts.length > 1) {
                blogSectionTitle.innerHTML = titleParts[0] + '<span class="gradient-text">Blog</span>' + titleParts[1];
            } else {
                blogSectionTitle.innerHTML = titleText;
            }

            // Update the description
            blogSectionDescription.textContent = settings.homeBlog.description || 'Insights, tips, and success stories to help you on your side hustle journey';
        }
    } catch (error) {
        console.error('Error updating blog section content:', error);
    }
}

// Function to load blog posts on the homepage
async function loadHomeBlogPosts() {
    const homeBlogPosts = document.getElementById('home-blog-posts');
    if (!homeBlogPosts) return; // Not on homepage

    try {
        // Get blog posts data
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

        // Get the settings
        const settings = data.settings || {};
        const postCount = settings.homeBlog?.count || 3;

        // Get the latest posts based on settings
        const posts = data.posts || [];
        posts.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date (newest first)
        const latestPosts = posts.slice(0, postCount);

        // Clear loading placeholders
        homeBlogPosts.innerHTML = '';

        // Render posts
        latestPosts.forEach(post => {
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
                    <h3 class="text-xl font-bold mb-2 text-gray-800">${post.title}</h3>
                    <p class="text-gray-600 text-sm mb-4 flex-grow">${post.excerpt}</p>
                    <a href="blog-post.html?id=${post.id}" class="mt-auto text-yellow-600 hover:text-orange-500 font-semibold text-sm">Read More &rarr;</a>
                </div>
            `;

            homeBlogPosts.appendChild(postElement);
        });

        // If no posts, show message
        if (latestPosts.length === 0) {
            homeBlogPosts.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <p class="text-gray-500">No blog posts available yet. Check back soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading home blog posts:', error);
        homeBlogPosts.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <p class="text-gray-500">Failed to load blog posts. Please try again later.</p>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Update blog section content
    updateBlogSectionContent();

    // Load blog posts
    loadHomeBlogPosts();
});
