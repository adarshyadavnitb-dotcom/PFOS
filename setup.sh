#!/bin/bash

# PFOS v4 — Project Folder Setup Script
# Run this once to create the project structure.
# Usage: chmod +x setup.sh && ./setup.sh

echo "Setting up PFOS v4 folder structure..."

# docs/ — Architecture docs, prompt templates, and notes
mkdir -p docs

# n8n/ — Exported workflow JSON files from n8n
#   workflows/ — One JSON file per workflow (W1, W2, etc.)
#   credentials/ — Credential config notes (never commit real secrets!)
mkdir -p n8n/workflows
mkdir -p n8n/credentials

# sheets/ — Google Sheets templates and schema references
#   templates/ — CSV templates showing the column headers for each tab
mkdir -p sheets/templates

# telegram/ — Telegram bot setup notes and config
mkdir -p telegram

# scripts/ — Any helper scripts (data migration, testing, etc.)
mkdir -p scripts

# tests/ — Test data for validating your workflows
#   sample-messages/ — Example Telegram messages to test with
mkdir -p tests/sample-messages

# logs/ — Error logs or debug output (gitignored)
mkdir -p logs

echo ""
echo "Folder structure created:"
echo ""
find . -type d -not -path './.git*' | sort | head -20
echo ""
echo "Done! Next steps:"
echo "  1. Read the README.md for an overview"
echo "  2. Read docs/PFOS_v4_Architecture.md for the full plan"
echo "  3. Start with Phase 1 — see README.md for instructions"
