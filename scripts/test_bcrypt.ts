import bcrypt from 'bcryptjs';

const password = 'password123';
const hash = '$2b$10$MlsUzXr5ExFacovPsGIR..14pgohoxJDE.xyy9lXCB3L9WeOUOJHe';

const result = bcrypt.compareSync(password, hash);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log(`Is Valid: ${result}`);

// Try with $2a$ prefix
const hash2a = hash.replace('$2b$', '$2a$');
const result2a = bcrypt.compareSync(password, hash2a);
console.log(`Is Valid ($2a$): ${result2a}`);
