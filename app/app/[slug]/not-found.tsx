import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function OrgNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Not found</h2>
        <p className="text-sm text-muted-foreground">
          The organisation or page you are looking for does not exist, or you do
          not have access to it.
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link href="/app">Back to organisations</Link>
        </Button>
      </div>
    </div>
  );
}
