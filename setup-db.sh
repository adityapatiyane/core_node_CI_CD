#!/usr/bin/env bash
# Creates the MySQL database and users table.
# Usage: ./setup-db.sh
# Or:    MYSQL_PWD='your_password' ./setup-db.sh

set -euo pipefail

DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
SCHEMA_FILE="$(cd "$(dirname "$0")" && pwd)/database/schema.sql"

if [[ -z "${MYSQL_PWD:-}" ]]; then
  read -rsp "MySQL password for user '${DB_USER}': " MYSQL_PWD
  echo
  export MYSQL_PWD
fi

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < "$SCHEMA_FILE"
echo "Database and table created successfully."
