# Petspace - Backend

API and real-time server for [Petspace](https://github.com/k1nada/petspace-frontend), the social network where you make a profile for your pet instead of yourself.

## What's in it

- JWT auth, multi-step onboarding
- Friends, friend requests, followers/following
- Posts, comments, likes, reposts, post walls
- Family tree (parent/child pets)
- Photo uploads through Cloudinary
- Real-time chat and online presence via Socket.IO
- Breed/country reference data, with seed scripts to fill the DB

## Stack

Node.js, Express 5, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Cloudinary, Multer, express-validator

## Structure

```
config/       app configuration
controllers/  request handlers / business logic
middleware/    auth middleware, file upload (multer)
models/       Mongoose schemas
routers/      Express routes
scripts/      one-off seed scripts (breeds, countries)
sockets/      Socket.IO event handlers
utils/        shared helpers (cloudinary, error formatting)
server.js     app entry point
```

## Running it

```bash
npm install
npm start
```

Needs a `.env` with:

```
PORT=
JWT_SECRET=
MONGO_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=
```

To seed breeds/countries:

```bash
node scripts/seedBreeds.js
node scripts/seedCountries.js
```

## Status

In development.

## Related

- Frontend: [petspace-frontend](https://github.com/k1nada/petspace-frontend)
