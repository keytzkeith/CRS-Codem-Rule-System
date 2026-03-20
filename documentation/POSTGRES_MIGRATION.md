# PostgreSQL 15 to 16 Migration Guide

This guide walks you through migrating your CRS database from PostgreSQL 15 to PostgreSQL 16.

## 🔧 Prerequisites

- Docker and Docker Compose installed
- CRS project running with PostgreSQL 15
- Sufficient disk space for database backups (typically 2x your current database size)
- **IMPORTANT**: Stop any running trades imports or heavy database operations

## ⚠️ Before You Begin

**CRITICAL**: This migration will temporarily stop your application. Plan for downtime.

1. **Backup External Data**: Consider backing up any important CSV files or configurations
2. **Test Environment**: If possible, test this process on a copy of your data first
3. **Disk Space**: Ensure you have at least 2-3x your database size in free disk space

## 🚀 Migration Process

### Step 1: Run the Migration Script

```bash
# Navigate to your CRS directory
cd /path/to/crs

# Run the migration script
./scripts/migrate-postgres-16.sh
```

The script will:
1. ✅ Create a full SQL backup of your current database
2. ✅ Backup the PostgreSQL data volume
3. ✅ Stop all containers
4. ✅ Remove the old PostgreSQL 15 volume
5. ✅ Update docker-compose.dev.yaml to use PostgreSQL 16
6. ✅ Start PostgreSQL 16
7. ✅ Restore your data from the backup
8. ✅ Verify the migration was successful

### Step 2: Verify Your Data

After migration, verify your data is intact:

```bash
# Check that your trades are still there
docker-compose -f docker-compose.dev.yaml exec postgres psql -U trader -d crs -c "SELECT COUNT(*) FROM trades;"

# Check that users are intact
docker-compose -f docker-compose.dev.yaml exec postgres psql -U trader -d crs -c "SELECT COUNT(*) FROM users;"

# Verify PostgreSQL version
docker-compose -f docker-compose.dev.yaml exec postgres psql -U trader -d crs -c "SELECT version();"
```

### Step 3: Test Your Application

1. Open your CRS application in the browser
2. Test key functionality:
   - ✅ Login works
   - ✅ Trades display correctly
   - ✅ Can add new trades
   - ✅ Analytics work
   - ✅ CSV import works

## 🔄 Rollback Process (If Needed)

If something goes wrong, you can rollback to PostgreSQL 15:

```bash
./scripts/rollback-postgres-15.sh
```

This will restore your original PostgreSQL 15 setup using the backups created during migration.

## 📁 Backup Files

The migration creates two types of backups in `./postgres-migration-backup/`:

1. **SQL Backup**: `crs_backup_YYYYMMDD_HHMMSS.sql`
   - Complete database dump that can be restored to any PostgreSQL version
   
2. **Volume Backup**: `postgres_volume_backup_YYYYMMDD_HHMMSS.tar.gz`
   - Raw PostgreSQL data files for exact restoration

**Keep these backups** until you're confident the migration was successful.

## 🚨 Troubleshooting

### Migration Fails During Backup
```bash
# Check if PostgreSQL 15 is running
docker-compose -f docker-compose.dev.yaml ps

# Check logs
docker-compose -f docker-compose.dev.yaml logs postgres
```

### Migration Fails During Restore
```bash
# Manually restore from SQL backup
docker-compose -f docker-compose.dev.yaml exec -T postgres psql -U trader -d postgres < ./postgres-migration-backup/crs_backup_[timestamp].sql
```

### Application Won't Start
```bash
# Check application logs
docker-compose -f docker-compose.dev.yaml logs app

# Check PostgreSQL logs
docker-compose -f docker-compose.dev.yaml logs postgres
```

### Data Missing After Migration
1. **Don't panic** - your data is safe in the backups
2. Run the rollback script: `./scripts/rollback-postgres-15.sh`
3. Contact support with the error logs

## 📋 Post-Migration Cleanup

After confirming everything works correctly (wait at least a week):

```bash
# Remove backup files (optional)
rm -rf ./postgres-migration-backup/

# Remove migration scripts (optional)
rm scripts/migrate-postgres-16.sh scripts/rollback-postgres-15.sh documentation/POSTGRES_MIGRATION.md
```

## 🔐 Security Benefits

After successful migration to PostgreSQL 16:
- ✅ Latest security patches
- ✅ Improved performance
- ✅ Better query optimization
- ✅ Enhanced monitoring capabilities

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Keep your backup files safe
3. Use the rollback script if needed
4. Document any error messages for support

---

**Migration Script Version**: 1.0  
**Compatible with**: CRS Docker setup  
**PostgreSQL Versions**: 15.x → 16.x