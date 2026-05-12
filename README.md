# Power Scripture

Power Scripture is a full-stack Bible study and organization system designed to help users search, analyze, and categorize scripture into meaningful thematic structures.

Unlike traditional Bible apps that focus primarily on reading or simple search, Power Scripture is built to support **deep study, structured thought, and reusable organization**.

---

## What It Does

Power Scripture allows users to:

- Search scripture text using:
  - plain text
  - wildcards
  - regular expressions
- Select verses and group them into **citations**
- Create and organize citations within a **hierarchical theme tree**
- Classify a single citation under **multiple themes**
- Copy or move citations between themes
- Edit and refine citations over time

---

## Key Features

### Scripture Search

- Fast, keystroke-responsive search
- Supports:
  - plain text
  - wildcards
  - regular expressions
- Highlights matching text within verses
- Allows selection and deselection of verses before creating a citation

---

### Citation Creation

Citations can be created and refined in multiple ways:

- From the search interface by selecting verses
- From the import console using keyboard input
- Through a guided editor that allows selection of:
  - book
  - chapter
  - starting verse
  - ending verse (range)
  - and the ability to add multiple ranges to a single citation

This supports both:

- interactive exploration
- structured data entry

---

### Citation Management

- Citations can be edited after creation
- Citations are always created under a parent theme
- Citations can be copied or moved to other themes
- A citation may belong to multiple themes
- Citations internally consist of individual verses, which are grouped and displayed as ranges for readability

---

### Theme Organization

- Themes are hierarchical (tree structure)
- Users can create subthemes under any theme
- Top-level themes are immutable system-defined categories
- Subthemes and citations can be reordered using drag-and-drop

---

### Markups

Markups allow users to clarify or adjust the presentation of scripture within a citation without altering the original text.

- Applied to individual verses within a citation
- Can be used to:
  - replace words for clarity (e.g., `he` → `[Jesus]`)
  - suppress words or phrases, which are rendered as an ellipsis (`...`)
  - highlight important portions of text
  - annotate with additional context
  - insert line breaks for readability
- Do not modify or overwrite the underlying scripture

---

### Import Console

- Keyboard-driven interface for entering scripture references
- Designed for fast entry of large or structured inputs
- Supports:
  - creation of citations
  - creation of themes
  - navigation within the theme structure
- Provides the ability to review, undo, and save staged changes

The import console is focused on efficient data entry and organization.  
Detailed editing and refinement of citations is performed in the editor.

---

## Core Concepts

### Themes

Themes represent categories of thought.

- Organized as a hierarchical tree
- Top-level themes are **immutable system categories**
- Users can create unlimited subthemes
- Themes organize meaning, not just content

---

### Citations

A citation represents a **collection of scripture verses organized around a single idea or concept**.

- Created from selected verses, guided entry, import input, or as an empty draft in the workbench
- Always belongs to a **parent theme**
- Can be copied or moved to other themes
- Designed to be refined over time
- Internally stores individual verses as children of the citation

Citations typically contain one or more verses.  
When created as a draft in the workbench, a citation may initially have no verses and can be populated later using the citation editor.

In the user interface, verses are displayed as **grouped ranges** for readability.

Power Scripture does not alter the original scripture text.  
Instead, users may apply **markups** to individual verses within a citation to clarify meaning (for example, replacing a pronoun with a bracketed reference such as `[Jesus]`).

These markups are applied at the verse level within the citation and do not modify the underlying scripture data.

---

### Theme–Citation Relationship

Power Scripture enforces structured relationships:

- A citation is **always created under a theme**
- A citation cannot exist without at least one theme
- Citations may be linked to multiple themes
- Themes without content are minimized to avoid clutter

This ensures there are **no orphan citations or orphan themes**.

---

### Multi-Theme Classification

A single citation can belong to multiple themes.

This reflects how scripture often contains:

- historical context  
- theological meaning  
- practical application  

Instead of forcing a single category, Power Scripture allows a citation to be viewed from multiple perspectives.

---

## Design Principles

### Structured but Flexible

- Fixed top-level themes provide consistency
- User-defined subthemes provide flexibility

---

### No Orphan Data

- Every citation belongs to a theme
- Theme hierarchy is maintained intentionally
- Data relationships are enforced at the application level

---

### Precision Search + Intentional Organization

- Search is exact and deterministic
- Organization is user-driven and deliberate

---

### Separation of Concerns

Power Scripture separates:

- **Text** (scripture search)
- **Meaning** (themes)
- **Application** (how users organize citations)

---

## Project Structure

- **frontend/** — Angular 20 application (UI and interaction)  
- **backend/** — Node.js REST API  
- **database/** — MySQL schema, stored procedures, and data dump  

---

## Architecture Overview

Frontend (Angular)  
↓ HTTP  
Backend (Node.js API)  
↓ SQL / Stored Procedures  
MySQL Database

---

## Current Status

This project is actively under development.

- Core functionality is implemented and working
- Help system and documentation are being expanded
- Database packaging and installation will be simplified in a future version

---

## Tech Stack

- Angular 20
- Node.js (REST API)
- MySQL 8 (stored procedures)
- jsTree
- Bootstrap

---

## Notes

This repository currently reflects an active development version and is not yet packaged for easy installation.

---

## Copyright and License

Copyright © 2026 George R. Griffin. All rights reserved.

Power Scripture is provided free of charge for personal, educational,
ministry, and non-commercial use.

You may:
- download and use the software
- study the source code
- modify the software for personal use
- share unmodified copies of the software for non-commercial purposes

You may not:
- sell Power Scripture
- bundle Power Scripture into a commercial product
- host Power Scripture as a paid service
- redistribute modified versions for commercial purposes
- use Power Scripture commercially without written permission

Commercial use, resale, hosting, sublicensing, or monetization of
Power Scripture requires a separate commercial agreement with the author.

If you are interested in commercial licensing or partnership opportunities,
please contact the author.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND.

## Commercial Licensing

For commercial licensing or partnership inquiries, contact:

George R. Griffin  
geogriffix@gmail.com