// WeHustleIt Permalink Generator

// Function to generate a permalink for a single post
async function generatePermalink(post) {
    try {
        if (!post || !post.slug) {
            console.error('Invalid post data for permalink generation');
            return false;
        }

        // Get the blog template
        const templateResponse = await fetch('../cms/blog-template.html');
        if (!templateResponse.ok) {
            throw new Error(`Failed to fetch template: ${templateResponse.status}`);
        }
        
        let template = await templateResponse.text();
        
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
        template = template.replace(/{{title}}/g, post.title);
        template = template.replace(/{{meta_description}}/g, post.excerpt);
        template = template.replace(/{{meta_keywords}}/g, post.tags.join(', '));
        template = template.replace(/{{author}}/g, post.author);
        template = template.replace(/{{excerpt}}/g, post.excerpt);
        template = template.replace(/{{date}}/g, formattedDate);
        template = template.replace(/{{read_time}}/g, readTime);
        template = template.replace(/{{image}}/g, post.image);
        template = template.replace(/{{content}}/g, post.content);
        template = template.replace(/{{categories}}/g, categoriesHtml);
        template = template.replace(/{{tags}}/g, tagsHtml);
        template = template.replace(/{{related_posts}}/g, relatedPostsHtml);
        
        // Store the permalink in localStorage
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        permalinks[post.slug] = {
            title: post.title,
            date: post.date,
            path: `blog/${post.slug}.html`,
            content: template
        };
        
        localStorage.setItem('blog_permalinks', JSON.stringify(permalinks));
        
        // In a real server environment, we would write the file to disk here
        // For this demo, we'll just store it in localStorage
        
        return true;
    } catch (error) {
        console.error('Error generating permalink:', error);
        return false;
    }
}

// Function to generate permalinks for all posts
async function generateAllPermalinks() {
    try {
        // Get all posts
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));
        if (!data || !data.posts || !data.posts.length) {
            console.warn('No posts found for permalink generation');
            return false;
        }
        
        // Clear existing permalinks
        localStorage.setItem('blog_permalinks', '{}');
        
        // Generate permalinks for each post
        const results = await Promise.all(data.posts.map(post => generatePermalink(post)));
        
        // Check if all permalinks were generated successfully
        return results.every(result => result === true);
    } catch (error) {
        console.error('Error generating all permalinks:', error);
        return false;
    }
}

// Function to download a single permalink
async function downloadPermalink(slug) {
    try {
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        if (!permalinks[slug]) {
            alert('Permalink not found. Generate it first.');
            return false;
        }
        
        const permalink = permalinks[slug];
        
        // Create a blob with the HTML content
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

// Function to download all permalinks as a ZIP file
async function downloadAllPermalinks() {
    try {
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        const slugs = Object.keys(permalinks);
        
        if (slugs.length === 0) {
            return false;
        }
        
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            // Load JSZip dynamically
            await loadJSZip();
        }
        
        // Create a new ZIP file
        const zip = new JSZip();
        
        // Add each permalink to the ZIP
        slugs.forEach(slug => {
            const permalink = permalinks[slug];
            zip.file(`${slug}.html`, permalink.content);
        });
        
        // Generate the ZIP file
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

// Function to load JSZip dynamically
async function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Function to save permalinks to the blog directory
async function savePermalinksToBlog() {
    try {
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        const slugs = Object.keys(permalinks);
        
        if (slugs.length === 0) {
            alert('No permalinks to save. Generate them first.');
            return false;
        }
        
        // In a real server environment, we would write the files to disk here
        // For this demo, we'll just show a message
        
        alert(`${slugs.length} permalinks would be saved to the blog directory.`);
        return true;
    } catch (error) {
        console.error('Error saving permalinks to blog:', error);
        return false;
    }
}

// Function to create a file system writer
async function getFileSystemWriter(path) {
    try {
        // This is a placeholder for server-side file writing
        // In a real application, this would use server-side code to write files
        console.log(`Would write to path: ${path}`);
        return true;
    } catch (error) {
        console.error('Error getting file system writer:', error);
        return false;
    }
}

// Function to write a file to the file system
async function writeFile(path, content) {
    try {
        // This is a placeholder for server-side file writing
        // In a real application, this would use server-side code to write files
        console.log(`Would write ${content.length} bytes to ${path}`);
        return true;
    } catch (error) {
        console.error('Error writing file:', error);
        return false;
    }
}

// Function to automatically save permalinks when posts are updated
async function autoSavePermalinks() {
    // This function would be called when posts are updated
    // For now, we'll just generate the permalinks
    return await generateAllPermalinks();
}
