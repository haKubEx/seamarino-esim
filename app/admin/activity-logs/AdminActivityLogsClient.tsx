"use client";

import {
  FormEvent,
  useState,
} from "react";

type ActivityLog = {
  id: string;
  action: string;
  module: string;
  entityId: string | null;
  entityType: string | null;
  description: string;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;

  admin: {
    id: string;
    name: string;
    email: string;
  };
};

type LogsResponse = {
  success: boolean;
  error?: string;

  summary?: {
    totalEvents: number;
    todayEvents: number;
    lastSevenDays: number;
    failedEvents: number;
  };

  filters?: {
    modules: {
      value: string;
      count: number;
    }[];

    actions: {
      value: string;
      count: number;
    }[];
  };

  logs?: ActivityLog[];

  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

const EMPTY_SUMMARY = {
  totalEvents: 0,
  todayEvents: 0,
  lastSevenDays: 0,
  failedEvents: 0,
};

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 25,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function formatJson(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return JSON.stringify(
    value,
    null,
    2,
  );
}

export default function AdminActivityLogsClient() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("");

  const [
    successFilter,
    setSuccessFilter,
  ] = useState("all");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    pageSize,
    setPageSize,
  ] = useState(25);

  const [
    logs,
    setLogs,
  ] = useState<ActivityLog[]>([]);

  const [
    selectedLog,
    setSelectedLog,
  ] =
    useState<ActivityLog | null>(
      null,
    );

  const [
    summary,
    setSummary,
  ] = useState(
    EMPTY_SUMMARY,
  );

  const [
    modules,
    setModules,
  ] = useState<
    NonNullable<
      LogsResponse["filters"]
    >["modules"]
  >([]);

  const [
    actions,
    setActions,
  ] = useState<
    NonNullable<
      LogsResponse["filters"]
    >["actions"]
  >([]);

  const [
    pagination,
    setPagination,
  ] = useState(
    EMPTY_PAGINATION,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  async function loadLogs(
    requestedPage = 1,
    event?: FormEvent,
  ) {
    event?.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const params =
        new URLSearchParams({
          page:
            String(
              requestedPage,
            ),

          pageSize:
            String(
              pageSize,
            ),
        });

      if (search.trim()) {
        params.set(
          "search",
          search.trim(),
        );
      }

      if (moduleFilter) {
        params.set(
          "module",
          moduleFilter,
        );
      }

      if (actionFilter) {
        params.set(
          "action",
          actionFilter,
        );
      }

      if (
        successFilter !==
        "all"
      ) {
        params.set(
          "success",
          successFilter,
        );
      }

      if (startDate) {
        params.set(
          "start",
          startDate,
        );
      }

      if (endDate) {
        params.set(
          "end",
          endDate,
        );
      }

      const response =
        await fetch(
          `/api/admin/activity-logs?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        (await response.json()) as
          LogsResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load activity logs.",
        );
      }

      const loadedLogs =
        data.logs ?? [];

      setLogs(
        loadedLogs,
      );

      setSummary(
        data.summary ??
          EMPTY_SUMMARY,
      );

      setModules(
        data.filters?.modules ??
          [],
      );

      setActions(
        data.filters?.actions ??
          [],
      );

      setPagination(
        data.pagination ??
          EMPTY_PAGINATION,
      );

      setMessage(
        `${data.pagination?.total ?? 0} activity event${
          data.pagination?.total === 1
            ? ""
            : "s"
        } found.`,
      );

      if (selectedLog) {
        setSelectedLog(
          loadedLogs.find(
            (log) =>
              log.id ===
              selectedLog.id,
          ) ?? null,
        );
      }
    } catch (loadError) {
      setLogs([]);
      setSelectedLog(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load activity logs.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
    setSuccessFilter("all");
    setStartDate("");
    setEndDate("");
    setPageSize(25);
    setLogs([]);
    setSelectedLog(null);
    setSummary(
      EMPTY_SUMMARY,
    );
    setPagination(
      EMPTY_PAGINATION,
    );
    setError("");
    setMessage("");
  }

  function exportCsv() {
    if (
      logs.length === 0
    ) {
      setError(
        "Load activity logs before exporting.",
      );
      return;
    }

    const rows = [
      [
        "Date",
        "Admin",
        "Admin Email",
        "Action",
        "Module",
        "Success",
        "Entity Type",
        "Entity ID",
        "Description",
        "IP Address",
      ],

      ...logs.map(
        (log) => [
          log.createdAt,
          log.admin.name,
          log.admin.email,
          log.action,
          log.module,
          log.success
            ? "TRUE"
            : "FALSE",
          log.entityType ??
            "",
          log.entityId ??
            "",
          log.description,
          log.ipAddress ??
            "",
        ],
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map((value) =>
              `"${String(
                value,
              ).replaceAll(
                '"',
                '""',
              )}"`,
            )
            .join(","),
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href = url;
    anchor.download =
      "seamarino-admin-activity-logs.csv";
    anchor.click();

    URL.revokeObjectURL(
      url,
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Activity Logs
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Review administrative changes,
            failed actions, affected
            records, request metadata, and
            before-and-after values.
          </p>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                "Total Events",
              value:
                summary.totalEvents,
            },
            {
              label:
                "Today",
              value:
                summary.todayEvents,
            },
            {
              label:
                "Last 7 Days",
              value:
                summary.lastSevenDays,
            },
            {
              label:
                "Failed Actions",
              value:
                summary.failedEvents,
            },
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {card.label}
              </p>

              <p className="mt-3 text-4xl font-black text-slate-950">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            onSubmit={(event) =>
              void loadLogs(
                1,
                event,
              )
            }
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search admin, action, entity, or description"
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />

            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(
                  event.target.value,
                )
              }
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950"
            >
              <option value="">
                All modules
              </option>

              {modules.map(
                (module) => (
                  <option
                    key={
                      module.value
                    }
                    value={
                      module.value
                    }
                  >
                    {
                      module.value
                    }{" "}
                    ({
                      module.count
                    })
                  </option>
                ),
              )}
            </select>

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(
                  event.target.value,
                )
              }
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950"
            >
              <option value="">
                All actions
              </option>

              {actions.map(
                (action) => (
                  <option
                    key={
                      action.value
                    }
                    value={
                      action.value
                    }
                  >
                    {
                      action.value
                    }{" "}
                    ({
                      action.count
                    })
                  </option>
                ),
              )}
            </select>

            <select
              value={successFilter}
              onChange={(event) =>
                setSuccessFilter(
                  event.target.value,
                )
              }
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950"
            >
              <option value="all">
                All results
              </option>

              <option value="true">
                Successful
              </option>

              <option value="false">
                Failed
              </option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value,
                )
              }
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950"
            />

            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value,
                )
              }
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950"
            />

            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="h-14 rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950"
            >
              <option value={25}>
                25 per page
              </option>

              <option value={50}>
                50 per page
              </option>

              <option value={100}>
                100 per page
              </option>
            </select>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="min-h-14 flex-1 rounded-2xl bg-[#0A2D62] px-6 font-black text-white disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Apply Filters"}
              </button>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="min-h-14 rounded-2xl border-2 border-slate-300 bg-white px-5 font-black text-slate-700"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={
                  exportCsv
                }
                className="min-h-14 rounded-2xl bg-emerald-700 px-5 font-black text-white"
              >
                Export CSV
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
              {message}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-4">
            {logs.length ===
            0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="text-5xl">
                  📝
                </p>

                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  No activity logs loaded
                </h2>
              </div>
            ) : (
              logs.map(
                (log) => (
                  <button
                    type="button"
                    key={log.id}
                    onClick={() =>
                      setSelectedLog(
                        log,
                      )
                    }
                    className={`w-full rounded-[2rem] border bg-white p-6 text-left shadow-sm transition ${
                      selectedLog?.id ===
                      log.id
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              log.success
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {log.success
                              ? "SUCCESS"
                              : "FAILED"}
                          </span>

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {
                              log.module
                            }
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black text-slate-950">
                          {
                            log.action
                          }
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {
                            log.description
                          }
                        </p>

                        <p className="mt-3 text-sm font-bold text-slate-500">
                          {
                            log.admin.name
                          }{" "}
                          ·{" "}
                          {
                            log.admin.email
                          }
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-500">
                        {formatDate(
                          log.createdAt,
                        )}
                      </p>
                    </div>
                  </button>
                ),
              )
            )}

            {logs.length >
              0 && (
              <div className="flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white p-5">
                <p className="font-black text-slate-950">
                  Page{" "}
                  {
                    pagination.page
                  }{" "}
                  of{" "}
                  {
                    pagination.totalPages
                  }
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={
                      loading ||
                      !pagination.hasPreviousPage
                    }
                    onClick={() =>
                      void loadLogs(
                        pagination.page -
                          1,
                      )
                    }
                    className="rounded-2xl border-2 border-slate-300 px-5 py-3 font-black disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      !pagination.hasNextPage
                    }
                    onClick={() =>
                      void loadLogs(
                        pagination.page +
                          1,
                      )
                    }
                    className="rounded-2xl bg-[#0A2D62] px-5 py-3 font-black text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Event Details
            </p>

            {selectedLog ? (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Admin
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    {
                      selectedLog.admin.name
                    }
                  </p>

                  <p className="text-sm text-slate-500">
                    {
                      selectedLog.admin.email
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Entity
                  </p>

                  <p className="mt-1 break-all text-sm font-bold text-slate-700">
                    {
                      selectedLog.entityType ??
                      "—"
                    }{" "}
                    /{" "}
                    {
                      selectedLog.entityId ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Request
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-600">
                    IP:{" "}
                    {
                      selectedLog.ipAddress ??
                      "—"
                    }
                  </p>

                  <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                    {
                      selectedLog.userAgent ??
                      "No user agent"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Old Value
                  </p>

                  <pre className="mt-2 max-h-64 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    {formatJson(
                      selectedLog.oldValue,
                    )}
                  </pre>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    New Value
                  </p>

                  <pre className="mt-2 max-h-64 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                    {formatJson(
                      selectedLog.newValue,
                    )}
                  </pre>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-red-500">
                      Error
                    </p>

                    <p className="mt-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {
                        selectedLog.errorMessage
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-slate-500">
                Select an activity event
                to inspect the full audit
                details.
              </p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}