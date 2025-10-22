"use client";

import { useEffect, useState, Fragment } from "react";
import {
  getStaffSessions,
  getSessionCheckIns,
  Session,
  CheckIn,
} from "./actions";
import { signOut } from "@/app/actions";
import Link from "next/link";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<Record<string, CheckIn[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCheckIns, setLoadingCheckIns] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const data = await getStaffSessions();
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  async function toggleSession(sessionId: string) {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }

    setExpandedSession(sessionId);

    if (!checkIns[sessionId]) {
      setLoadingCheckIns(sessionId);
      try {
        const data = await getSessionCheckIns(sessionId);
        setCheckIns((prev) => ({ ...prev, [sessionId]: data }));
      } catch (error) {
        console.error("Error fetching check-ins:", error);
      } finally {
        setLoadingCheckIns(null);
      }
    }
  }

  function exportToCSV(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    const sessionCheckIns = checkIns[sessionId] || [];

    if (!session) return;

    const sessionName = session.name || "Unnamed Session";
    const sessionDate = new Date(session.created_at).toLocaleString();

    const csvRows = [
      ["Session Name", sessionName],
      ["Session Date", sessionDate],
      ["Session ID", sessionId],
      ["Status", session.active ? "Active" : "Ended"],
      ["Total Check-ins", sessionCheckIns.length.toString()],
      [],
      ["Student Name", "Student Email", "Check-in Time"],
      ...sessionCheckIns.map((checkIn) => [
        checkIn.student_name || "N/A",
        checkIn.student_email || "N/A",
        new Date(checkIn.created_at).toLocaleString(),
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-${sessionId}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-neutral-600 dark:text-neutral-400">
          Loading sessions...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
              My Sessions
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              View and export attendance records
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/scan"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              Back to Scanning
            </Link>
            <Link
              href="/student"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              My QR Code
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-12 border border-neutral-200 dark:border-neutral-800 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              No sessions yet. Create your first session on the scanning page!
            </p>
            <Link
              href="/scan"
              className="inline-block mt-4 px-6 py-3 rounded-lg font-medium border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Go to Scanning
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Check-ins
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {sessions.map((session) => (
                    <Fragment key={session.id}>
                      <tr
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                        onClick={() => toggleSession(session.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`w-4 h-4 text-neutral-400 transition-transform ${
                                expandedSession === session.id
                                  ? "rotate-90"
                                  : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                            <span className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                              {session.name || "Unnamed Session"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                          {new Date(session.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              session.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {session.active ? "Active" : "Ended"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                          {checkIns[session.id]?.length ?? "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToCSV(session.id);
                            }}
                            disabled={!checkIns[session.id]}
                            className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Export CSV
                          </button>
                        </td>
                      </tr>
                      {expandedSession === session.id && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/30"
                          >
                            {loadingCheckIns === session.id ? (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
                                Loading check-ins...
                              </p>
                            ) : checkIns[session.id]?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-neutral-100 dark:bg-neutral-800/50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                                        Student Name
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                                        Email
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                                        Check-in Time
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {checkIns[session.id].map((checkIn) => (
                                      <tr key={checkIn.id}>
                                        <td className="px-4 py-2 text-sm text-neutral-950 dark:text-neutral-50">
                                          {checkIn.student_name || "N/A"}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                                          {checkIn.student_email || "N/A"}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                                          {new Date(
                                            checkIn.created_at
                                          ).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
                                No check-ins for this session yet.
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
