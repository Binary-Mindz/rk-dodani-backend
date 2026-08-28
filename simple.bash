#!/usr/bin/env bash

set -e

COMMIT_ID="5698fee27df0af3796ac0e652a81ca707f2cbab2"

# Read metadata from the existing commit
AUTHOR_NAME=$(git show -s --format='%an' "$COMMIT_ID")
AUTHOR_EMAIL=$(git show -s --format='%ae' "$COMMIT_ID")
AUTHOR_DATE=$(git show -s --format='%aI' "$COMMIT_ID")

COMMITTER_NAME=$(git show -s --format='%cn' "$COMMIT_ID")
COMMITTER_EMAIL=$(git show -s --format='%ce' "$COMMIT_ID")
COMMITTER_DATE=$(git show -s --format='%cI' "$COMMIT_ID")

COMMIT_MESSAGE=$(git show -s --format='%B' "$COMMIT_ID")

echo "Author: $AUTHOR_NAME <$AUTHOR_EMAIL>"
echo "Author date: $AUTHOR_DATE"
echo "Committer: $COMMITTER_NAME <$COMMITTER_EMAIL>"
echo "Committer date: $COMMITTER_DATE"

# Stage your new/modified files
git add .

# Create a new commit using the extracted metadata
GIT_AUTHOR_NAME="$AUTHOR_NAME" \
GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" \
GIT_AUTHOR_DATE="$AUTHOR_DATE" \
GIT_COMMITTER_NAME="$COMMITTER_NAME" \
GIT_COMMITTER_EMAIL="$COMMITTER_EMAIL" \
GIT_COMMITTER_DATE="$COMMITTER_DATE" \
git commit -m "$COMMIT_MESSAGE"
