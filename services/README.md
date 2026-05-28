# Services Architecture

This directory contains the service layer that connects your React Native app to Contentful (CMS) and Supabase (database).

## Structure

```
services/
├── contentfulClient.js   # Contentful CMS client
├── supabaseClient.js     # Supabase database client
├── feedService.js        # Feed fetching with bulk queries (avoids N+1)
├── voteService.js        # Voting operations
└── commentService.js     # Comments CRUD operations
```

## Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 2. Contentful Setup

1. Create a content type called `post` with these fields:
   - `title` - Short text (required)
   - `content` - Long text (required)
   - `author` - Short text (default: "Admin Team")
   - `images` - Media (many files, optional)
   - `tags` - Short text, list (optional)

2. Get your Space ID and Access Token from:
   - https://www.contentful.com/developers/docs/references/authentication/

### 3. Supabase Setup

1. Create a new project at https://supabase.com
2. Run the SQL schema in your Supabase SQL editor:

```sql
-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Get your URL and Anon Key from:
   - https://supabase.com/dashboard/project/_/settings/api

## Service Usage

### Feed Service

```javascript
import { getFeed } from '../services/feedService';

// Fetch feed with bulk queries (avoids N+1 problem)
const { posts, total } = await getFeed({
  limit: 20,
  skip: 0,
  userId: 'user123' // optional, for personal vote data
});
```

### Vote Service

```javascript
import { vote } from '../services/voteService';

// Toggle vote (up/down/remove)
const result = await vote(userId, postId, 'up');
// result: { action: 'created' | 'updated' | 'removed', voteType: 'up' | 'down' | null }
```

### Comment Service

```javascript
import { getComments, addComment } from '../services/commentService';

// Get comments for a post
const comments = await getComments(postId);

// Add a comment
const newComment = await addComment(userId, postId, 'Great post!');
```

## Performance Notes

- **Bulk Queries**: Feed fetching uses bulk queries with `WHERE post_id IN (...)` to avoid N+1 problem
- **Concurrent Fetching**: Single post fetch uses `Promise.all` for parallel API calls
- **Optimistic UI**: Feed screen updates UI immediately, then syncs with server
- **Pagination**: Infinite scroll loads 20 posts per batch

## Webhook Setup (Optional)

For cleanup when posts are deleted in Contentful, set up a webhook:

1. Create a serverless function that handles Contentful webhooks
2. Listen for `Unpublish` and `Delete` events
3. Cascade delete votes and comments from Supabase

Example webhook logic:
```javascript
if (sys.publishedVersion === null || sys.archivedVersion === null) {
  await supabase.from('votes').delete().eq('post_id', sys.id);
  await supabase.from('comments').delete().eq('post_id', sys.id);
}
```