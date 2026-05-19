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
001_create_database.sql
010_create_tables.sql
020_create_indexes.sql
030_seed_bible_books.sql
040_seed_bible_chapters.sql
050_seed_bible_scriptures_niv.sql
060_seed_core_themes.sql
080_create_stored_procedures.sql
090_create_functions.sql
100_verify_install.sql
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

# Expected Database State

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
100_verify_install.sql
```

to verify that the installation completed successfully.