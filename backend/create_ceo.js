const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://admin2:finbankadmin123@cluster0.pwh7s.mongodb.net/finbank?retryWrites=true&w=majority';

async function main() {
    const email = 'ceo@finbank.com';
    const password = 'Password123!';

    console.log(`[1] Registering ${email}...`);
    try {
        const res = await fetch('https://finbank-core-banking.onrender.com/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: 'customer' })
        });
        const data = await res.json();
        console.log('Register response:', res.status, data);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }

    console.log(`[2] Connecting to MongoDB...`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('finbank');

        console.log(`[3] Updating user role to 'ceo'...`);
        const updateResult = await db.collection('users').updateOne(
            { email: email },
            { $set: { role: 'ceo' } }
        );
        console.log('Updated user role! Modified:', updateResult.modifiedCount);

    } finally {
        await client.close();
    }
}

main().catch(console.error);
