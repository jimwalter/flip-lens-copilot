# Flip Lens - Supabase Architecture

## Overview
Supabase backend for user authentication, search history storage, and monetization tracking.

## Database Schema

### Table: `users`
Auto-managed by Supabase Auth. Extended with custom fields:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  email TEXT,
  scan_count INT DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Table: `searches`
Store each scan/search event:
```sql
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_url TEXT,
  screenshot_data TEXT, -- base64 or storage ref
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Table: `search_results`
Aggregated metadata from Google Lens/Images:
```sql
CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  title TEXT,
  price_low DECIMAL(10, 2),
  price_high DECIMAL(10, 2),
  result_url TEXT,
  thumbnail_url TEXT,
  source TEXT, -- 'ebay', 'google-images', etc.
  created_at TIMESTAMP DEFAULT now()
);
```

## Authentication Flow
1. User signs up → Supabase Auth creates user + session
2. Session stored in browser localStorage
3. Each API call includes auth token
4. Extension verifies token before allowing scans

## Scan Limit Logic
```typescript
// On each scan:
if (user.scan_count >= 10 && !user.is_premium) {
  // Show paywall
} else {
  // Proceed with scan
  scan_count += 1
}
```

## Future Enhancements
- Stripe integration for premium upgrades
- Search result caching (avoid duplicate scrapes)
- Export history to CSV
- AI-powered flip valuation recommendations

## Deployment
- Supabase hosting (PostgreSQL)
- Row-level security (RLS) for data isolation
- Real-time subscriptions for live search updates

## Environment Variables Needed
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```
