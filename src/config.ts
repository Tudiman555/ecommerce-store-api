import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Infrastructure — differs per environment
  port: parseInt(process.env.PORT ?? '3000', 10),
};
