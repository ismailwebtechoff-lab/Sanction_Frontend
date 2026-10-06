import {
  FileText,
  Calendar,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  RotateCcw,
} from "lucide-react";

import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

function formatINR(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("en-IN");
}

function Dashboard() {
  const { user } = useAuth();

  const {
    sanctionContext = [],
    userContext,
  } = useData();

  const userName =
    userContext?.name ||
    user?.name ||
    "User";

  const role = user?.role || "";

  const activeSanctions = sanctionContext.filter(
    (item) => !item.deletedAt
  );

  const totalSanctions = activeSanctions.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthCount = activeSanctions.filter((item) => {
    const date = new Date(
      item.createdAt || item.sanctionDate
    );

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  }).length;

  const totalAmount = activeSanctions.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

  const incompleteCount = activeSanctions.filter(
    (item) => item.status !== "COMPLETE"
  ).length;

  return (
    <div className="space-y-6">

      {/* Role Permissions Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">

        <div className="flex items-center gap-2">

          <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />

          <span>
            Logged in as{" "}
            <strong className="text-slate-900">
              {userName}
            </strong>{" "}
            (
            <strong className="font-mono text-blue-700">
              {role}
            </strong>
            ):{" "}

            {role === "Admin" &&
              "Full Control — Add/Edit/Delete sanctions, Upload/View/Download documents, Manage Users & Roles, View Activity History."}

            {role === "Owner" &&
              "Owner Access — View/Add/Edit all sanctions, Upload/View/Download documents, View Employees & Activity History."}

            {role === "Employee" &&
              "Employee Access — Add sanctions, Upload/View/Download documents, Edit sanctions created by you."}
          </span>
        </div>

        {role === "Admin" && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />

            <span>
              Deleted Sanctions — Recover
            </span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Sanctions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Sanctions
            </p>

            <p className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
              {totalSanctions}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Active sanction records
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              This Month
            </p>

            <p className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
              {thisMonthCount}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Sanctions recorded this period
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Amount
            </p>

            <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">
              {formatINR(totalAmount)}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Across active sanctions
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Incomplete */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Incomplete
            </p>

            <p className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
              {incompleteCount}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Missing required documents
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Sanctions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">

        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Recent Sanctions
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Recently created sanction records.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>

                <th className="text-left py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Sanction
                </th>

                <th className="text-left py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Customer
                </th>

                <th className="text-left py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Date
                </th>

                <th className="text-right py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Amount
                </th>

                <th className="text-center py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {activeSanctions
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
                )
                .slice(0, 10)
                .map((sanction) => (

                  <tr
                    key={sanction._id}
                    className="hover:bg-slate-50 transition-colors"
                  >

                    <td className="py-4 px-6">

                      <span className="font-mono text-xs font-bold text-blue-700">
                        {sanction.sanctionNumber}
                      </span>

                    </td>

                    <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                      {sanction.customerName}
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600">
                      {formatDate(sanction.sanctionDate)}
                    </td>

                    <td className="py-4 px-6 text-right text-sm font-mono font-semibold text-slate-900">
                      {formatINR(sanction.amount)}
                    </td>

                    <td className="py-4 px-6 text-center">

                      {sanction.status === "COMPLETE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">

                          <CheckCircle2 className="w-3.5 h-3.5" />

                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">

                          <AlertCircle className="w-3.5 h-3.5" />

                          Incomplete
                        </span>
                      )}

                    </td>

                  </tr>

                ))}

              {activeSanctions.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    No sanctions found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;