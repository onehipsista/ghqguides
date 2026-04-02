import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getAccessState } from "@/lib/access";
import { getAdminUsers, setUserGuideAccess, setUserRole } from "@/lib/admin-users";
import { adminEmailAllowlist } from "@/lib/supabase";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data: accessState, isLoading: isAccessLoading } = useQuery({
    queryKey: ["access-state"],
    queryFn: getAccessState,
  });

  const isAdminByRole = accessState?.role === "admin";
  const isAdminByAllowlist = Boolean(
    accessState?.email && adminEmailAllowlist.includes(accessState.email.toLowerCase())
  );
  const isAdmin = isAdminByRole || isAdminByAllowlist;

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
    enabled: isAdmin,
  });

  const { mutate: toggleAccess, isPending: isTogglingAccess } = useMutation({
    mutationFn: ({ userId, guideAccess }: { userId: string; guideAccess: boolean }) =>
      setUserGuideAccess(userId, guideAccess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const { mutate: toggleRole, isPending: isTogglingRole } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string | null }) =>
      setUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  if (!isAccessLoading && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin — Users</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View registered users and manage guide access manually.
            </p>
          </div>
          <Link to="/admin">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        {isAccessLoading && (
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Checking access...</div>
        )}

        {isAdmin && (
          <div className="overflow-hidden rounded-xl border bg-card">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading users...</div>
            ) : isError ? (
              <div className="p-4">
                <p className="text-sm text-red-700">
                  Could not load users.{" "}
                  {error instanceof Error ? error.message : "Check that your profiles table allows admin reads."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  You may need to add an RLS policy: admins can select all profiles.
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Guide Access
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {user.email ?? <span className="text-muted-foreground italic">No email</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.role ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              user.guide_access
                                ? "bg-brand-green/15 text-brand-green"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.guide_access ? "Unlocked" : "Locked"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={user.guide_access ? "outline" : "default"}
                              disabled={isTogglingAccess}
                              onClick={() =>
                                toggleAccess({ userId: user.id, guideAccess: !user.guide_access })
                              }
                            >
                              {user.guide_access ? "Revoke Access" : "Grant Access"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isTogglingRole}
                              onClick={() =>
                                toggleRole({
                                  userId: user.id,
                                  role: user.role === "admin" ? null : "admin",
                                })
                              }
                            >
                              {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
