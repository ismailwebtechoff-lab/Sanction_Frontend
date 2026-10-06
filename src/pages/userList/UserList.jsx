import {
  Users,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

function UserList() {
  const { user } = useAuth();

  const {
    allUserContext = [],
  } = useData();

  const [searchQuery, setSearchQuery] =
    useState("");

  const filteredUsers = useMemo(() => {

    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return allUserContext;
    }

    return allUserContext.filter(
      (item) =>
        item.name
          ?.toLowerCase()
          .includes(query) ||
        item.email
          ?.toLowerCase()
          .includes(query) ||
        item.role
          ?.toLowerCase()
          .includes(query)
    );

  }, [allUserContext, searchQuery]);

  const canManageUsers =
    user?.role === "Admin";

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {canManageUsers
              ? "User Management"
              : "Employees"}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Manage system users, roles and account status.
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">

        {/* Search */}
        <div className="p-5 border-b border-slate-200">

          <div className="relative w-full sm:w-80">

            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search users..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px]">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>

                <th className="py-3 px-6 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  User
                </th>

                <th className="py-3 px-6 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Email
                </th>

                <th className="py-3 px-6 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Role
                </th>

                <th className="py-3 px-6 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredUsers.map(
                (item, index) => (

                  <tr
                    key={
                      item._id ||
                      item.id ||
                      index
                    }
                    className="hover:bg-slate-50 transition-colors"
                  >

                    <td className="py-4 px-6">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>

                        <span className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </span>

                      </div>

                    </td>

                    <td className="py-4 px-6 text-xs text-slate-600">
                      {item.email}
                    </td>

                    <td className="py-4 px-6">

                      <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {item.role}
                      </span>

                    </td>

                    <td className="py-4 px-6 text-center">

                      {item.status ===
                      "ACTIVE" ? (

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">

                          <UserCheck className="w-3.5 h-3.5" />

                          Active

                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">

                          <UserX className="w-3.5 h-3.5" />

                          Inactive

                        </span>

                      )}

                    </td>

                  </tr>
                )
              )}

              {filteredUsers.length === 0 && (

                <tr>

                  <td
                    colSpan="4"
                    className="py-16 text-center text-sm text-slate-500"
                  >
                    No users found.
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

export default UserList;