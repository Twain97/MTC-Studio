# MTC Studio Portfolio

Photography portfolio rebuilt as a server-rendered Node.js application using Express, EJS, MongoDB, and Tailwind CSS.

## Setup

1. Update `.env` with MongoDB, SMTP, WhatsApp, and admin credentials.
2. Run `npm run install:all`.
3. Start MongoDB locally or use a MongoDB Atlas URI.
4. Run `npm run dev`.

The site and API both run from `http://localhost:5000`. The first server start creates the admin account from `.env` when it does not exist.

## Stack

- Express serves the public pages and admin screens with EJS templates.
- Tailwind compiles to `server/public/css/app.css`.
- Existing MongoDB models, uploads, mail notifications, and admin JSON APIs remain in place.

## Production

Run `npm run build`, set `NODE_ENV=production`, and run `npm start`.

## Persistent project images

Project thumbnails and gallery images are stored in MongoDB GridFS so they remain available across hosting deployments. The host must use the same persistent MongoDB database for both project records and image files. New image uploads are staged in the operating system's temporary directory and then stored in GridFS; contract PDFs continue to use the local uploads directory.

After deploying this storage change, migrate existing project images while their files are still available locally. In a checkout containing the legacy files under `uploads/images`, set `MONGODB_URI` to the production database URI in your environment and run `npm run migrate:images`. The script updates each project's image paths in MongoDB after copying its image into GridFS. Keep the old files until migration completes and the hosted site has been checked.
