const { Client } = require('pg');

async function main() {
  const url = 'postgresql://postgres.gjbxkpknswknodxecxvj:pdamsukoharjoDB2024@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    const res = await client.query("SELECT email, password_hash, is_active FROM users WHERE email = 'agendaris@pdam.go.id'");
    console.log("Query result rows:", res.rows.length);
    if (res.rows.length > 0) {
      console.log("User found in database.");
    } else {
      console.log("USER NOT FOUND in database!");
    }
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

main();
