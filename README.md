# MTC Studio Portfolio

Photography portfolio rebuilt as a server-rendered Node.js application using Express, EJS, MongoDB, and Tailwind CSS.

## Setup

1. Update `.env` with MongoDB, SMTP, WhatsApp, and admin credentials.
2. Run `npm run install:all`.
3. Start MongoDB locally or use a MongoDB Atlas URI.
4. Run `npm run dev`.

The site and API both run from `http://localhost:5000`. The first server start creates the admin account from `.env` when it does not exist.

## Image compressor and converter

Both image tools process files in the visitor's browser. Original and processed images are not uploaded to the server or saved in MongoDB.

- **Image Compressor:** Compresses JPG/JPEG and WebP images while keeping their original format. It accepts up to 10 files, with a 20 MB limit per file. Its quality setting applies to JPG and WebP. PNG files are skipped with a warning because PNG uses lossless compression and may not get smaller; the warning offers a link to convert the PNG to JPG. Camera RAW files are also skipped with a warning and can be sent to the converter.
- **Image Converter:** Converts JPG, PNG, WebP, and supported camera RAW files to JPG, PNG, or WebP. It accepts up to 5 files, with a 20 MB limit per file. JPG output uses a white background where the source has transparency.
- **Remove Background:** A separate page accepts one JPG, PNG, or WebP image up to 20 MB. It shows a draggable before/after slider, runs the background removal model in a browser worker, and includes eraser and restore brushes with undo for cleaning up the result. Visitors can download both the original model output and an edited transparent WebP. Other file types are rejected with a prompt to convert them first. The model files are downloaded from Hugging Face on first use and cached by the browser; image processing itself stays on the visitor's device.

The image compressor, converter, and background remover save selected images and generated results in the visitor's browser storage so they survive refreshes. Each item expires 30 minutes after it was selected and is deleted when the visitor clears it. Expired browser-storage records are removed the next time the tool page opens if the browser was closed at expiry. Downloaded copies saved on the visitor's own device are outside the website's control and must be deleted by the visitor.

## Stack

- Express serves the public pages and admin screens with EJS templates.
- Tailwind compiles to `server/public/css/app.css`.
- Existing MongoDB models, uploads, mail notifications, and admin JSON APIs remain in place.

## Production

Run `npm run build`, set `NODE_ENV=production`, and run `npm start`.

## Persistent project images

Project thumbnails and gallery images are stored in MongoDB GridFS so they remain available across hosting deployments. The host must use the same persistent MongoDB database for both project records and image files. New image uploads are staged in the operating system's temporary directory and then stored in GridFS; contract PDFs continue to use the local uploads directory.

After deploying this storage change, migrate existing project images while their files are still available locally. In a checkout containing the legacy files under `uploads/images`, set `MONGODB_URI` to the production database URI in your environment and run `npm run migrate:images`. The script updates each project's image paths in MongoDB after copying its image into GridFS. Keep the old files until migration completes and the hosted site has been checked
