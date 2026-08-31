echo "Building..."
npm run build

echo "Removing old files..."
ssh root@pi "rm -rf /var/www/vue-app"

echo "Sending new files..."
scp -r dist root@pi:/var/www/vue-app