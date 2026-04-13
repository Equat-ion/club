import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, owner, admin, member } from "./permissions";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    sentinelClient()
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
