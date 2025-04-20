// GitHub Integration for WeHustleIt CMS

// GitHub API functions
class GitHubAPI {
    constructor() {
        this.config = this.loadConfig();
        // Use a CORS proxy for local development
        this.corsProxy = 'https://cors-anywhere.herokuapp.com/';
    }

    loadConfig() {
        const savedConfig = localStorage.getItem('github_config');
        if (savedConfig) {
            return JSON.parse(savedConfig);
        }
        return null;
    }

    isConfigured() {
        return this.config && this.config.username && this.config.repo && this.config.token;
    }

    async getFileContent(path) {
        if (!this.isConfigured()) {
            throw new Error('GitHub is not configured');
        }

        try {
            // First, get the file info to get the SHA
            const response = await fetch(`${this.corsProxy}https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`, {
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'X-Requested-With': 'XMLHttpRequest' // Required by CORS Anywhere
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // File doesn't exist
                }
                const error = await response.json();
                throw new Error(`GitHub API error: ${error.message}`);
            }

            const fileInfo = await response.json();

            // Decode the content from base64
            const content = atob(fileInfo.content);

            return {
                content,
                sha: fileInfo.sha
            };
        } catch (error) {
            console.error('Error getting file content:', error);
            throw error;
        }
    }

    async updateFile(path, content, message) {
        if (!this.isConfigured()) {
            throw new Error('GitHub is not configured');
        }

        try {
            // Get the current file to get its SHA (if it exists)
            let sha = null;
            try {
                const fileInfo = await this.getFileContent(path);
                if (fileInfo) {
                    sha = fileInfo.sha;
                }
            } catch (error) {
                // File might not exist, which is fine for creating a new file
                console.warn('File might not exist, creating new file');
            }

            // Prepare the request body
            const body = {
                message: message || `Update ${path}`,
                content: btoa(content), // Convert content to base64
                branch: this.config.branch
            };

            // If we have a SHA, include it to update the existing file
            if (sha) {
                body.sha = sha;
            }

            // Make the API request to update or create the file
            const response = await fetch(`${this.corsProxy}https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest' // Required by CORS Anywhere
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub API error: ${error.message}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }
}

// Initialize GitHub API
const github = new GitHubAPI();

// Function to save data to GitHub
async function saveDataToGitHub() {
    if (!github.isConfigured()) {
        console.warn('GitHub is not configured, skipping GitHub save');
        return false;
    }

    try {
        // Get data from localStorage
        const data = JSON.parse(localStorage.getItem('cms_data_backup'));

        if (!data) {
            console.warn('No data to save to GitHub');
            return false;
        }

        // Convert data to JSON string with pretty formatting
        const jsonString = JSON.stringify(data, null, 2);

        try {
            // Try to update the file on GitHub
            await github.updateFile('cms/posts/posts.json', jsonString, 'Update blog posts from CMS');
            console.log('Data saved to GitHub successfully');
            return true;
        } catch (corsError) {
            console.error('CORS error when saving to GitHub:', corsError);

            // If CORS error occurs, provide a fallback method
            // Create a downloadable file with instructions
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'posts.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Could not save directly to GitHub due to CORS restrictions. A file has been downloaded instead. Please manually commit this file to your GitHub repository.');
            return false;
        }
    } catch (error) {
        console.error('Error saving data to GitHub:', error);
        return false;
    }
}

// Function to check GitHub configuration and show appropriate UI
function updateGitHubUI() {
    const githubStatusElement = document.getElementById('github-status');
    if (!githubStatusElement) return;

    if (github.isConfigured()) {
        githubStatusElement.innerHTML = `
            <div class="flex items-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>GitHub connected: ${github.config.username}/${github.config.repo}</span>
                <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" class="ml-2 text-xs text-blue-600 underline">Enable CORS Proxy</a>
            </div>
        `;
    } else {
        githubStatusElement.innerHTML = `
            <div class="flex items-center text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>GitHub not configured - <a href="github-proxy.html" class="underline">Configure now</a></span>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Update GitHub UI
    updateGitHubUI();
});
