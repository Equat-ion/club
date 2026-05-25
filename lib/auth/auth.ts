import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { sso } from "@better-auth/sso";
import { scim } from "@better-auth/scim";
import { Resend } from "resend";
import { db } from "@/lib/db";
import * as dbSchema from "@/lib/db/schema";
import { ac, owner, admin, member } from "./permissions";
import { orgProfiles, orgPlugins } from "@/lib/db/schema/orgs";
import { getPluginsForPlan } from "@/lib/plugins/registry";
import { createId } from "@paralleldrive/cuid2";
import { dash } from "@better-auth/infra";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...dbSchema,
      sso_provider: dbSchema.ssoProvider,
      scim_provider: dbSchema.scimProvider,
    },
  }),

  emailAndPassword: { enabled: true },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: "Club <noreply@thinkraft.studio>",
        to: user.email,
        subject: "Verify your Club email",
        html: `
          <p>Hi ${user.name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${url}">Verify email</a></p>
          <p>If you didn't create a Club account, you can ignore this email.</p>
        `,
      });
      if (error) {
        console.error("[Resend] Failed to send verification email:", error);
      }
    },
  },

  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },

      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;
        const { error } = await resend.emails.send({
          from: "Club <noreply@thinkraft.studio>",
          to: data.email,
          subject: `You've been invited to join ${data.organization.name} on Club`,
          html: `
            <p>Hi,</p>
            <p><strong>${data.inviter.user.name}</strong> has invited you to join <strong>${data.organization.name}</strong> on Club.</p>
            <p><a href="${inviteLink}">Accept invitation</a></p>
            <p>This invitation will expire in 48 hours. If you weren't expecting this, you can ignore it.</p>
          `,
        });
        if (error) {
          console.error("[Resend] Failed to send invitation email:", error);
        }
      },

      organizationHooks: {
        afterCreateOrganization: async ({ organization: org }) => {
          // Create org_profile row
          await db.insert(orgProfiles).values({
            id: org.id,
            plan: "free",
            issueCounter: 0,
          });

          // Enable default plugins for the org's plan
          const plugins = getPluginsForPlan("free");
          for (const plugin of plugins) {
            if (plugin.defaultEnabled) {
              await db.insert(orgPlugins).values({
                id: createId(),
                orgId: org.id,
                pluginId: plugin.id,
                enabled: true,
                settings: {},
              });
            }
          }
        },
      },
    }),

    sso({
      modelName: "sso_provider",
      organizationProvisioning: {
        disabled: false,
        defaultRole: "member",
      },
      provisionUserOnEveryLogin: true,
    }),
    scim({
      requiredRole: ["owner"],
    }),
    dash(),

    // Must be last — enables cookie setting in server actions
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
