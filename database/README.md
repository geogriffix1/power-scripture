# Power Scripture Database

Power Scripture is a scripture organization and study system built around Themes, Citations, Scripture References, and Verse Markups.

This database package contains the MySQL schema, canonical Bible data, core theme hierarchy, stored procedures, functions, and setup scripts required to initialize a Power Scripture database.

---

# Requirements

## Software

Install the following software before loading the database:

- MySQL Community Server 8.0.x
- MySQL Workbench

## Recommended Version

```text
MySQL Server 8.0.37 or later
```

---

# Download Links

## MySQL Community Server

- https://dev.mysql.com/downloads/mysql/

## MySQL Workbench

- https://dev.mysql.com/downloads/workbench/

---

# Initial MySQL Setup

## Install MySQL Server

During installation:

- Select a local development configuration
- Create a root password
- Leave the MySQL service enabled

## Install MySQL Workbench

After installation:

1. Open MySQL Workbench
2. Create a local connection
3. Connect using the root password created during setup

---

# Database Structure

The database is divided into two primary categories of data.

## Canonical Bible Data

These tables contain immutable reference data:

```text
bible_books
bible_chapters
bible_scriptures_niv
```

Notes:

- Scripture IDs begin at 10001
- Scripture records are treated as immutable canonical data

## Application Data

These tables contain Power Scripture application content:

```text
bible_themes
bible_citations
bible_citation_verses
bible_citation_markups
bible_theme_to_citations
```

---

# Database Setup Scripts

Run the setup scripts in the following order.

## Setup Script Order

```text
010_create_database.sql
020_create_tables.sql
030_create_indexes.sql
040_table_insert_seed_scripts.zip
  041_seed_bible_books.sql
  042_seed_bible_chapters.sql
  043_seed_bible_scriptures_niv.sql
  044_seed_core_themes.sql
050_create_stored_procedures.sql
060_create_database_functions.sql
070_verify_install.sql
```

---

# Running Setup Scripts

## Using MySQL Workbench

For each setup script:

1. Open the SQL file
2. Verify the correct database connection is selected
3. Execute the script

Scripts should be executed in numeric order.

---

# Application Database User

The Power Scripture backend application should NOT connect to MySQL using the `root` account.

The baseline setup creates a dedicated application user:

```text
power_scripture_app
```

This account is intended to be used exclusively by the Power Scripture backend API.

## Default Password

The baseline install scripts include a placeholder password.

You SHOULD change this password immediately before using the database in any real environment.

In **010_create_database.sql** file:

```sql
CREATE USER 'power_scripture_app'@'localhost'
IDENTIFIED WITH mysql_native_password
BY 'change_this_password';

```

## Recommended Password Guidelines

Use a password that is:

- long
- unique
- difficult to guess
- not reused elsewhere

Recommended characteristics:

- 16+ characters
- mixed uppercase/lowercase letters
- numbers
- symbols

Example style:

```text
Falcon#River82Iron!Window
```

Do NOT commit real passwords into source control repositories.

## Database Permissions

The application user is intentionally restricted to Power Scripture databases only.

The account includes permissions required by the application, including:

- SELECT
- INSERT
- UPDATE
- DELETE
- EXECUTE
- CREATE TEMPORARY TABLES

The application uses stored procedures and temporary tables internally.

## Backend Configuration

Update the backend database configuration or `.env` file to use:

```text
DB_USER=power_scripture_app
DB_PASSWORD=your_secure_password
```

Do not use the MySQL `root` account for normal application execution.

---

# Environment Configuration

The Power Scripture backend uses a `.env` file for database configuration.

The `.env` file should exist in the backend project root directory.

Example:

```text
backend/.env
```

## Example .env File

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=power_scripture_dev
DB_USER=power_scripture_app
DB_PASSWORD="change_this_password"
```

Notes:

- Quotes around the password are recommended if the password contains special characters such as `#`
- The backend expects the database user to use the `mysql_native_password` authentication plugin
- `127.0.0.1` is recommended instead of `localhost` for MySQL client compatibility

## Important Security Notes

The real `.env` file SHOULD NOT be committed to source control.

Add the following to `.gitignore`:

```text
.env
.env.*
!.env.example
```

## Example Environment Template

A safe template file may be committed as:

```text
.env.example
```

Example:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=power_scripture_dev
DB_USER=power_scripture_app
DB_PASSWORD="change_this_password"
```

## Node Dependency

The backend requires the `dotenv` package.

Install with:

```bash
npm install dotenv
```# Expected Database State

After setup completes successfully, the database should contain:

- Bible books
- Bible chapters
- NIV scripture records
- Top-level themes
- Second-level themes
- Stored procedures
- Database functions
- Database indexes

The remaining application tables should be empty.

---

# Recommended Database Usage

## Baseline Database

```text
power_scripture_baseline
```

Contains:

- canonical Bible data
- initial theme hierarchy
- no user-generated citations or markups

## Development Database

```text
power_scripture_dev
```

Primary working database used during application development.

## Test Database

```text
power_scripture_test
```

Disposable database used for testing imports, exports, and destructive operations.

---

# Import / Export Design

Power Scripture imports and exports are intended to move content between databases.

The baseline database acts as a reusable clean starting point for:

- development
- testing
- demonstrations
- production initialization

---

# Notes

## Scripture Records

Scripture records are intended to be read-only canonical data.

## ID Ranges

```text
1+      = application/domain entities
10001+  = scripture records
```

## Foreign Keys

The database currently prioritizes portability and import flexibility over strict foreign key enforcement.

Indexes and uniqueness constraints are used where appropriate.

---

# Verification

Run:

```text
070_verify_install.sql
```

to verify that the installation completed successfully.