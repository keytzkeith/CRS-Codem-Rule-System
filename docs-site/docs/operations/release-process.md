---
title: Release Process
sidebar_position: 3
---

# Release Process

CRS should use one release source, then sync the rest of the repo from it.

## Source of truth

The release source lives in:

- `config/release.json`

It currently holds:

- version
- stage
- billing status note
- release tag
- next milestone note

## Sync command

After editing `config/release.json`, run:

```bash
node scripts/sync-release-version.js
```

That updates:

- `config/siteIdentity.json`
- `frontend/package.json`
- `backend/package.json`
- `docs-site/package.json`

## Recommended versioning

Use semantic versioning:

- patch: `2.2.1`
  Small fixes only.
- minor: `2.3.0`
  New features that do not break the product structure.
- major: `3.0.0`
  Breaking changes, larger architectural shifts, or a major new product phase.

For betas, use Git tags like:

- `v2.2.0-beta.1`
- `v2.2.0-beta.2`
- `v2.2.0`

## Release steps

1. Finish the work for a checkpoint.
2. Update `config/release.json`.
3. Run `node scripts/sync-release-version.js`.
4. Update `CHANGELOG.md`.
5. Commit the release prep.
6. Tag the release in Git.
7. Push commits and tags.
8. Create a GitHub release from that tag.
9. Deploy the tagged version.

## Git commands

Example for the current beta flow:

```bash
git add .
git commit -m "Prepare v2.2.0-beta.1 release"
git tag v2.2.0-beta.1
git push origin main
git push origin v2.2.0-beta.1
```

If the beta is stable and you want the full release later:

```bash
git tag v2.2.0
git push origin v2.2.0
```

## How often to release

Do not bump the version for every small commit.

A good rhythm is:

- patch release when fixes accumulate into a stable checkpoint
- minor release when a real product capability lands
- beta tag when you want a reviewable public milestone without calling it final

## Billing note

Billing is intentionally deferred for the current beta line.

When premium access work starts later, treat it as its own milestone and release it deliberately rather than mixing it into ongoing cleanup work.
