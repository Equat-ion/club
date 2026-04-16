import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ssoClient } from "@better-auth/sso/client";
import { ac, owner, admin, member } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    ssoClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
  organization: organizationApi,
} = authClient;
