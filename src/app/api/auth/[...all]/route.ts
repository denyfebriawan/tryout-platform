// Mounts Better Auth's HTTP endpoints at /api/auth/* (session, sign-in, sign-out, ...).
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
