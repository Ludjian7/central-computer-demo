import bcrypt from 'bcryptjs';

const password = 'password123';
const hashes = [
  '$2b$10$FjwByhoCb0vVuqdJRAufCODZQhoo0PIlDBxVCwgsXTkYYOgNkxBe2', // user 1 (joko)
  '$2b$10$F5GNxJqqdr3Qr6dH2zhNIOxCB/X2tIHisSrGBghaP7oK68fuXwbxe', // user 2-4
  '$2b$10$MlsUzXr5ExFacovPsGIR..14pgohoxJDE.xyy9lXCB3L9WeOUOJHe'  // user 5-7 (demos)
];

hashes.forEach((hash, i) => {
  const result = bcrypt.compareSync(password, hash);
  console.log(`Hash ${i+1} valid for '${password}': ${result}`);
});
