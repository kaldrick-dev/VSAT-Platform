import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export const listDocuments = (userId) =>
  prisma.document.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

export const createDocument = (userId, data) => prisma.document.create({ data: { ...data, userId } });

export const deleteDocument = async (userId, id) => {
  const document = await prisma.document.findFirst({ where: { id, userId } });
  if (!document) throw new HttpError(404, "not_found", "Document not found");
  await prisma.document.delete({ where: { id } });
};
