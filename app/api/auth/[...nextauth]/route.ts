import NextAuth from "next-auth";
import { authOptions } from "./options";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

const customHandler = async (req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) => {
  const params = await context.params;
  return handler(req, { params });
};

export { customHandler as GET, customHandler as POST };
