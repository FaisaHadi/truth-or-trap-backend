const bcrypt = require('bcryptjs');

const password = 'Admin@1234';

bcrypt.hash(password, 12).then(hash => {
  console.log('\n✅ New password hash generated:');
  console.log(hash);
  console.log('\n📋 Copy this hash to schema.sql');
  
  // Verify it works
  bcrypt.compare(password, hash).then(match => {
    console.log('\n🔐 Verification:', match ? '✅ MATCH' : '❌ NO MATCH');
  });
});
