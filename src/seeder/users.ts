import { Role, User } from '../models/user';

export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Tushar Agarwal', email: 'tushar@example.com', role: Role.User },
  { id: 'u2', name: 'Nitin Bansal', email: 'nitin@example.com', role: Role.User },
  { id: 'u3', name: 'Admin User', email: 'admin@example.com', role: Role.Admin },
];
