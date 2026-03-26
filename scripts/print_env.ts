import dotenv from 'dotenv';
dotenv.config();

function mask(str: string | undefined) {
  if (!str) return 'UNDEFINED';
  return str.substring(0, 15) + '...' + str.substring(str.length - 10);
}

console.log('PRISMA_DATABASE_URL:', mask(process.env.PRISMA_DATABASE_URL));
console.log('POSTGRES_URL:', mask(process.env.POSTGRES_URL));
console.log('POSTGRES_PRISMA_URL:', mask(process.env.POSTGRES_PRISMA_URL));
console.log('POSTGRES_URL_NON_POOLING:', mask(process.env.POSTGRES_URL_NON_POOLING));
