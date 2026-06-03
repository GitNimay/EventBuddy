# Changelog

All notable changes to EventBuddy are documented here.

## [1.0.0] - 2026-06-03

### Added
- User authentication (email + password, forgot password)
- Onboarding flow with vibe and interest selection
- Profile setup with photo upload via Cloudinary
- Event discovery feed with search and smart filters
- Category chips and event cards with save toggle
- Create Event screen (3-step flow, official + community events)
- Event detail page with attendee count and buddy matching
- Saved events accessible from profile
- Map view with CARTO basemap tiles and event pins
- Buddy matching algorithm with trust score
- Open groups with create/join flow (server-enforced capacity)
- Buddy profile with connect/block/report actions
- Pre-event group chat with Supabase Realtime + Presence
- Notification bell with unread count badge
- ID verification flow (email confirmation)
- Live location sharing for event day
- Rate your buddy screen (5-star + comment)
- Report user screen (reason + description, auto-blocks)
- College clubs portal (browse, search, create, join)
- Club profile with members, events, join/leave
- Streak and badges system (7 badge types)
- Event recap with photo upload and share
- Ticket split calculator with UPI link generation
- Edit profile screen (name, bio, vibe, interests, photo)
- Settings screen (notification toggles, logout, delete account)
- Push token registration on app launch
- Admin dashboard (Next.js): users, events, reports, clubs management
- Admin audit log table with RLS
- EAS Build configuration (development, preview, production)
- GitHub Actions workflow for automated APK builds
- OTA update system with in-app prompt
- CHANGELOG.md

### Security
- RLS enabled on every table (zero tables without RLS)
- Service role key never in client code
- Messages sanitized (HTML tag stripping)
- Ticket splits verified via buddy_group_members join
- Badges and streaks only writable by Edge Functions (service role)
- Account deletion via Edge Function (full data cleanup)
- Admin dashboard middleware checks session + role on every route
- Push notifications contain only human-readable text
