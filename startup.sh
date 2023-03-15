#!/usr/bin/env sh

# List all files
ls -al

# Replace place holder with environment variable values
find . -name 'main*.js' -exec sed -i -e 's,AUTH_API_BASE_DUMMY_URL,'"$AUTH_API_BASE_URL"',g' {} \;
find . -name 'main*.js' -exec sed -i -e 's,SERVICE_API_BASE_DUMMY_URL,'"$SERVICE_API_BASE_URL"',g' {} \;
find . -name 'main*.js' -exec sed -i -e 's,RECAPTCHA_SITE_DUMMY_KEY,'"$RECAPTCHA_SITE_KEY"',g' {} \;

# Start node server
echo 'Starging the server...'
node server.js