export enum Role {
  User = 'user',
  Admin = 'admin',
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
