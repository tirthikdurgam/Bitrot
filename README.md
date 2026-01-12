# 🍂 BitLoss / BitRot

**"Digital Decay in Real-Time."**

BitLoss is an experimental social media platform exploring the concept of **digital entropy**. Unlike traditional platforms where data is immutable and forever, images on BitLoss naturally **decay** over time. User interactions (viewing, "healing," or "corrupting") accelerate or reverse this process, turning every upload into a fleeting, evolving artifact.

## Core Concepts

* **Entropy (Time Decay):** Every image uploaded loses "integrity" (quality) over time automatically.
* **Witness Effect:** The more an image is viewed, the faster it decays.
* **Interaction Economy:** Users spend **Credits** to intervene:
* **Heal (Wrench):** Restores 5% integrity (Cost: 10 Credits).
* **Corrupt (Hammer):** Inflicts 5% damage (Cost: 10 Credits).


* **Permadeath:** When an image hits 0% integrity, it is **destroyed forever**. It moves to the "Graveyard" and can no longer be viewed or healed.
* **Secret Gates:** Users can embed hidden text payloads inside images. These secrets are only revealed if the image maintains high integrity (>80%). If it rots, the secret is lost.

## Tech Stack

### **Frontend (Client)**

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animations)
* **State Management:** React Hooks (`useState`, `useEffect`)
* **Deployment:** Vercel

### **Backend (Server)**

* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Image Processing:** Custom `bitrot` library (byte-level manipulation) + `Pillow`
* **Background Tasks:** `Asyncio` for non-blocking decay operations.
* **Deployment:** Render / Railway

### **Database & Storage**

* **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Storage:** Supabase Storage (Buckets for Active/Original/Archived images)
* **Auth:** Supabase Auth

## Getting Started

### Prerequisites

* Node.js 18+
* Python 3.9+
* Supabase Account

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bitloss.git
cd bitloss

```

### 2. Backend Setup

Navigate to the backend folder and install dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

```

Create a `.env` file in `backend/`:

```env
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_service_role_key"

```

Run the server:

```bash
uvicorn main:app --reload --port 8000

```

### 3. Frontend Setup

Open a new terminal, navigate to the root (or frontend folder), and install dependencies:

```bash
npm install
# or
yarn install

```

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"

```

Run the development server:

```bash
npm run dev

```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
bitloss/
├── backend/
│   ├── main.py            # API Endpoints (FastAPI)
│   ├── decay.py           # Image corruption logic
│   ├── database.py        # Supabase connection
│   ├── cleanup.py         # Archival scripts (The Reaper)
│   └── requirements.txt
├── src/
│   ├── app/               # Next.js Pages (Feed, Upload, Login)
│   ├── components/        # React Components (FeedCard, Sidebar)
│   ├── hooks/             # Custom Hooks (useSecretGate)
│   └── utils/             # Supabase Client helper
└── public/                # Static assets

```

## Database Schema (Supabase)

**`users`**

* `id` (UUID, PK)
* `username` (Text)
* `credits` (Int, Default: 100)
* `kills` (Int, Default: 0)

**`images`**

* `id` (UUID, PK)
* `uploader_id` (UUID, FK -> users.id)
* `storage_path` (Text)
* `bit_integrity` (Float, 0-100)
* `generations` (Int)
* `is_archived` (Bool)

**`comments`**

* `id` (UUID, PK)
* `post_id` (UUID, FK -> images.id)
* `username` (Text)
* `content` (Text)
* `integrity_snapshot` (Float)

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

**"Everything rots. Eventually."**
