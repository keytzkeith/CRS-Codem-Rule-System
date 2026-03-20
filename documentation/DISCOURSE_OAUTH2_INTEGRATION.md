# Discourse OAuth2 Integration Guide

This guide walks you through setting up Discourse to use CRS as an OAuth2 identity provider, allowing users to log into your Discourse forum with their CRS credentials.

## Prerequisites

- Running CRS instance (self-hosted or cloud)
- Discourse forum with admin access
- Discourse OAuth2 Basic plugin installed

## Step 1: Create OAuth2 Application in CRS

1. Log into your CRS instance as an administrator
2. Navigate to **Admin > OAuth Applications** (`/admin/oauth`)
3. Click **"New Application"**
4. Fill in the application details:

### Required Fields:

**Application Name:** `Discourse Forum` (or your forum name)

**Redirect URIs:** Add your Discourse callback URL:
```
https://your-discourse-domain.com/auth/oauth2_basic/callback
```

**Note:** Replace `your-discourse-domain.com` with your actual Discourse domain. You can add multiple redirect URIs if you have staging/dev environments.

### Recommended Settings:

- **Description:** "Discourse forum integration for CRS users"
- **Website URL:** `https://your-discourse-domain.com`
- **Allowed Scopes:** Select `openid`, `profile`, and `email`
- **Trusted Application:** ☑ (Optional - skips consent screen for faster login)

5. Click **"Create Application"**

6. **IMPORTANT:** Save the credentials shown:
   - **Client ID** (e.g., `1a2b3c4d5e6f7g8h9i0j`)
   - **Client Secret** (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

   **⚠️ The client secret will not be shown again!** Store it securely.

## Step 2: Install Discourse OAuth2 Basic Plugin

If not already installed:

1. Add to your `app.yml`:
```yaml
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - git clone https://github.com/discourse/discourse-oauth2-basic.git
```

2. Rebuild Discourse:
```bash
cd /var/discourse
./launcher rebuild app
```

## Step 3: Configure Discourse OAuth2 Settings

1. Go to your Discourse admin panel: `https://your-discourse-domain.com/admin`
2. Navigate to **Settings** > **Login** (or search for "oauth2")
3. Configure the following settings:

### OAuth2 Configuration:

```
oauth2_enabled: ☑ true

oauth2_client_id: [Your Client ID from Step 1]

oauth2_client_secret: [Your Client Secret from Step 1]

oauth2_authorize_url: https://your-crs-domain.com/oauth/authorize

oauth2_token_url: https://your-crs-domain.com/oauth/token

oauth2_user_json_url: https://your-crs-domain.com/oauth/userinfo

oauth2_scope: openid profile email

oauth2_button_title: Login with CRS

oauth2_json_user_id_path: sub

oauth2_json_username_path: username

oauth2_json_name_path: name

oauth2_json_email_path: email

oauth2_json_avatar_path: avatar_url

oauth2_email_verified: ☑ true

oauth2_fetch_user_details: ☑ true

oauth2_callback_user_id_path: sub

oauth2_callback_user_info_paths: {"username": "username", "name": "name", "email": "email", "avatar_url": "avatar_url"}
```

**Replace `your-crs-domain.com` with:**
- Self-hosted: Your CRS domain (e.g., `app.codemrs.site`)
- Official instance: `crs.io`

## Step 4: Test the Integration

1. **Log out** of Discourse if you're currently logged in
2. Go to your Discourse homepage
3. Click **"Login"** or **"Sign Up"**
4. You should see a **"Login with CRS"** button
5. Click it and you'll be redirected to CRS
6. If not already logged into CRS, log in
7. If the CRS app is not "Trusted", you'll see a consent screen - click **"Authorize"**
8. You'll be redirected back to Discourse and logged in

## Step 5: Optional Configuration

### Make CRS the Primary Login Method

To make CRS the default and hide Discourse's built-in login:

1. Go to **Settings** > **Login**
2. Set these options:
```
enable_local_logins: ☐ false
enable_local_logins_via_email: ☐ false
```

3. Keep OAuth2 enabled to allow CRS login

### Automatic User Provisioning

Users will be automatically created in Discourse when they first log in via CRS. The following data is synced:

- **Username:** CRS username
- **Email:** CRS email
- **Display Name:** CRS full name
- **Avatar:** CRS avatar (if available)

### Sync User Groups (Optional)

You can map CRS user roles/tiers to Discourse groups using custom claims:

The CRS OAuth2 userinfo endpoint returns:
```json
{
  "sub": "user-uuid",
  "username": "trader123",
  "email": "user@example.com",
  "name": "John Trader",
  "avatar_url": "https://...",
  "role": "user",
  "tier": "pro"
}
```

You can use the `role` and `tier` fields for advanced group mapping with Discourse plugins.

## Troubleshooting

### "Invalid client" error

**Solution:** Verify your Client ID and Client Secret are correct and match what's shown in CRS.

### "Redirect URI mismatch" error

**Solution:** Ensure the redirect URI in CRS exactly matches:
```
https://your-discourse-domain.com/auth/oauth2_basic/callback
```
- Check for trailing slashes
- Verify http vs https
- Check the subdomain

### "Invalid token" error

**Solution:** Check that your CRS instance is accessible from your Discourse server:
```bash
curl https://your-crs-domain.com/oauth/userinfo
```

### Users getting "Email already exists" error

**Solution:** This happens when a user exists in Discourse with the same email. Options:
1. Delete the Discourse account first
2. Have the user log in with their Discourse credentials, then connect CRS in account settings
3. Enable `oauth2_email_verified` to auto-merge accounts

### Login button not appearing

**Solution:**
1. Verify `oauth2_enabled` is checked
2. Clear Discourse cache: `rake assets:precompile`
3. Check browser console for JavaScript errors

### PKCE Support

CRS OAuth2 supports PKCE (Proof Key for Code Exchange) for enhanced security. If your Discourse version supports it:

```
oauth2_pkce_enabled: ☑ true
oauth2_pkce_code_challenge_method: S256
```

## Security Best Practices

1. **Use HTTPS:** Always use HTTPS for both CRS and Discourse
2. **Trusted Applications:** Only mark applications as "Trusted" if you fully control both systems
3. **Rotate Secrets:** Periodically rotate your OAuth2 client secret
4. **Monitor Access:** Regularly review authorized applications in CRS admin panel
5. **Revoke Access:** Users can revoke Discourse access from their CRS account settings

## Advanced: Multiple Discourse Instances

If you have multiple Discourse forums (e.g., staging, production), create separate OAuth2 applications in CRS:

1. Create one app for production with production callback URL
2. Create another app for staging with staging callback URL
3. Use different Client IDs/Secrets for each environment

## User Management

### Revoking Access

**Admin revocation (CRS):**
1. Go to Admin > OAuth Applications
2. Click on Discourse application
3. Click "Delete" to revoke all access tokens

**User revocation:**
1. Users can revoke access from CRS Settings > Connected Applications
2. Find "Discourse Forum" and click "Revoke Access"

### Syncing User Data

User data is synced on each login. To force a sync:
1. Log out of Discourse
2. Log back in via CRS

## API Rate Limits

CRS OAuth2 endpoints have the following rate limits:

- `/oauth/authorize`: 60 requests per minute per user
- `/oauth/token`: 60 requests per minute per client
- `/oauth/userinfo`: 300 requests per minute per token

These limits should be sufficient for normal Discourse usage. If you hit limits, contact your CRS administrator.

## Support

For issues with:
- **CRS OAuth2 configuration:** Check CRS logs at `/backend/src/logs/`
- **Discourse configuration:** Check Discourse logs with `./launcher logs app`
- **Integration issues:** Test each endpoint individually using curl:

```bash
# Test authorization endpoint
curl "https://your-crs-domain.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&scope=openid"

# Test token endpoint (after getting a code)
curl -X POST https://your-crs-domain.com/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"

# Test userinfo endpoint (with access token)
curl https://your-crs-domain.com/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Additional Resources

- [Discourse OAuth2 Basic Plugin Documentation](https://meta.discourse.org/t/discourse-oauth2-basic/33879)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [CRS OAuth2 API Reference](https://your-crs-domain.com/api-docs) (if Swagger is enabled)

---

**Last Updated:** 2025-10-08
