// WeHustleIt Permalink Generator

// Function to generate a permalink file for a blog post
async function generatePermalink(post) {
    if (!post || !post.slug) {
        console.error('Invalid post data for permalink generation');
        return false;
    }

    try {
        // Get the template content
        let templateContent;

        try {
            const response = await fetch('../cms/blog-template.html');
            templateContent = await response.text();
        } catch (error) {
            console.error('Error loading template:', error);
            return false;
        }

        // Create the permalink file path
        const permalinkPath = `blog/${post.slug}.html`;

        // Format the date
        const date = new Date(post.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Calculate read time (rough estimate: 200 words per minute)
        const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        // Generate category HTML
        const categoriesHtml = post.categories.map(category => {
            return `<a href="../blog.html?category=${encodeURIComponent(category)}" class="inline-block bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2 hover:bg-yellow-200 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                ${category}
            </a>`;
        }).join('');

        // Generate tags HTML
        const tagsHtml = post.tags.map(tag => {
            return `<a href="../blog.html?tag=${encodeURIComponent(tag)}" class="inline-block bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2 hover:bg-gray-200 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                ${tag}
            </a>`;
        }).join('');

        // Generate related posts HTML (placeholder - will be populated by JavaScript)
        const relatedPostsHtml = `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col card-hover animate-pulse">
                <div class="w-full h-48 bg-gray-200"></div>
                <div class="p-6 flex flex-col flex-grow space-y-3">
                    <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-2/3 mt-auto"></div>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col card-hover animate-pulse">
                <div class="w-full h-48 bg-gray-200"></div>
                <div class="p-6 flex flex-col flex-grow space-y-3">
                    <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-2/3 mt-auto"></div>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col card-hover animate-pulse">
                <div class="w-full h-48 bg-gray-200"></div>
                <div class="p-6 flex flex-col flex-grow space-y-3">
                    <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-2/3 mt-auto"></div>
                </div>
            </div>
        `;

        // Replace placeholders in the template
        let permalinkContent = templateContent;
        permalinkContent = permalinkContent.replace(/{{title}}/g, post.title);
        permalinkContent = permalinkContent.replace(/{{meta_description}}/g, post.excerpt);
        permalinkContent = permalinkContent.replace(/{{meta_keywords}}/g, post.tags.join(', '));
        permalinkContent = permalinkContent.replace(/{{author}}/g, post.author);
        permalinkContent = permalinkContent.replace(/{{excerpt}}/g, post.excerpt);
        permalinkContent = permalinkContent.replace(/{{date}}/g, formattedDate);
        permalinkContent = permalinkContent.replace(/{{read_time}}/g, readTime);
        permalinkContent = permalinkContent.replace(/{{image}}/g, post.image);
        permalinkContent = permalinkContent.replace(/{{content}}/g, post.content);
        permalinkContent = permalinkContent.replace(/{{categories}}/g, categoriesHtml);
        permalinkContent = permalinkContent.replace(/{{tags}}/g, tagsHtml);
        permalinkContent = permalinkContent.replace(/{{related_posts}}/g, relatedPostsHtml);

        // Store the permalink in localStorage for later download
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        permalinks[post.slug] = {
            path: permalinkPath,
            content: permalinkContent,
            title: post.title,
            date: post.date
        };
        localStorage.setItem('blog_permalinks', JSON.stringify(permalinks));

        console.log(`Permalink generated for ${post.title} at ${permalinkPath}`);
        return true;
    } catch (error) {
        console.error('Error generating permalink:', error);
        return false;
    }
}

// Function to generate permalinks for all posts
async function generateAllPermalinks() {
    try {
        // Get data from localStorage
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));

        if (!data || !data.posts || data.posts.length === 0) {
            console.warn('No posts to generate permalinks for');
            return false;
        }

        // Generate permalinks for each post
        const results = await Promise.all(data.posts.map(post => generatePermalink(post)));

        // Check if all permalinks were generated successfully
        const success = results.every(result => result);

        if (success) {
            console.log('All permalinks generated successfully');
        } else {
            console.warn('Some permalinks failed to generate');
        }

        return success;
    } catch (error) {
        console.error('Error generating all permalinks:', error);
        return false;
    }
}

// Function to download a permalink file
function downloadPermalink(slug) {
    try {
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');

        if (!permalinks[slug]) {
            console.error(`No permalink found for slug: ${slug}`);
            return false;
        }

        const permalink = permalinks[slug];

        // Create a blob with the permalink content
        const blob = new Blob([permalink.content], { type: 'text/html' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a link element
        const link = document.createElement('a');
        link.href = url;
        link.download = `${slug}.html`;

        // Append the link to the body
        document.body.appendChild(link);

        // Click the link to trigger the download
        link.click();

        // Remove the link from the body
        document.body.removeChild(link);

        return true;
    } catch (error) {
        console.error('Error downloading permalink:', error);
        return false;
    }
}

// Function to download all permalinks as a zip file
async function downloadAllPermalinks() {
    try {
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');

        if (Object.keys(permalinks).length === 0) {
            console.warn('No permalinks to download');
            return false;
        }

        // Load JSZip library dynamically
        if (typeof JSZip === 'undefined') {
            // Create a script element
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.async = true;

            // Wait for the script to load
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // Create a new zip file
        const zip = new JSZip();

        // Add each permalink to the zip file
        Object.keys(permalinks).forEach(slug => {
            const permalink = permalinks[slug];
            zip.file(`${slug}.html`, permalink.content);
        });

        // Generate the zip file
        const content = await zip.generateAsync({ type: 'blob' });

        // Create a URL for the blob
        const url = URL.createObjectURL(content);

        // Create a link element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'blog-permalinks.zip';

        // Append the link to the body
        document.body.appendChild(link);

        // Click the link to trigger the download
        link.click();

        // Remove the link from the body
        document.body.removeChild(link);

        return true;
    } catch (error) {
        console.error('Error downloading all permalinks:', error);
        return false;
    }
}
