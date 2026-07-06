# 🏁 NASCAR Stage Points Tracker

## Weekly Setup (config.js)
1. Update `raceName` and `raceTrack`
2. Update `liveFeedUrl` and `livePointsUrl` with the current Race ID
   - Find Race ID via DevTools → Network → filter "live-feed.json"
3. Update each player's `driverName` to match names in live-feed.json exactly

## Hosting
- **GitHub Pages**: Push all files to a repo → Settings → Pages → Deploy from main
- **Netlify**: Drag the folder onto netlify.com
- **Local**: `python -m http.server 8080` then open localhost:8080
  ⚠️ Don't open index.html directly as file:// — fetch() is blocked

## Points Logic
| Column | Shows |
|--------|-------|
| STG 1  | `*` projected during Stage 1; locked after stage ends |
| STG 2  | Blank until Stage 2 starts; locked after it ends |
| FINAL  | Blank until checkered flag |
| TOTAL  | Sum of all locked-in points |

## Troubleshooting
| Problem | Fix |
|---------|-----|
| All `—` / no data | Check URLs; confirm race is live |
| One player missing | Driver name spelling mismatch in config.js |
| CORS error | Must be on a hosted URL, not file:// |
