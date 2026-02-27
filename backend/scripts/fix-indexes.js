// One-time script to clean stale indexes from Atlas
// Run: node scripts/fix-indexes.js

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Check if users collection exists
        const collections = await db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
            const indexes = await db.collection('users').indexes();
            console.log('Current indexes on users collection:', indexes);

            // Drop clerkId index if it exists (from old project)
            const staleIndex = indexes.find(i => i.name === 'clerkId_1');
            if (staleIndex) {
                await db.collection('users').dropIndex('clerkId_1');
                console.log('✅ Dropped stale clerkId_1 index');
            } else {
                console.log('No stale clerkId_1 index found');
            }
        } else {
            console.log('No users collection yet — nothing to fix');
        }

        // Also clean up the 'test' database if it has stale data
        const adminDb = db.admin();
        const { databases } = await adminDb.listDatabases();
        const testDb = databases.find(d => d.name === 'test');
        if (testDb) {
            console.log('\nFound "test" database — checking for stale indexes...');
            const testDatabase = mongoose.connection.useDb('test');
            const testCollections = await testDatabase.db.listCollections({ name: 'users' }).toArray();
            if (testCollections.length > 0) {
                const testIndexes = await testDatabase.db.collection('users').indexes();
                const testStale = testIndexes.find(i => i.name === 'clerkId_1');
                if (testStale) {
                    await testDatabase.db.collection('users').dropIndex('clerkId_1');
                    console.log('✅ Dropped stale clerkId_1 index from test.users');
                }
            }
        }

        console.log('\n✅ Done! You can now restart the backend.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

fixIndexes();
