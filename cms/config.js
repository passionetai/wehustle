// CMS Configuration
const CMS_CONFIG = {
    postsDirectory: 'cms/posts',
    uploadsDirectory: 'cms/uploads',
    postsPerPage: 8,
    adminUsername: 'admin', // Change this in production
    adminPasswordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' // SHA-256 hash of 'admin'
};

// Do not modify below this line
if (typeof module !== 'undefined') {
    module.exports = CMS_CONFIG;
} else {
    // For browser use
    if (typeof window !== 'undefined') {
        window.CMS_CONFIG = CMS_CONFIG;
    }
}
