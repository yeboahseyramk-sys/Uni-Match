# UniMatch - Campus Dating App

A modern, student-verified dating app built for university campuses. Deployed on GitHub Pages with Supabase backend.

**Live URL:** https://yeboahseyramk-sys.github.io/Uni-Match/

---

## What's New in v2.0

### Real Authentication & Database (Supabase)
- **Email/password login** with email verification
- **Google OAuth** sign-in
- No more dummy login — real auth only
- All user profiles stored in Supabase PostgreSQL database

### Photo & Identity Verification
- **Minimum 3 photos** required during signup
- **Live camera face verification** — users take a selfie to prove they're real
- Date of Birth field (immutable after registration)

### Real-Time Messaging
- Messages sent via Supabase Realtime
- **No bot replies** — only real users can send messages
- Instant delivery between matched users

### Clear Profile Images
- Removed all blur and opacity effects from profile photos
- Cards behind the top card are clearly visible (92% opacity, no blur)

---

## Supabase Setup (Required)

Before the app works fully, you need to configure Supabase:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Project Settings → API**
4. Copy the **Project URL** and **anon public** API key

### 2. Update `app.js`
Open `app.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Set Up Database Tables

Run these SQL statements in the Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    dob DATE,
    age INTEGER,
    gender TEXT,
    faculty TEXT,
    bio TEXT,
    interests TEXT[],
    photos TEXT[],
    face_verification TEXT,
    interested_in TEXT,
    age_min INTEGER DEFAULT 18,
    age_max INTEGER DEFAULT 25,
    max_distance INTEGER DEFAULT 5,
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Likes table
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    liked BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, liked_user_id)
);

-- Matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 4. Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, but only edit their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Likes: users can only see their own likes
CREATE POLICY "Users can view own likes" ON likes
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = liked_user_id);
CREATE POLICY "Users can create likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches: users can see matches they're in
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create matches" ON matches
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages: users can see messages for their matches
CREATE POLICY "Users can view match messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        )
    );
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = messages.match_id
            AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
        )
    );
```

### 5. Enable Google OAuth (Optional)
1. Go to **Authentication → Providers**
2. Enable **Google**
3. Add your Google OAuth credentials (or use Supabase's default)
4. Add your site URL (`https://yeboahseyramk-sys.github.io/Uni-Match/`) to **Authentication → URL Configuration → Redirect URLs**

### 6. Configure Email Templates (Optional)
1. Go to **Authentication → Email Templates**
2. Customize the confirmation email if desired
3. Add your site URL to **Site URL** and **Redirect URLs**

---

## Local Development

To run locally, simply open `index.html` in a browser or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .
```

---

## Deploying Updates

Push changes to the `main` branch:

```bash
git add .
git commit -m "Update description"
git push origin main
```

GitHub Pages will automatically deploy the updated site within a few minutes.

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend/Auth:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** GitHub Pages
- **Icons:** Font Awesome
- **Fonts:** Google Fonts (Poppins)
