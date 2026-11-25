import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export const MAX_BYTES = 4 * 1024 * 1024;

const SIGNATURES = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff]
};

// The file bytes are never returned by a list: they are only sent by the download route.
const listFields = { id: true, name: true, kind: true, url: true, fileName: true, mimeType: true, size: true, createdAt: true };

export const listDocuments = (userId) =>
  prisma.document.findMany({ where: { userId }, select: listFields, orderBy: { createdAt: "desc" } });

export const createDocument = async (userId, { kind, fileName, name }, mimeType, file) => {
  if (!Buffer.isBuffer(file) || file.length === 0) throw new HttpError(400, "file_required", "Choose a PDF, PNG or JPG file to upload");
  const signature = SIGNATURES[mimeType];
  if (!signature || !signature.every((byte, i) => file[i] === byte)) {
    throw new HttpError(400, "invalid_file", "The file must be a real PDF, PNG or JPG");
  }
  return prisma.document.create({
    data: { userId, kind, name: name ?? fileName, fileName, mimeType, size: file.length, data: file },
    select: listFields
  });
};

export const deleteDocument = async (userId, id) => {
  const document = await prisma.document.findFirst({ where: { id, userId } });
  if (!document) throw new HttpError(404, "not_found", "Document not found");
  await prisma.document.delete({ where: { id } });
};

export const getFile = async (user, id) => {
  const document = await prisma.document.findUnique({ where: { id } });
  const allowed = document && (user.role === "admin" || document.userId === user.sub);
  if (!allowed || !document.data) throw new HttpError(404, "not_found", "File not found");
  return document;
};
