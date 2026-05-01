-- Run this in the Supabase SQL Editor

-- 1. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT,
  category TEXT DEFAULT 'Reflections',
  tags JSONB DEFAULT '[]'::jsonb,
  cover_image TEXT DEFAULT '',
  read_time INTEGER DEFAULT 5,
  status TEXT DEFAULT 'Draft',
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT,
  category TEXT DEFAULT 'Essay',
  tags JSONB DEFAULT '[]'::jsonb,
  cover_image TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 10,
  status TEXT DEFAULT 'Draft',
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  synopsis TEXT,
  cover_image TEXT DEFAULT '',
  genre TEXT DEFAULT 'Fiction',
  year INTEGER,
  chapters JSONB DEFAULT '[]'::jsonb,
  external_link TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft',
  featured BOOLEAN DEFAULT false,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Public profiles are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone." ON public.articles FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone." ON public.books FOR SELECT USING (true);

-- Create policies to allow all access (since authentication is managed by your backend admin login)
-- IMPORTANT: Since your backend uses a Service Key or bypasses RLS via the server, 
-- you can just allow all operations IF you are interacting only through the backend.
CREATE POLICY "Enable insert for authenticated users only" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.posts FOR DELETE USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.articles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.articles FOR DELETE USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.books FOR DELETE USING (true);
