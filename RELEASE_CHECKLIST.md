# Release Checklist

Use this every time you want to publish a reviewable CRS version.

## 1. Decide the release type

- patch: small fixes only
- minor: meaningful feature milestone
- major: breaking or structural shift
- beta tag: reviewable checkpoint before a full release

## 2. Update release source

Edit:

- `config/release.json`

Update:

- `version`
- `stage`
- `billing`
- `tag`
- `nextMilestone`

## 3. Sync versions

```bash
node scripts/sync-release-version.js
```

This updates:

- `config/siteIdentity.json`
- `frontend/package.json`
- `backend/package.json`
- `docs-site/package.json`

## 4. Update the changelog

Edit:

- `CHANGELOG.md`

Add:

- release heading
- date
- changes
- known limitations
- next planned step

## 5. Run validation

```bash
cd frontend && npm run build
cd ../docs-site && npm run build
cd ../backend && npm test
```

If there are backend tests you intentionally skip, note that in the release notes.

## 6. Commit release prep

```bash
git add .
git commit -m "Prepare vX.Y.Z release"
```

## 7. Create the tag

Examples:

```bash
git tag v2.2.0-beta.1
git tag v2.2.0
```

## 8. Push branch and tag

```bash
git push origin main
git push origin v2.2.0-beta.1
```

## 9. Create GitHub release

On GitHub:

1. Open `Releases`
2. Draft a new release
3. Select the tag
4. Paste the changelog summary
5. Publish

## 10. Deploy the tagged state

For CRS:

- frontend on Vercel
- docs on Vercel
- backend on VPS or other Node-friendly host

## Current policy

- current stream: `2.2.x Beta`
- premium billing: deferred to a later v2 milestone
- do not bump version for every tiny commit
