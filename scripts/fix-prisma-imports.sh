#!/bin/bash

# Files to update
files=(
  "app/api/rfp-qa/next/[id]/route.ts"
  "app/api/rfp-qa/route.ts"
  "app/api/rfp-qa/[rfp_id]/route.ts"
  "app/api/rfp-qa/prev/[id]/route.ts"
  "app/api/faq/route.ts"
  "app/api/faq/related/[rfp_id]/route.ts"
  "app/api/faq/next/[id]/route.ts"
  "app/api/faq/prev/[id]/route.ts"
)

# Update each file
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    sed -i '' 's|import { prisma } from ".*lib/prisma"|import { prisma } from "@/app/lib/prisma"|' "$file"
  fi
done
