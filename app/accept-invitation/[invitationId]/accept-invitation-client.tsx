"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";

type Props = {
  invitationId: string;
  orgName: string;
  orgSlug: string;
  email: string;
  isSignedIn: boolean;
  isExpired: boolean;
  isAlreadyAccepted: boolean;
  status: string;
};

export function AcceptInvitationClient({
  invitationId,
  orgName,
  orgSlug,
  email,
  isSignedIn,
  isExpired,
  isAlreadyAccepted,
  status,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isExpired) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>
            This invitation to join <strong>{orgName}</strong> has expired. Please
            ask the organisation admin to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/app">Go to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isAlreadyAccepted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "accepted"
              ? "Already Accepted"
              : "Invitation Unavailable"}
          </CardTitle>
          <CardDescription>
            {status === "accepted"
              ? `This invitation to join ${orgName} has already been accepted.`
              : `This invitation to join ${orgName} is no longer available.`}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href={`/app/${orgSlug}/home`}>Go to {orgName}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join {orgName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{orgName}</strong>. Sign in
            or create an account to accept this invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link
              href={`/sign-in?redirect=/accept-invitation/${invitationId}`}
            >
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link
              href={`/sign-up?redirect=/accept-invitation/${invitationId}`}
            >
              Create account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  async function handleAccept() {
    setLoading(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message || "Failed to accept invitation");
        setLoading(false);
        return;
      }

      toast.success(`Welcome to ${orgName}!`);
      router.push(`/app/${orgSlug}/home`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Join {orgName}</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join <strong>{orgName}</strong> as a
          member.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        Invitation sent to <strong>{email}</strong>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={handleAccept}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Accepting..." : "Accept Invitation"}
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/app">Decline</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
