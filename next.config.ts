/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com', // <--- REQUIRED for your uploads
      'res.cloudinary.com',             // Keep if using Cloudinary fonts/assets
      // any other domains you use
    ],
  },
}

module.exports = nextConfig