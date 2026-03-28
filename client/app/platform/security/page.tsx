"use client"

import React from "react"
import useSWR from "swr"
import { Shield, ShieldAlert, LogIn, History, UserCog } from "lucide-react"
import { platformJsonFetcher } from "../../../lib/platform-fetcher"
import { PlatformErrorState } from "../../../components/platform/platform-error-state"
import { FlatMetricCard } from "../../../components/platform/flat-metric-card"
import { SimpleTable, SimpleTableRow, SimpleTableCell } from "../../../components/platform/simple-table"
import { Card } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Skeleton } from "../../../components/ui/skeleton"
import { cn } from "../../../lib/utils"

export default function SecurityPage() {
  const { data: overviewRes, error: overviewError, isLoading: overviewLoading } = useSWR("/api/platform/security/overview", platformJsonFetcher)
  const { data: logsRes, error: logsError, isLoading: logsLoading } = useSWR("/api/platform/security/audit-logs", platformJsonFetcher)

  if (overviewError || logsError) {
    return <PlatformErrorState title="Security monitoring unavailable" message="We couldn't retrieve audit or login telemetry." />
  }

  const overview = overviewRes?.data || {
    activeUsersToday: 0,
    highRiskActions: 0,
    recentLogins: [],
    recentAuditLogs: [],
    suspiciousActions: []
  }

  const logs = logsRes?.data || []

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-700">
            <Shield className="h-3.5 w-3.5" />
            Security Console
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Audit and Login Tracking</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review platform-wide login activity, high-risk actions, and security-sensitive events across every tenant.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Active Users Today"
          value={overviewLoading ? "..." : overview.activeUsersToday}
          icon={LogIn}
          subtitle="Logged in since midnight"
        />
        <FlatMetricCard
          title="High Risk Actions"
          value={overviewLoading ? "..." : overview.highRiskActions}
          icon={ShieldAlert}
          subtitle="Delete, suspend, reset"
          className="border-l-4 border-l-rose-500"
        />
        <FlatMetricCard
          title="Suspicious Events"
          value={overview.suspiciousActions?.length || 0}
          icon={History}
          subtitle="Security-sensitive audit logs"
          className="border-l-4 border-l-amber-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recent Logins</h2>
              <p className="text-sm text-slate-500">Latest authentication events recorded in the user directory.</p>
            </div>
            <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {overview.recentLogins?.length || 0} rows
            </Badge>
          </div>

          <SimpleTable headers={["User", "Organization", "Role", "Last Login"]}>
            {overviewLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <SimpleTableRow key={index}>
                  <SimpleTableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </SimpleTableCell>
                </SimpleTableRow>
              ))
            ) : overview.recentLogins?.length ? (
              overview.recentLogins.map((user: any) => (
                <SimpleTableRow key={user._id}>
                  <SimpleTableCell className="font-medium text-slate-950">{user.name}</SimpleTableCell>
                  <SimpleTableCell className="text-slate-500">{user.organization_id?.name || "Platform"}</SimpleTableCell>
                  <SimpleTableCell>
                    <Badge className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      user.role === "platform_admin" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
                    )}>
                      {user.role}
                    </Badge>
                  </SimpleTableCell>
                  <SimpleTableCell className="text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}
                  </SimpleTableCell>
                </SimpleTableRow>
              ))
            ) : (
              <SimpleTableRow>
                <SimpleTableCell colSpan={4} className="py-10 text-center text-slate-400">
                  No recent logins found.
                </SimpleTableCell>
              </SimpleTableRow>
            )}
          </SimpleTable>
        </Card>

        <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Audit Trail</h2>
              <p className="text-sm text-slate-500">Latest platform actions and integrity-sensitive changes.</p>
            </div>
            <Badge className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
              {logs.length || 0} entries
            </Badge>
          </div>

          <div className="space-y-3">
            {logsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))
            ) : logs?.length ? (
              logs.map((log: any) => (
                <div key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-slate-400" />
                        <p className="text-sm font-bold text-slate-950">{log.action}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.actorId?.name || "SYSTEM"} · {log.entityType || "Unknown Entity"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <Shield className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-sm font-bold text-slate-900">No audit entries yet</p>
                <p className="mt-1 text-xs text-slate-500">Platform actions will appear here once administrators make changes.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
