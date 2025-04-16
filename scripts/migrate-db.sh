#!/bin/bash
set -e

# Load environment variables
set -a
source .env
set +a

# Get database credentials from environment variables
POSTGRES_USER=${POSTGRES_USER:-prisma}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}

echo "Setting up database environment for user: $POSTGRES_USER"

# Create temporary SQL file
TEMP_SQL_FILE="temp-setup.sql"
cat > $TEMP_SQL_FILE << EOF
-- Set application settings for migration
SELECT set_config('app.settings.postgres_user', '$POSTGRES_USER', false);
SELECT set_config('app.settings.postgres_password', '$POSTGRES_PASSWORD', false);
EOF

# Extract credentials from connection string
DB_URL=$POSTGRES_URL_NON_POOLING

echo "Setting database application settings..."

# Run the SQL file with PSQL
PGPASSWORD=$POSTGRES_PASSWORD psql "$DB_URL" -f $TEMP_SQL_FILE

# Clean up temporary file
rm -f $TEMP_SQL_FILE

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Migration completed successfully!" 