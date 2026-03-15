import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../../database.sqlite");

export const db = new Database(dbPath, { verbose: console.log });
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
