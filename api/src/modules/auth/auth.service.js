import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

const publicUser = { id: true, fullName: true, email: true, role: true, trade: true, phone: true, organisation: true };

const makeToken = (user) =>
  jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN });

// Admins are never created here: they come from the seed only.
export const register = async ({ fullName, email, password, accountType, organisation }) => {
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) throw new HttpError(409, "email_taken", "That email is already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash, role: accountType, organisation: accountType === "association" ? organisation : null },
    select: publicUser
  });
  return { token: makeToken(user), user };
};

export const login = async ({ email, password }) => {
  const found = await prisma.user.findUnique({ where: { email } });
  const ok = found && (await bcrypt.compare(password, found.passwordHash));
  if (!ok) throw new HttpError(401, "invalid_credentials", "Wrong email or password");

  const user = await prisma.user.findUnique({ where: { id: found.id }, select: publicUser });
  return { token: makeToken(user), user };
};

export const getMe = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUser });
  if (!user) throw new HttpError(401, "unauthenticated", "Account no longer exists");
  return user;
};
