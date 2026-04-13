import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { teamMembers } from "@/lib/db/schema/teams";
import { issues as tasks, issueActivity as taskActivity } from "@/lib/db/schema/tasks";
import { orgProfiles, orgPlugins } from "@/lib/db/schema/orgs";
import { eq, and, desc, sql, or, inArray } from "drizzle-orm";
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
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Users,
  ArrowRight,
} from "lucide-react";
import { DashboardWidget } from "@/components/plugins/tasks/dashboard-widget";
import { getTasks } from "@/actions/tasks";

async function getDashboardData(orgId: string, memberId: string) {
  // Get member's teams
  const memberTeams = await db.query.teamMembers.findMany({
    where: eq(teamMembers.memberId, memberId),
  });
  const teamIds = memberTeams.map((mt) => mt.teamId);

  const [
    allTasks,
    membersData,
    profile,
    recentActivity,
    myTasks,
  ] = await Promise.all([
    db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.orgId, orgId)),
    db
      .select({
        id: member.id,
        name: user.name,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, orgId)),
    db.query.orgProfiles.findFirst({
      where: eq(orgProfiles.id, orgId),
    }),
    db
      .select({
        id: taskActivity.id,
        issueId: taskActivity.issueId,
        type: taskActivity.type,
        fromValue: taskActivity.fromValue,
        toValue: taskActivity.toValue,
        createdAt: taskActivity.createdAt,
        actorId: taskActivity.actorId,
        actorName: user.name,
        actorImage: user.image,
        issueTitle: tasks.title,
        issueIdentifier: tasks.identifier,
      })
      .from(taskActivity)
      .innerJoin(user, eq(taskActivity.actorId, user.id))
      .innerJoin(tasks, eq(taskActivity.issueId, tasks.id))
      .where(eq(tasks.orgId, orgId))
      .orderBy(desc(taskActivity.createdAt))
      .limit(10),
    getTasks(orgId, { assigneeId: memberId }).then(res => res.slice(0, 5)), // Simplified "My Tasks" for widget
  ]);

  // Compute task stats
  const taskStats = {
    total: allTasks.length,
    backlog: allTasks.filter((i) => i.status === "backlog").length,
    todo: allTasks.filter((i) => i.status === "todo").length,
    inProgress: allTasks.filter((i) => i.status === "in_progress").length,
    done: allTasks.filter((i) => i.status === "done").length,
    cancelled: allTasks.filter((i) => i.status === "cancelled").length,
  };

  return {
    taskStats,
    memberCount: membersData.length,
    members: membersData,
    plan: profile?.plan ?? "free",
    recentActivity,
    myTasks,
  };
}

function getActivityDescription(
  type: string,
  fromValue: string | null,
  toValue: string | null
): string {
  switch (type) {
    case "created":
      return "created this task";
    case "status_change":
      return `changed status from ${formatValue(fromValue)} to ${formatValue(toValue)}`;
    case "priority_change":
      return `changed priority from ${formatValue(fromValue)} to ${formatValue(toValue)}`;
    case "assignment":
      return "changed assignment";
    case "comment":
      return "commented";
    default:
      return "updated this task";
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

  const installedPlugins = await db.query.orgPlugins.findMany({
    where: eq(orgPlugins.orgId, org.id),
  });
  const tasksEnabled = installedPlugins.some(p => p.pluginId === "tasks" && p.enabled);

  const data = await getDashboardData(org.id, membership.id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">
            Overview of {org.name}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.total}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To Do</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.todo}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500/50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.done}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <Card className="shadow-none border-muted/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Latest changes across your tasks</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
                <Link href={`/app/${slug}/tasks`}>
                  All tasks
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No activity yet.
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
                          <span className="font-semibold text-foreground">{activity.actorName}</span>{" "}
                          <span className="text-muted-foreground">{getActivityDescription(
                            activity.type,
                            activity.fromValue,
                            activity.toValue
                          )}</span>
                        </p>
                        <Link
                          href={`/app/${slug}/tasks/${activity.issueId}`}
                          className="text-xs font-medium hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span className="text-muted-foreground font-mono">{activity.issueIdentifier}:</span>
                          <span>{activity.issueTitle}</span>
                        </Link>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {tasksEnabled && (
            <DashboardWidget tasks={data.myTasks} orgSlug={slug} />
          )}

          {/* Members Summary */}
          <Card className="shadow-none border-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold">Members</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground">
                <Link href={`/app/${slug}/members`}>
                  View all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {data.members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                      <AvatarImage src={m.image ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {m.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {data.memberCount > 4 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                      +{data.memberCount - 4}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                  {data.plan} Plan
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
