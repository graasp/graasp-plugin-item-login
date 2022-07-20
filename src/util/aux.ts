import bcrypt from 'bcrypt';

import { ItemLoginSchema } from '../interfaces/item-login';

const randomHexOf4 = () => ((Math.random() * (1 << 16)) | 0).toString(16).padStart(4, '0');
const saltRounds = 10;

export const encryptPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, saltRounds);

export const validatePassword = async (
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(plainTextPassword, passwordHash);

export const loginSchemaRequiresPassword = (loginSchema: ItemLoginSchema): boolean =>
  loginSchema === ItemLoginSchema.UsernameAndPassword ||
  loginSchema === ItemLoginSchema.AnonymousAndPassword;

export const generateRandomEmail = (): string => `${randomHexOf4()}-${Date.now()}@graasp.org`;
