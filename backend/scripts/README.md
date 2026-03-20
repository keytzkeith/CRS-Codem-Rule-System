# Admin Scripts

## First User Auto-Admin

The first user to register on a fresh CRS installation is automatically granted admin privileges. This ensures there's always an admin account available to manage the system.

## Making Additional Admins

To promote an existing user to admin only, use the `make-admin.js` script:

```bash
cd backend
node scripts/make-admin.js user@example.com
```

This will:
- Update the user's role to 'admin' in the database
- Show confirmation with user details
- Exit with an error if the user is not found

## Creating Or Updating An Admin User

To create a new admin user or reset an existing admin user's password in one step, use:

```bash
cd backend
node scripts/set-admin-user.js user@example.com StrongPassword123 username "Full Name"
```

Example:

```bash
cd backend
node scripts/set-admin-user.js codemtrader@gmail.com 12345678 codemtrader "Codem Trader"
```

This command will:
- create the user if it does not exist
- or update the existing user
- set the password with a bcrypt hash
- force `role = admin`
- force `tier = pro`
- mark the account active, verified, and admin-approved

If you prefer npm scripts:

```bash
cd backend
npm run admin:set -- codemtrader@gmail.com 12345678 codemtrader "Codem Trader"
```

## Repairing CRS Trade Fields

To backfill CRS-specific derived fields on existing trades, use:

```bash
cd backend
npm run trades:repair
```

Dry run first if you want to inspect what will change:

```bash
cd backend
npm run trades:repair -- --dry-run
```

If you want to repair using a different session timezone:

```bash
cd backend
npm run trades:repair -- --dry-run --timezone Africa/Nairobi
```

This script repairs derived CRS fields such as:
- `setup_stack`
- `journal_payload`
- `checklist_payload`
- `contract_multiplier`
- `pip_size`
- `swap`
- `actual_risk_amount`
- `risk_percent_of_account`
- `pips`
- session labels stored in `strategy` when the trade is using CRS session semantics

## Admin Permissions

Admin users have the following additional permissions:

### Trade Management
- Can delete any public trade (not just their own)
- Regular users can only delete their own trades

### Future Permissions
The admin role system is extensible and can be expanded to include:
- User management
- Site-wide settings
- Moderation capabilities
- Analytics access

## Database Schema

The `users` table includes a `role` column:
- `'user'` (default) - Regular user permissions
- `'admin'` - Full admin permissions

## Security Notes

- Admin permissions are checked server-side in middleware
- JWT tokens include the user's role for frontend permission checks
- All admin actions are logged and can be audited
- The role field has a database constraint to only allow 'user' or 'admin' values
