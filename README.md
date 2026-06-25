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
