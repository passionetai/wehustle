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
            const response = await fetch('../blog/template.html');
            templateContent = await response.text();
        } catch (error) {
            console.error('Error loading template:', error);
            return false;
        }

        // Create the permalink file path
        const permalinkPath = `blog/${post.slug}.html`;

        // Create the permalink content (same as template)
        const permalinkContent = templateContent;

        // Store the permalink in localStorage for later download
        const permalinks = JSON.parse(localStorage.getItem('blog_permalinks') || '{}');
        permalinks[post.slug] = {
            path: permalinkPath,
            content: permalinkContent,
            title: post.title,
            date: new Date().toISOString()
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
