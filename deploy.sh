#!/bin/bash

echo "🚀 ProNetwork Deployment Script"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Add .gitignore if not exists
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
node_modules/
.env
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vscode/
.idea/
dist/
build/
coverage/
.nyc_output/
EOF
    echo "✅ .gitignore created"
fi

# Add all files
echo ""
echo "📦 Adding files to git..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Ready for deployment - ProNetwork full-stack app"

echo ""
echo "✅ Your code is ready for deployment!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Create a GitHub repository:"
echo "   Go to: https://github.com/new"
echo "   Name: pronetwork"
echo ""
echo "2️⃣  Push your code:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/pronetwork.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Deploy on Render:"
echo "   Go to: https://render.com"
echo "   Sign up with GitHub"
echo "   Click 'New +' → 'Web Service'"
echo "   Connect your repository"
echo "   Add environment variables:"
echo "     - MONGODB_URI"
echo "     - JWT_SECRET"
echo "     - NODE_ENV=production"
echo ""
echo "4️⃣  Update MongoDB Atlas:"
echo "   Go to: https://cloud.mongodb.com"
echo "   Network Access → Add IP: 0.0.0.0/0"
echo ""
echo "🎉 Your app will be live in ~10 minutes!"
echo ""
