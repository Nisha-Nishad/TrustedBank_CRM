const { execSync } = require('child_process');

// Ensure DATABASE_URL has a working fallback if not set in cloud dashboard
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

console.log('==> Running Prisma Generate...');
execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

console.log('==> Pushing Database Schema...');
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });

console.log('==> Seeding Database (20 Customers, 10 RMs, Deals & Tasks)...');
execSync('node prisma/seed.js', { stdio: 'inherit', env: process.env });

console.log('==> Build and database setup completed successfully!');
