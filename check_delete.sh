#!/bin/bash

BLOG_SLUG="this-yCKO8Q"
USER_ID="$(curl -s "https://nkpjnbiyewdjxzhxjdvu.supabase.co/rest/v1/users?select=id&limit=1" \
  -H "authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGpuYml5ZXdkanh6aHhqZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDU4MDIsImV4cCI6MjA5MDc4MTgwMn0.JEhoc7cNLlIOZyvFnR5L7PI21bb2UUa1AZ_zDj0qXMo" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGpuYml5ZXdkanh6aHhqZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDU4MDIsImV4cCI6MjA5MDc4MTgwMn0.JEhoc7cNLlIOZyvFnR5L7PI21bb2UUa1AZ_zDj0qXMo" | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')"

echo "Testing delete with slug: $BLOG_SLUG"
echo "User ID: $USER_ID"

curl -X DELETE "https://nkpjnbiyewdjxzhxjdvu.supabase.co/rest/v1/blogs?slug=eq.$BLOG_SLUG" \
  -H "authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGpuYml5ZXdkanh6aHhqZHZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwNTgwMiwiZXhwIjoyMDkwNzgxODAyfQ.N5uCS8vP0Dz2j-o6MlQIrdGV3ZMRJdYlFWbPqaEUNzc" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGpuYml5ZXdkanh6aHhqZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDU4MDIsImV4cCI6MjA5MDc4MTgwMn0.JEhoc7cNLlIOZyvFnR5L7PI21bb2UUa1AZ_zDj0qXMo" \
  -H "Content-Type: application/json"

echo ""
echo "Checking if deleted..."
curl -s "https://nkpjnbiyewdjxzhxjdvu.supabase.co/rest/v1/blogs?select=slug&slug=eq.$BLOG_SLUG" \
  -H "authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGpuYml5ZXdkanh6aHhqZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDU4MDIsImV4cCI6MjA5MDc4MTgwMn0.JEhoc7cNLlIOZyvFnR5L7PI21bb2UUa1AZ_zDj0qXMo" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGpuYml5ZXdkanh6aHhqZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDU4MDIsImV4cCI6MjA5MDc4MTgwMn0.JEhoc7cNLlIOZyvFnR5L7PI21bb2UUa1AZ_zDj0qXMo"
