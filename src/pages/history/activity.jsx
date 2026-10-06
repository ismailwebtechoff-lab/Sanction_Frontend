import {
  Activity as ActivityIcon,
  Search,
} from "lucide-react";

import { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useNavigate } from "react-router-dom";

function Activity() {
  const navigate = useNavigate();

  const {
    activityContext = [],
  } = useData();

  const [searchQuery, setSearchQuery] =
    useState("");

  const filteredActivities = useMemo(() => {

    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return activityContext;
    }

    return activityContext.filter(
      (item) =>
        item.action
          ?.toLowerCase()
          .includes(query) ||
        item.userName
          ?.toLowerCase()
          .includes(query) ||
        item.sanctionNumber
          ?.toLowerCase()
          .includes(query)
    );

  }, [activityContext, searchQuery]);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-extrabold text-slate-900">
          Activity History
        </h1>

        <p className="text-xs text-slate-500 mt-1">
          Track sanction and document activity.
        </p>
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
              placeholder="Search activity..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

          </div>

        </div>

        {filteredActivities.length === 0 ? (

          <div className="py-16 text-center">

            <ActivityIcon className="w-8 h-8 text-slate-300 mx-auto" />

            <p className="text-sm text-slate-500 mt-3">
              No activity found.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {filteredActivities.map(
              (activity, index) => (

                <div
                  key={
                    activity._id ||
                    activity.id ||
                    index
                  }
                  className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                >

                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <ActivityIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-semibold text-slate-900">
                      {activity.action}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {activity.userName ||
                        "Unknown user"}
                    </p>

                    {activity.sanctionNumber && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/sanction/${activity.sanctionId}`
                          )
                        }
                        className="text-xs font-mono text-blue-700 hover:underline mt-1"
                      >
                        {activity.sanctionNumber}
                      </button>
                    )}

                  </div>

                  <div className="text-right shrink-0">

                    <p className="text-[11px] text-slate-400">
                      {activity.createdAt
                        ? new Date(
                            activity.createdAt
                          ).toLocaleString(
                            "en-IN"
                          )
                        : ""}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default Activity;