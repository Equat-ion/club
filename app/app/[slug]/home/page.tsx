import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { issues, issueActivity } from "@/lib/db/schema/tasks";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and, desc, sql } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Users,
  ArrowRight,
} from "lucide-react";

async function getDashboardData(orgId: string) {
  const [
    allIssues,
    members,
    profile,
    recentActivity,
  ] = await Promise.all([
    db
      .select({ status: issues.status })
      .from(issues)
      .where(eq(issues.orgId, orgId)),
    db.query.member.findMany({
      where: eq(member.organizationId, orgId),
    }),
    db.query.orgProfiles.findFirst({
      where: eq(orgProfiles.id, orgId),
    }),
    db
      .select({
        id: issueActivity.id,
        issueId: issueActivity.issueId,
        type: issueActivity.type,
        fromValue: issueActivity.fromValue,
        toValue: issueActivity.toValue,
        createdAt: issueActivity.createdAt,
        actorId: issueActivity.actorId,
        actorName: user.name,
        actorImage: user.image,
        issueTitle: issues.title,
        issueIdentifier: issues.identifier,
      })
      .from(issueActivity)
      .innerJoin(user, eq(issueActivity.actorId, user.id))
      .innerJoin(issues, eq(issueActivity.issueId, issues.id))
      .where(eq(issues.orgId, orgId))
      .orderBy(desc(issueActivity.createdAt))
      .limit(10),
  ]);

  // Compute task stats
  const taskStats = {
    total: allIssues.length,
    backlog: allIssues.filter((i) => i.status === "backlog").length,
    todo: allIssues.filter((i) => i.status === "todo").length,
    inProgress: allIssues.filter((i) => i.status === "in_progress").length,
    done: allIssues.filter((i) => i.status === "done").length,
    cancelled: allIssues.filter((i) => i.status === "cancelled").length,
  };

  return {
    taskStats,
    memberCount: members.length,
    plan: profile?.plan ?? "free",
    recentActivity,
  };
}

function getActivityDescription(
  type: string,
  fromValue: string | null,
  toValue: string | null
): string {
  switch (type) {
    case "created":
      return "created this issue";
    case "status_change":
      return `changed status from ${formatValue(fromValue)} to ${formatValue(toValue)}`;
    case "priority_change":
      return `changed priority from ${formatValue(fromValue)} to ${formatValue(toValue)}`;
    case "assignment":
      if (!fromValue && toValue) return "assigned this issue";
      if (fromValue && !toValue) return "unassigned this issue";
      return "changed assignment";
    case "comment":
      return "commented";
    default:
      return "updated this issue";
  }
}

function formatValue(value: string | null): string {
  if (!value) return "none";
  return value.replace(/_/g, " ");
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id),
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  const data = await getDashboardData(org.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Overview of {org.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.taskStats.backlog} in backlog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.todo}</div>
            <p className="text-xs text-muted-foreground">
              tasks ready to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              tasks being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.done}</div>
            <p className="text-xs text-muted-foreground">
              tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Members</CardTitle>
              <CardDescription>
                {data.memberCount} {data.memberCount === 1 ? "member" : "members"}
                <Badge variant="secondary" className="ml-2 text-[10px] capitalize">
                  {data.plan}
                </Badge>
              </CardDescription>
            </div>
            <Link
              href={`/app/${slug}/members`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
        </Card>

        {/* Quick Links Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href={`/app/${slug}/tasks`}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors"
            >
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span>View all tasks</span>
              <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </Link>
            <Link
              href={`/app/${slug}/members`}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Manage members</span>
              <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest changes across your tasks</CardDescription>
          </div>
          <Link
            href={`/app/${slug}/tasks`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All tasks
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No activity yet. Create your first task to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7 mt-0.5">
                    <AvatarImage src={activity.actorImage ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {activity.actorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.actorName}</span>{" "}
                      {getActivityDescription(
                        activity.type,
                        activity.fromValue,
                        activity.toValue
                      )}
                    </p>
                    <Link
                      href={`/app/${slug}/tasks/${activity.issueId}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {activity.issueIdentifier}: {activity.issueTitle}
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
