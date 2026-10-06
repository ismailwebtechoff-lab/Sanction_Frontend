

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import API from "../../axios/axios";
import SanctionForm from "../../components/sanction/SanctionForm";

function formatINR(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function formatDate(date) {
  if (!date) return "—";

  const clean = String(date).slice(0, 10);
  const parts = clean.split("-");

  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return date;
}

function getDocuments(sanction) {
  return sanction?.documents || [];
}

function getSanctionStatus(sanction) {
  if (sanction?.status) {
    return String(sanction.status).toUpperCase();
  }

  const documents = getDocuments(sanction);

  const sanctionDoc = documents.some(
    (doc) => doc.documentType === "SANCTION_PDF"
  );

  const k2Doc = documents.some(
    (doc) => doc.documentType === "K2_AGREEMENT"
  );

  const invoiceDoc = documents.some(
    (doc) => doc.documentType === "INVOICE"
  );

  return sanctionDoc && k2Doc && invoiceDoc
    ? "COMPLETE"
    : "INCOMPLETE";
}

function getCreatedByName(sanction) {
  return (
    sanction?.creatorName ||
    sanction?.createdByName ||
    sanction?.createdBy?.name ||
    "User"
  );
}

function getCreatedById(sanction) {
  if (typeof sanction?.createdBy === "object") {
    return sanction.createdBy?._id || sanction.createdBy?.id;
  }

  return sanction?.createdBy;
}

function getSanctionId(sanction) {
  return sanction?._id || sanction?.id;
}

export default function Sanction() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    sanctionContext,
    setSanctionContext,
  } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingSanction, setEditingSanction] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const normalizedRole = String(user?.role || "").toUpperCase();

  const sanctions = Array.isArray(sanctionContext)
    ? sanctionContext
    : [];

  const filteredSanctions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return sanctions.filter((sanction) => {
      const status = getSanctionStatus(sanction);

      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchableText = [
        sanction?.sanctionNumber,
        sanction?.customerName,
        sanction?.referenceNumber,
        sanction?.invoiceNumber,
        getCreatedByName(sanction),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [sanctions, search, statusFilter]);

  const totalCount = sanctions.length;

  const completeCount = sanctions.filter(
    (sanction) => getSanctionStatus(sanction) === "COMPLETE"
  ).length;

  const incompleteCount = sanctions.filter(
    (sanction) => getSanctionStatus(sanction) === "INCOMPLETE"
  ).length;

  const openAddForm = () => {
    setEditingSanction(null);
    setShowForm(true);
  };

  const openEditForm = (sanction) => {
    setEditingSanction(sanction);
    setShowForm(true);
  };

  const handleSaved = (savedSanction) => {
    setShowForm(false);
    setEditingSanction(null);

    if (savedSanction) {
      const savedId =
        savedSanction?._id ||
        savedSanction?.id;

      if (savedId) {
        setSanctionContext((prev) => {
          const current = Array.isArray(prev) ? prev : [];

          const index = current.findIndex(
            (item) => String(getSanctionId(item)) === String(savedId)
          );

          if (index === -1) {
            return [savedSanction, ...current];
          }

          const updated = [...current];
          updated[index] = {
            ...updated[index],
            ...savedSanction,
          };

          return updated;
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      await API.delete(`/sanction/${deleteId}`);

      setSanctionContext((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (sanction) =>
            String(getSanctionId(sanction)) !== String(deleteId)
        )
      );

      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete sanction:", error);

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to delete sanction."
      );
    } finally {
      setDeleting(false);
    }
  };

  const canEdit = (sanction) => {
    if (
      normalizedRole === "ADMIN" ||
      normalizedRole === "OWNER"
    ) {
      return true;
    }

    if (normalizedRole === "EMPLOYEE") {
      return (
        String(getCreatedById(sanction)) ===
        String(user?._id || user?.id)
      );
    }

    return false;
  };

  const canDelete = normalizedRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sanctions
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage sanction records and supporting documents.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          ADD SANCTION
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Sanctions
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                {totalCount}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Complete
              </p>

              <p className="text-2xl font-bold text-emerald-700 mt-2">
                {completeCount}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Incomplete
              </p>

              <p className="text-2xl font-bold text-amber-700 mt-2">
                {incompleteCount}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sanction number, customer, reference or invoice..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETE">Complete</option>
            <option value="INCOMPLETE">Incomplete</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            All Sanctions
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            {filteredSanctions.length} record
            {filteredSanctions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredSanctions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />

            <p className="text-sm font-semibold text-slate-700 mt-3">
              No sanctions found
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Sanction
                  </th>

                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>

                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Reference
                  </th>

                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Created By
                  </th>

                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSanctions.map((sanction) => {
                  const id = getSanctionId(sanction);

                  const status =
                    getSanctionStatus(sanction);

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/sanction/${id}`)
                          }
                          className="font-mono font-bold text-sm text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          {sanction.sanctionNumber}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {sanction.customerName}
                        </div>

                        {sanction.invoiceNumber && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Invoice: {sanction.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-700">
                          {sanction.referenceNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-blue-700">
                          {formatINR(sanction.amount)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(sanction.sanctionDate)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {getCreatedByName(sanction)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {status === "COMPLETE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Incomplete
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/sanction/${id}`)
                            }
                            className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit(sanction) && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(sanction)
                              }
                              className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteId(id)
                              }
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <SanctionForm
          mode={editingSanction ? "edit" : "add"}
          initialSanction={editingSanction}
          onClose={() => {
            setShowForm(false);
            setEditingSanction(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Sanction?
                </h3>

                <p className="text-sm text-slate-600 mt-1">
                  Are you sure you want to delete this sanction?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting
                  ? "DELETING..."
                  : "YES, DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useMemo, useState } from "react";
// import {
//   Plus,
//   Search,
//   Eye,
//   Edit,
//   Trash2,
//   FileText,
//   CheckCircle2,
//   Clock,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useData } from "../../context/DataContext";
// import API from "../../axios/axios";
// import SanctionForm from "./SanctionForm";

// function Sanction() {
//   const navigate = useNavigate();

//   const {
//     sanctionContext,
//     setSanctionContext,
//   } = useData();

//   const [search, setSearch] = useState("");
//   const [showForm, setShowForm] = useState(false);
//   const [editingSanction, setEditingSanction] =
//     useState(null);

//   const [deletingId, setDeletingId] = useState(null);

//   // ============================================================
//   // Search
//   // ============================================================

//   const filteredSanctions = useMemo(() => {
//     const value = search
//       .trim()
//       .toLowerCase();

//     if (!value) {
//       return sanctionContext || [];
//     }

//     return (sanctionContext || []).filter(
//       (sanction) =>
//         sanction.sanctionNumber
//           ?.toLowerCase()
//           .includes(value) ||
//         sanction.customerName
//           ?.toLowerCase()
//           .includes(value) ||
//         sanction.referenceNumber
//           ?.toLowerCase()
//           .includes(value) ||
//         sanction.invoiceNumber
//           ?.toLowerCase()
//           .includes(value)
//     );
//   }, [sanctionContext, search]);

//   // ============================================================
//   // Check document completion
//   // ============================================================

//   const getDocumentStatus = (sanction) => {
//     const complete =
//       Boolean(sanction.sanctionDocument) &&
//       Boolean(sanction.k2Document) &&
//       Boolean(sanction.invoiceDocument);

//     return complete ? "COMPLETE" : "INCOMPLETE";
//   };

//   // ============================================================
//   // Open create form
//   // ============================================================

//   const handleCreate = () => {
//     setEditingSanction(null);
//     setShowForm(true);
//   };

//   // ============================================================
//   // Open edit form
//   // ============================================================

//   const handleEdit = (sanction) => {
//     setEditingSanction(sanction);
//     setShowForm(true);
//   };

//   // ============================================================
//   // After save
//   // ============================================================

//   const handleSaved = (savedSanction) => {
//     setSanctionContext((previous) => {
//       const list = previous || [];

//       const exists = list.some(
//         (item) =>
//           String(item._id) ===
//           String(savedSanction._id)
//       );

//       if (exists) {
//         return list.map((item) =>
//           String(item._id) ===
//           String(savedSanction._id)
//             ? savedSanction
//             : item
//         );
//       }

//       return [
//         savedSanction,
//         ...list,
//       ];
//     });
//   };

//   // ============================================================
//   // Delete
//   // ============================================================

//   const handleDelete = async (sanction) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to delete sanction "${sanction.sanctionNumber}"?`
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setDeletingId(sanction._id);

//       const response = await API.delete(
//         `/sanction/${sanction._id}`
//       );

//       if (response.data?.success) {
//         setSanctionContext((previous) =>
//           (previous || []).filter(
//             (item) =>
//               String(item._id) !==
//               String(sanction._id)
//           )
//         );
//       } else {
//         alert(
//           response.data?.message ||
//             "Failed to delete sanction."
//         );
//       }
//     } catch (error) {
//       console.error(
//         "Delete sanction error:",
//         error
//       );

//       alert(
//         error?.response?.data?.message ||
//           "Failed to delete sanction."
//       );
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // ============================================================
//   // Format date
//   // ============================================================

//   const formatDate = (date) => {
//     if (!date) return "-";

//     return new Date(date).toLocaleDateString(
//       "en-IN",
//       {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       }
//     );
//   };

//   // ============================================================
//   // Format amount
//   // ============================================================

//   const formatAmount = (amount) => {
//     if (
//       amount === undefined ||
//       amount === null ||
//       amount === ""
//     ) {
//       return "-";
//     }

//     return Number(amount).toLocaleString(
//       "en-IN",
//       {
//         style: "currency",
//         currency: "INR",
//         maximumFractionDigits: 2,
//       }
//     );
//   };

//   // ============================================================
//   // UI
//   // ============================================================

//   return (
//     <div className="space-y-6">
//       {/* ======================================================
//           Header
//       ====================================================== */}

//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
//             Sanctions
//           </h1>

//           <p className="text-sm text-slate-500 mt-1">
//             Manage sanction records and documents
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={handleCreate}
//           className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
//         >
//           <Plus size={18} />

//           Create Sanction
//         </button>
//       </div>

//       {/* ======================================================
//           Search
//       ====================================================== */}

//       <div className="relative">
//         <Search
//           size={18}
//           className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//         />

//         <input
//           type="text"
//           value={search}
//           onChange={(e) =>
//             setSearch(e.target.value)
//           }
//           placeholder="Search sanctions..."
//           className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//         />
//       </div>

//       {/* ======================================================
//           Table
//       ====================================================== */}

//       <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-slate-50 dark:bg-slate-900">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
//                   Sanction
//                 </th>

//                 <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
//                   Customer
//                 </th>

//                 <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
//                   Date
//                 </th>

//                 <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
//                   Amount
//                 </th>

//                 <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
//                   Documents
//                 </th>

//                 <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
//                   Actions
//                 </th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
//               {filteredSanctions.length ===
//               0 ? (
//                 <tr>
//                   <td
//                     colSpan="6"
//                     className="px-4 py-12 text-center"
//                   >
//                     <FileText
//                       size={40}
//                       className="mx-auto text-slate-300 dark:text-slate-700"
//                     />

//                     <p className="mt-3 text-sm text-slate-500">
//                       No sanctions found.
//                     </p>
//                   </td>
//                 </tr>
//               ) : (
//                 filteredSanctions.map(
//                   (sanction) => {
//                     const status =
//                       getDocumentStatus(
//                         sanction
//                       );

//                     return (
//                       <tr
//                         key={sanction._id}
//                         className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
//                       >
//                         {/* Sanction */}
//                         <td className="px-4 py-4">
//                           <button
//                             type="button"
//                             onClick={() =>
//                               navigate(
//                                 `/sanction/${sanction._id}`
//                               )
//                             }
//                             className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
//                           >
//                             {
//                               sanction.sanctionNumber
//                             }
//                           </button>

//                           {sanction.referenceNumber && (
//                             <p className="text-xs text-slate-500 mt-1">
//                               Ref:{" "}
//                               {
//                                 sanction.referenceNumber
//                               }
//                             </p>
//                           )}
//                         </td>

//                         {/* Customer */}
//                         <td className="px-4 py-4">
//                           <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
//                             {
//                               sanction.customerName
//                             }
//                           </p>

//                           {sanction.invoiceNumber && (
//                             <p className="text-xs text-slate-500 mt-1">
//                               Invoice:{" "}
//                               {
//                                 sanction.invoiceNumber
//                               }
//                             </p>
//                           )}
//                         </td>

//                         {/* Date */}
//                         <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
//                           {formatDate(
//                             sanction.sanctionDate
//                           )}
//                         </td>

//                         {/* Amount */}
//                         <td className="px-4 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
//                           {formatAmount(
//                             sanction.amount
//                           )}
//                         </td>

//                         {/* Documents */}
//                         <td className="px-4 py-4">
//                           {status ===
//                           "COMPLETE" ? (
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
//                               <CheckCircle2
//                                 size={14}
//                               />

//                               Complete
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
//                               <Clock
//                                 size={14}
//                               />

//                               Incomplete
//                             </span>
//                           )}
//                         </td>

//                         {/* Actions */}
//                         <td className="px-4 py-4">
//                           <div className="flex items-center justify-end gap-1">
//                             {/* View */}
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 navigate(
//                                   `/sanction/${sanction._id}`
//                                 )
//                               }
//                               title="View"
//                               className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
//                             >
//                               <Eye
//                                 size={17}
//                               />
//                             </button>

//                             {/* Edit */}
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleEdit(
//                                   sanction
//                                 )
//                               }
//                               title="Edit"
//                               className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
//                             >
//                               <Edit
//                                 size={17}
//                               />
//                             </button>

//                             {/* Delete */}
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleDelete(
//                                   sanction
//                                 )
//                               }
//                               disabled={
//                                 deletingId ===
//                                 sanction._id
//                               }
//                               title="Delete"
//                               className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
//                             >
//                               {deletingId ===
//                               sanction._id ? (
//                                 <span className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin block" />
//                               ) : (
//                                 <Trash2
//                                   size={17}
//                                 />
//                               )}
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   }
//                 )
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ======================================================
//           Form
//       ====================================================== */}

//       <SanctionForm
//         isOpen={showForm}
//         onClose={() => {
//           setShowForm(false);
//           setEditingSanction(null);
//         }}
//         sanction={editingSanction}
//         onSaved={handleSaved}
//       />
//     </div>
//   );
// }

// export default Sanction;