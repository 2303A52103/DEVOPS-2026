# 🌍 Wanderlust — Tourist Recommendation System

A full-stack MERN web application (MongoDB + Express + Node.js) for discovering and managing tourist destinations.

---

## 📁 Project Structure

```
tourist-app/
├── backend/
│   ├── controllers/
│   │   └── placeController.js   # Business logic for all place operations
│   ├── middleware/
│   │   └── upload.js            # Multer config for image uploads
│   ├── models/
│   │   └── Place.js             # Mongoose schema/model
│   ├── routes/
│   │   ├── places.js            # Public API routes
│   │   └── admin.js             # Admin/stats routes
│   ├── uploads/                 # Uploaded images stored here
│   ├── .env                     # Environment variables
│   ├── package.json
│   ├── seed.js                  # Sample data seeder
│   └── server.js                # Express app entry point
│
└── frontend/
    ├── index.html               # Single-page app shell
    ├── style.css                # Full responsive styles
    └── app.js                   # API calls + UI logic
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (local) → https://www.mongodb.com/try/download/community  
  OR **MongoDB Atlas** (free cloud) → https://cloud.mongodb.com

---

## 🚀 Setup Instructions

### 1. Clone / download the project

```bash
cd tourist-app/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tourist_db
# For Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/tourist_db
NODE_ENV=development
```

### 4. Seed sample data (optional but recommended)

```bash
npm run seed
```

This inserts 12 sample destinations (Bali, Santorini, Machu Picchu, etc.)

### 5. Start the server

```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

### 6. Open in browser

```
http://localhost:5000
```

---

## 🔌 REST API Reference

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/api/places`             | List/filter all places             |
| GET    | `/api/places/top-rated`   | Places with rating ≥ 4.0          |
| GET    | `/api/places/:id`         | Single place by ID                 |
| POST   | `/api/places`             | Create new place (multipart/form)  |
| PUT    | `/api/places/:id`         | Update existing place              |
| DELETE | `/api/places/:id`         | Soft-delete a place                |
| GET    | `/api/admin/stats`        | Dashboard statistics               |
| GET    | `/api/admin/places`       | All places including inactive      |

### Query Parameters for GET `/api/places`

| Param      | Example             | Description                          |
|------------|---------------------|--------------------------------------|
| `search`   | `bali`              | Full-text search across name/desc    |
| `location` | `Japan`             | Filter by location (partial match)   |
| `category` | `beach`             | Filter by category                   |
| `budget`   | `low`               | Filter: low / medium / high          |
| `sort`     | `rating`            | Sort: rating / name / newest         |
| `limit`    | `20`                | Results per page (default 20)        |
| `page`     | `1`                 | Page number                          |

### Example cURL requests

```bash
# Get all beach destinations
curl "http://localhost:5000/api/places?category=beach"

# Search for Japan, sorted by rating
curl "http://localhost:5000/api/places?location=Japan&sort=rating"

# Add a new place (with image URL)
curl -X POST http://localhost:5000/api/places \
  -F "name=Goa, India" \
  -F "description=Sun-soaked beaches and vibrant nightlife on the Konkan coast." \
  -F "location=Goa, India" \
  -F "category=beach" \
  -F "budget=low" \
  -F "rating=4.5" \
  -F "bestTimeToVisit=November – March" \
  -F "imageUrl=https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800"
```

---

## 🗄️ MongoDB Schema

```js
{
  name:            String  (required, max 100 chars)
  description:     String  (required, max 1000 chars)
  location:        String  (required)
  category:        String  (enum: beach|hill|city|forest|desert|historical|adventure)
  imageUrl:        String  (URL or /uploads/filename)
  rating:          Number  (0–5)
  budget:          String  (enum: low|medium|high)
  bestTimeToVisit: String
  isActive:        Boolean (soft-delete flag)
  createdAt:       Date    (auto)
  updatedAt:       Date    (auto)
}
```

---

## 🖼️ Image Handling

Two methods supported:

**1. URL (recommended for production)**
- Paste any public image URL in the "Image URL" field
- Works with Unsplash, Cloudinary, S3, etc.

**2. File Upload (multer)**
- Upload directly from the admin panel
- Files saved to `backend/uploads/`
- Served at `http://localhost:5000/uploads/<filename>`
- 5 MB limit, accepts: jpeg, jpg, png, gif, webp

---

## 🌱 Sample Data

Run `npm run seed` to load 12 curated destinations:

| Destination          | Category   | Rating | Budget |
|----------------------|------------|--------|--------|
| Bali, Indonesia      | Beach      | 4.8    | Medium |
| Santorini, Greece    | City       | 4.9    | High   |
| Banff National Park  | Hill       | 4.9    | Medium |
| Sahara Desert        | Desert     | 4.7    | Low    |
| Machu Picchu         | Historical | 4.9    | Medium |
| Amazon Rainforest    | Forest     | 4.6    | Medium |
| Maldives             | Beach      | 4.9    | High   |
| Kyoto, Japan         | Historical | 4.8    | Medium |
| Patagonia            | Adventure  | 4.8    | High   |
| Amalfi Coast         | City       | 4.7    | High   |
| Great Barrier Reef   | Beach      | 4.7    | High   |
| Leh-Ladakh, India    | Hill       | 4.6    | Low    |

---

## 🚢 Deploy to Production

### Option A: Railway / Render (free)

1. Push code to GitHub
2. Create a new web service pointing to `backend/`
3. Set `MONGODB_URI` env var (use Atlas)
4. Set start command: `node server.js`

### Option B: VPS (DigitalOcean / EC2)

```bash
npm install -g pm2
pm2 start server.js --name tourist-app
pm2 save && pm2 startup
```

---

## 🛠️ Tech Stack

| Layer    | Technology            |
|----------|-----------------------|
| Runtime  | Node.js v18+          |
| Framework| Express.js 4          |
| Database | MongoDB + Mongoose 8  |
| Uploads  | Multer                |
| Frontend | Vanilla HTML/CSS/JS   |
| Fonts    | Playfair Display + DM Sans (Google Fonts) |
