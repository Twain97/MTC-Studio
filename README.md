# MTC Studio Portfolio

Full-stack photography portfolio built with Vue 3, Tailwind CSS, Node.js, Express, MongoDB, and Nodemailer.

## Setup

1. Update `.env` with MongoDB, SMTP, WhatsApp, and admin credentials.
2. Run `npm run install:all`.
3. Start MongoDB locally or use a MongoDB Atlas URI.
4. Run `npm run dev`.

The public site runs at `http://localhost:5173` and the API at `http://localhost:5000`. The first API start creates the admin account from `.env` when it does not exist.

## Production

Run `npm run build`, set `NODE_ENV=production`, and run `npm start`. Express serves the generated Vue app from `client/dist`.

