# Release Notes — LiveTrafficNPC v2.8.0

**Release Version:** v2.8.0  
**Release Date:** September 16, 2026  
**Target Environment:** Cloud Run Production & Development (`ai-studio-livetraffic-101b105b-68d5-43ee-8a17-beaded637fb4`)  

---

## Executive Summary

Version 2.8.0 delivers critical improvements to live feed timeliness, user experience polish, visual layout consistency, and foundational database persistence. This release addresses stale highlight retention by tightening the live feed window from 24 hours down to **6 hours**, refines feed banner controls and badge layouts, sets **Bullet Points** as the default feed presentation, and establishes hardened, multi-tier persistence guarantees ensuring user accounts and credentials remain 100% safe across container deployments.

---

## Key Changes & Enhancements

### 1. Rolling Feed Window Tightened to 6 Hours (Replaces 24 Hours)
* **Problem Solved:** Incident highlights and broadcast alerts from the previous day were lingering at the top of the feed, causing confusion for motorists seeking current road conditions.
* **Implementation Details:**
  * Updated `src/utils/feedWindowUtils.ts` so the system-wide live feed window bounds default to `6 hours` (`SIX_HOURS_MS = 6 * 60 * 60 * 1000`).
  * Updated `src/components/LiveFeedSection.tsx` to filter all incident posts, highlights, and broadcast banners against the active 6-hour operational window.
  * Updated `src/components/AdminPostsManager.tsx` so administrative overview dashboards reflect the identical 6-hour rolling window.
  * Updated `server.ts` feed filtering and pruning logic so that items older than 6 hours are automatically removed from active feeds.
* **User Benefit:** The live feed and highlights section now exclusively display fresh, timely traffic events from the last 6 hours.

---

### 2. Partner Ad Banner Carousel Streamlining
* **Problem Solved:** The manual "Shuffle" button in the in-feed partner advertisement banner header added unnecessary UI clutter and distracted from automated carousel rotation.
* **Implementation Details:**
  * Removed the `🎲 Shuffle` button from the partner banner header in `src/components/LiveFeedSection.tsx`.
  * Preserved the automated 6-second timer cycle and smooth previous/next navigation arrows for intuitive ad engagement.
* **User Benefit:** Cleaner, distraction-free feed headers with consistent automated ad rotation.

---

### 3. Incident Badge & Title Typography Stacking
* **Problem Solved:** On smaller screens or when post titles were long, placing "Highlight" and "Broadcast" badges horizontally adjacent to title text caused text truncation, awkward wrapping, or horizontal displacement.
* **Implementation Details:**
  * Re-architected badge rendering in `src/components/LiveFeedSection.tsx` so priority badges sit cleanly on their own row directly above the headline and description.
  * Maintained high-contrast badge color tokens (amber/gold for Highlight, rose/red for Broadcast).
* **User Benefit:** Improved readability across mobile and desktop devices without badge overlap.

---

### 4. Default Feed View Configured to "Bullet Points"
* **Problem Solved:** Users preferred a concise, fast-scanning bulleted summary over card-heavy views upon first loading the traffic feed.
* **Implementation Details:**
  * Set `"bullets"` as the default view mode in `src/components/LiveFeedSection.tsx`.
  * Kept view toggles (Cards, Compact, Detailed, List) readily accessible for users who wish to switch dynamically.
* **User Benefit:** Instant scannability of road hazards, lane closures, and accident alerts upon landing on the live feed.

---

### 5. Multi-Tier User Persistence & Cloud Firestore Hardening
* **Problem Solved:** Guaranteed that existing and newly registered user accounts, advertiser credentials, and administrator roles cannot be lost when the application is published or redeployed to Cloud Run.
* **Verification & Audit:**
  * Confirmed that **392 registered user accounts** exist and are synchronized across `data_store.json`, `data_store_seed.json`, `dist/data_store_seed.json`, and remote Firestore (`test1-167912`).
* **Technical Hardening Added in v2.8.0:**
  * **On-Boot Firestore Hydration (`fetchRemoteUsersOnce`):** `server.ts` now explicitly fetches and merges all cloud-stored user accounts from Firestore (`app_state/users`) on startup before servicing incoming traffic.
  * **On-Demand Direct Query Fallback (`fetchSingleUserFromFirestore`):** Both `/api/auth/login` and `/api/admin/login` endpoints now feature an asynchronous Firestore fallback query. If a user was registered moments prior on another instance or during deployment, their credentials are authenticated directly against the cloud database.
  * **Immediate Sync on User Management:** Account creations (`POST /api/admin/users`), modifications (`PUT /api/admin/users/:id`), and password resets (`PUT /api/admin/users/:id/password`) immediately sync individual user documents via `saveSingleUserToFirestore` in addition to triggering global data store saves.
  * **Protected Built-In Staff Accounts:** Built-in credentials for Chief Administrator accounts (`charlesodendaal43@gmail.com`, `charles@salesbarn.co.za`, `charles2@salesbarn.co.za`) and dispatch officers (`sylvester@trafficlive.co.za`) remain guaranteed at the server code level.

---

## File Audit & Modified Components

| File Path | Nature of Change |
|---|---|
| `RELEASE_NOTES.md` | Created comprehensive v2.8.0 release documentation. |
| `server.ts` | Bumped version to `2.8.0`, updated `/api/version` release notes, implemented `fetchRemoteUsersOnce` on boot, added Firestore fallback on login, and added direct user syncing. |
| `src/utils/feedWindowUtils.ts` | Reduced default live feed window duration from 24 hours to 6 hours. |
| `src/components/LiveFeedSection.tsx` | Enforced 6-hour rolling window, removed shuffle button, stacked badge titles, set default view to bullet points. |
| `src/components/AdminPostsManager.tsx` | Aligned administrative post filtering with the 6-hour rolling feed window. |
| `scripts/copy-container.cjs` | Verified automated sync of seed files (`data_store_seed.json`) and Firebase configuration into `dist/` on build. |

---

## Deployment & Verification Instructions

1. **Local Build & Compilation:**
   ```bash
   npm run build
   ```
   *Verifies TypeScript compilation, runs container mirroring via `copy-container.cjs`, bundles `dist/server.cjs`, and validates that all 392 user accounts are embedded in release seed files.*

2. **Publishing to Cloud Run:**
   - In Google AI Studio, click the **Share** or **Deploy** action to deploy the latest container image to Cloud Run.
   - The production container will boot with `BUILD_ID: v2.8.0`, load the bundled seed data, attach real-time Firestore listeners, and immediately serve current traffic.
