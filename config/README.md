# Site Identity

Use [`siteIdentity.json`](./siteIdentity.json) as the main place to update CRS identity values that appear in more than one surface.

Update these fields there before going live:

- `contact.supportEmail`
- `urls.app`
- `urls.docs`
- `urls.privacy`
- `urls.terms`
- `mobile.appleBundleId` if you ship an iOS app later
- `mobile.androidPackageId` if you ship an Android app later

This file currently feeds:

- frontend footer and public legal pages
- Docusaurus docs config and homepage
- backend OpenAPI and Swagger contact details

For runtime or server-only values, also review:

- [`backend/.env.production.example`](../backend/.env.production.example)
- [`backend/.env.example`](../backend/.env.example)
- [`.env.example`](../.env.example)

Notes:

- The current `your-domain.com` and `docs.your-domain.com` values are placeholders.
- If you deploy the app and docs on Vercel, update the URLs here after those projects are created.
- The mobile bundle/package IDs can stay empty until you actually build mobile apps.
