# WeHustleIt Blog CMS

This is a simple Content Management System (CMS) for the WeHustleIt blog. It allows you to create, edit, and manage blog posts, categories, and tags.

## Features

- **Admin Dashboard**: Secure admin interface for managing blog content
- **Post Management**: Create, edit, and delete blog posts
- **Rich Text Editor**: Format your content with a WYSIWYG editor
- **Categories & Tags**: Organize your content with categories and tags
- **Image Upload**: Add images to your blog posts
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

1. Access the admin dashboard at `/cms/admin.html`
2. Login with the default credentials:
   - Username: `admin`
   - Password: `admin`
   
   **Important**: Change these credentials in `config.js` for production use!

3. Start creating and managing your blog content

## File Structure

- `admin.html`: The admin dashboard interface
- `admin.js`: JavaScript for the admin dashboard
- `blog.js`: JavaScript for the blog frontend
- `config.js`: Configuration settings for the CMS
- `posts/`: Directory containing blog post data
  - `posts.json`: JSON file storing all blog posts, categories, and tags
- `uploads/`: Directory for storing uploaded images

## Security Considerations

This is a client-side CMS using local storage and JSON files. For production use, consider:

1. Implementing proper server-side authentication
2. Using a database instead of JSON files
3. Setting up proper file upload security
4. Adding CSRF protection
5. Implementing proper error handling and logging

## Customization

You can customize the CMS by modifying:

- `config.js`: Change settings like posts per page, admin credentials, etc.
- `admin.html`: Modify the admin interface layout
- `admin.js`: Customize admin functionality
- `blog.js`: Customize blog frontend functionality

## Troubleshooting

- **Login Issues**: If you can't login, check the credentials in `config.js`
- **Post Not Saving**: Ensure the `posts` directory is writable
- **Image Upload Fails**: Ensure the `uploads` directory is writable
- **Changes Not Reflecting**: Clear your browser cache or try in incognito mode
