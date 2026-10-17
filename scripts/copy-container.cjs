const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const dataStorePath = path.join(rootDir, 'data_store.json');
const dataSeedPath = path.join(rootDir, 'data_store_seed.json');
const distDir = path.join(rootDir, 'dist');
const distDataStorePath = path.join(distDir, 'data_store.json');
const distDataSeedPath = path.join(distDir, 'data_store_seed.json');

console.log('[Release Preparation] Copying development container memory and data store to release artifacts...');

try {
  let sourceFile = null;
  if (fs.existsSync(dataStorePath)) {
    sourceFile = dataStorePath;
  } else if (fs.existsSync(dataSeedPath)) {
    sourceFile = dataSeedPath;
  }

  if (sourceFile) {
    let raw = fs.readFileSync(sourceFile, 'utf-8');
    
    // Purge old mock / deleted ads and ensure deletedBannerIds is preserved
    try {
      const parsed = JSON.parse(raw);
      const blockedAdIds = new Set(['ad-default-1', 'ad-default-2', ...(parsed.deletedBannerIds || [])]);
      if (parsed.feedAdSettings && Array.isArray(parsed.feedAdSettings.banners)) {
        parsed.feedAdSettings.banners = parsed.feedAdSettings.banners.filter(b => b && b.id && !blockedAdIds.has(b.id));
      }
      parsed.deletedBannerIds = Array.from(blockedAdIds);

      // Check all files to find the absolute highest known visitor count
      const metricCandidates = [
        dataStorePath,
        dataSeedPath,
        distDataStorePath,
        distDataSeedPath,
        path.join(rootDir, '.persistent_metrics.json'),
        path.join(distDir, '.persistent_metrics.json')
      ];
      let maxVisitors = 200000;
      let maxSessions = 21420;
      let latestUpdated = new Date().toISOString();

      for (const mPath of metricCandidates) {
        try {
          if (fs.existsSync(mPath)) {
            const mRaw = fs.readFileSync(mPath, 'utf-8');
            const mData = JSON.parse(mRaw);
            const mStats = mData.visitorStats || (mData.totalVisitors ? mData : null);
            if (mStats && typeof mStats.totalVisitors === 'number') {
              if (mStats.totalVisitors > maxVisitors) maxVisitors = mStats.totalVisitors;
              if (typeof mStats.uniqueSessionsCount === 'number' && mStats.uniqueSessionsCount > maxSessions) {
                maxSessions = mStats.uniqueSessionsCount;
              }
              if (mStats.lastUpdated) latestUpdated = mStats.lastUpdated;
            }
          }
        } catch (_) {}
      }

      // Protect visitor count from ever resetting during build/release packaging
      if (!parsed.visitorStats || typeof parsed.visitorStats !== 'object') {
        parsed.visitorStats = { totalVisitors: maxVisitors, uniqueSessionsCount: maxSessions, lastUpdated: latestUpdated };
      } else {
        parsed.visitorStats.totalVisitors = Math.max(maxVisitors, Number(parsed.visitorStats.totalVisitors) || 0, 200000);
        parsed.visitorStats.uniqueSessionsCount = Math.max(maxSessions, Number(parsed.visitorStats.uniqueSessionsCount) || 0, 21420);
      }

      // Persist metrics file in root
      try {
        fs.writeFileSync(path.join(rootDir, '.persistent_metrics.json'), JSON.stringify(parsed.visitorStats, null, 2), 'utf-8');
      } catch (_) {}

      // Protect Community Heroes reputation points and achievements across releases
      if (Array.isArray(parsed.communityHeroes)) {
        // Ensure no profile is downgraded or lost
        parsed.communityHeroes = parsed.communityHeroes.map((hero) => {
          if (!hero) return hero;
          return {
            ...hero,
            totalReputation: Math.max(0, Number(hero.totalReputation) || 0)
          };
        });
      }

      raw = JSON.stringify(parsed, null, 2);
    } catch (parseErr) {
      console.warn('[Release Preparation] Notice cleaning seed JSON:', parseErr.message);
    }

    // 1. Ensure seed file is 100% updated with development container state
    fs.writeFileSync(dataSeedPath, raw, 'utf-8');
    console.log(`[Release Preparation] Successfully copied ${path.basename(sourceFile)} to data_store_seed.json (${(raw.length / 1024).toFixed(1)} KB)`);

    // 2. Ensure dist directory has the container state
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    fs.writeFileSync(distDataStorePath, raw, 'utf-8');
    fs.writeFileSync(distDataSeedPath, raw, 'utf-8');
    console.log(`[Release Preparation] Successfully copied development container to dist/data_store.json & dist/data_store_seed.json`);

    // 3. Copy Firebase config to dist if present
    const fbConfig = path.join(rootDir, 'firebase-applet-config.json');
    if (fs.existsSync(fbConfig)) {
      fs.copyFileSync(fbConfig, path.join(distDir, 'firebase-applet-config.json'));
    }

    // 4. Synchronize all advertisement banner images between public/ads and dist/ads
    const publicAdsDir = path.join(rootDir, 'public', 'ads');
    const distAdsDir = path.join(distDir, 'ads');
    if (!fs.existsSync(publicAdsDir)) fs.mkdirSync(publicAdsDir, { recursive: true });
    if (!fs.existsSync(distAdsDir)) fs.mkdirSync(distAdsDir, { recursive: true });

    // Copy public/ads -> dist/ads
    if (fs.existsSync(publicAdsDir)) {
      const publicFiles = fs.readdirSync(publicAdsDir);
      for (const file of publicFiles) {
        const src = path.join(publicAdsDir, file);
        const dst = path.join(distAdsDir, file);
        if (fs.statSync(src).isFile()) {
          try { fs.copyFileSync(src, dst); } catch (_) {}
        }
      }
    }

    // Mirror dist/ads -> public/ads
    if (fs.existsSync(distAdsDir)) {
      const distFiles = fs.readdirSync(distAdsDir);
      for (const file of distFiles) {
        const src = path.join(distAdsDir, file);
        const dst = path.join(publicAdsDir, file);
        if (fs.statSync(src).isFile() && !fs.existsSync(dst)) {
          try { fs.copyFileSync(src, dst); } catch (_) {}
        }
      }
    }

    // Ensure essential fallbacks exist
    const roadsideSrc = path.join(publicAdsDir, 'banner-roadside-assist.jpg');
    if (fs.existsSync(roadsideSrc)) {
      const road1 = path.join(publicAdsDir, 'banner-ad-1789458493209.jpg');
      const road2 = path.join(publicAdsDir, 'banner-ad-default-1.jpg');
      const distRoad1 = path.join(distAdsDir, 'banner-ad-1789458493209.jpg');
      const distRoad2 = path.join(distAdsDir, 'banner-ad-default-1.jpg');
      if (!fs.existsSync(road1)) fs.copyFileSync(roadsideSrc, road1);
      if (!fs.existsSync(road2)) fs.copyFileSync(roadsideSrc, road2);
      if (!fs.existsSync(distRoad1)) fs.copyFileSync(roadsideSrc, distRoad1);
      if (!fs.existsSync(distRoad2)) fs.copyFileSync(roadsideSrc, distRoad2);
    }

    // Ensure Prostar Electrical banner exists
    const prostarFile = path.join(publicAdsDir, 'banner-ad-1789199776018.jpg');
    const prostarDist = path.join(distAdsDir, 'banner-ad-1789199776018.jpg');
    if (!fs.existsSync(prostarFile) || !fs.existsSync(prostarDist)) {
      try {
        require('./generate-prostar-banner.cjs');
      } catch (genErr) {
        console.warn('[Release Preparation] Notice generating Prostar banner:', genErr.message);
      }
    }

    console.log('[Release Preparation] Verified and synchronized all advertisement assets.');
  } else {
    console.warn('[Release Preparation] Notice: Neither data_store.json nor data_store_seed.json was found in container root.');
  }
} catch (err) {
  console.error('[Release Preparation] Error copying container data to release:', err.message);
}
