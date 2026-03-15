export type Role = 'admin' | 'owner' | 'karyawan';

export interface User {
  id: number;
  username: string;
  role: Role;
  nama_lengkap: string;
}
