
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Receipt,
  Eye,
  Download,
  Upload,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User as UserIcon,
  Calendar,
  Hash,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import API from "../../axios/axios";
import SanctionForm from "../../components/sanction/SanctionForm";

function formatINR(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "—";

  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split("-");

  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return dateStr;
}

function formatDateTimeReadable(dateStr) {
  if (!dateStr) return "—";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDocumentUrl(doc) {
  return (
    doc?.fileUrl ||
    doc?.url ||
    `/document/${doc?._id || doc?.id}/download`
  );
}

function DocumentSlotCard({
  icon,
  title,
  required,
  doc,
  onView,
  onUpload,
}) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        doc
          ? "bg-white border-slate-200 hover:border-slate-300"
          : "bg-amber-50/30 border-amber-200/80"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {title}
              </h3>

              {doc ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Uploaded
                </span>
              ) : required ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <XCircle className="w-3 h-3" />
                  Missing
                </span>
              ) : null}
            </div>

            {doc ? (
              <div className="mt-1 space-y-0.5">
                <p
                  className="text-xs font-mono text-slate-700 truncate max-w-md"
                  title={doc.fileName}
                >
                  {doc.fileName}
                </p>

                <p className="text-[11px] text-slate-400">
                  Uploaded by{" "}
                  {doc.uploadedByName || "User"}{" "}
                  •{" "}
                  {Math.round(
                    Number(doc.fileSize || 0) / 1024
                  )}{" "}
                  KB
                  {doc.mimeType
                    ? ` • ${doc.mimeType}`
                    : ""}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Document not uploaded yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {doc ? (
            <>
              <button
                type="button"
                onClick={() => onView(doc)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                VIEW
              </button>

              <a
                href={getDocumentUrl(doc)}
                download={doc.fileName}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD
              </a>

              <button
                type="button"
                onClick={onUpload}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Replace document"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              UPLOAD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SanctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    setSanctionContext,
  } = useData();

  const [sanction, setSanction] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditForm, setShowEditForm] =
    useState(false);

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  const [selectedDocType, setSelectedDocType] =
    useState("SANCTION_PDF");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const fetchSanction = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/sanction/${id}`
      );

      const data =
        response.data?.sanction ||
        response.data;

      setSanction(data);
    } catch (err) {
      console.error(
        "Failed to load sanction:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load sanction."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSanction();
    }
  }, [id]);

  const documents = useMemo(
    () => sanction?.documents || [],
    [sanction]
  );

  const sanctionPdfDoc = documents.find(
    (doc) =>
      doc.documentType === "SANCTION_PDF"
  );

  const k2AgreementDoc = documents.find(
    (doc) =>
      doc.documentType === "K2_AGREEMENT"
  );

  const invoiceDoc = documents.find(
    (doc) =>
      doc.documentType === "INVOICE"
  );

  const otherDocs = documents.filter(
    (doc) =>
      doc.documentType === "OTHER"
  );

  const isComplete =
    Boolean(sanctionPdfDoc) &&
    Boolean(k2AgreementDoc) &&
    Boolean(invoiceDoc);

  const normalizedRole =
    String(user?.role || "").toUpperCase();

  const currentUserId =
    user?._id || user?.id;

  const createdById =
    typeof sanction?.createdBy === "object"
      ? sanction?.createdBy?._id ||
        sanction?.createdBy?.id
      : sanction?.createdBy;

  const canEdit =
    normalizedRole === "ADMIN" ||
    normalizedRole === "OWNER" ||
    (
      normalizedRole === "EMPLOYEE" &&
      String(createdById) ===
        String(currentUserId)
    );

  const canDelete =
    normalizedRole === "ADMIN";

  const handleSaved = async () => {
    setShowEditForm(false);
    await fetchSanction();
  };

  const openUpload = (docType) => {
    setSelectedDocType(docType);
    setSelectedFile(null);
    setUploadError("");
    setShowUploadModal(true);
  };

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const isImage =
      file.type.startsWith("image/");

    const isPdf =
      file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setUploadError(
        "Only image or PDF files are allowed."
      );
      setSelectedFile(null);
      return;
    }

    setUploadError("");
    setSelectedFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    setUploadError("");

    if (!selectedFile) {
      setUploadError(
        "Please select an image or PDF file."
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      formData.append(
        "sanctionId",
        id
      );

      formData.append(
        "documentType",
        selectedDocType
      );

      formData.append(
        "fileName",
        selectedFile.name
      );

      formData.append(
        "invoiceNumber",
        sanction?.invoiceNumber || ""
      );

      formData.append(
        "uploadedBy",
        currentUserId || ""
      );

      formData.append(
        "uploadedByName",
        user?.name || "User"
      );

      await API.post(
        "/document",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      setShowUploadModal(false);
      setSelectedFile(null);

      await fetchSanction();
    } catch (err) {
      console.error(
        "Document upload failed:",
        err
      );

      setUploadError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await API.delete(
        `/sanction/${id}`
      );

      setSanctionContext((prev) =>
        (Array.isArray(prev)
          ? prev
          : []
        ).filter(
          (item) =>
            String(
              item?._id || item?.id
            ) !== String(id)
        )
      );

      navigate("/sanctions");
    } catch (err) {
      console.error(
        "Failed to delete sanction:",
        err
      );

      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete sanction."
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewDocument = (doc) => {
    const url = getDocumentUrl(doc);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-500">
          Loading sanction...
        </div>
      </div>
    );
  }

  if (error || !sanction) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto text-rose-400" />

        <h2 className="text-lg font-bold text-slate-900 mt-3">
          Unable to load sanction
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          {error || "Sanction not found."}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/sanctions")
          }
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sanctions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() =>
              navigate("/sanctions")
            }
            className="mt-1 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-slate-900">
                {sanction.sanctionNumber}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  isComplete
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}

                {isComplete
                  ? "COMPLETE"
                  : "INCOMPLETE"}
              </span>
            </div>

            <p className="text-sm text-slate-600 mt-0.5">
              {sanction.customerName} • Ref:{" "}
              <span className="font-mono">
                {sanction.referenceNumber}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit ? (
            <button
              type="button"
              onClick={() =>
                setShowEditForm(true)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              EDIT SANCTION
            </button>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              View Only
            </span>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() =>
                setShowDeleteConfirm(true)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              DELETE
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-5 space-y-6">
          {/* Information */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Sanction Information
              </h2>
            </div>

            <div className="p-6 divide-y divide-slate-100 text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  Sanction Number
                </span>

                <span className="font-mono font-bold text-slate-900">
                  {sanction.sanctionNumber}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Date
                </span>

                <span className="font-medium text-slate-900">
                  {formatDateDDMMYYYY(
                    sanction.sanctionDate
                  )}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500">
                  Customer / Company
                </span>

                <span className="font-semibold text-slate-900 text-right">
                  {sanction.customerName}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500">
                  Reference Number
                </span>

                <span className="font-mono font-medium text-slate-800">
                  {sanction.referenceNumber}
                </span>
              </div>

              {sanction.invoiceNumber && (
                <div className="py-3 flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    Invoice Number
                  </span>

                  <span className="font-mono font-medium text-slate-800">
                    {sanction.invoiceNumber}
                  </span>
                </div>
              )}

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500">
                  Amount
                </span>

                <span className="font-mono text-lg font-bold text-blue-700">
                  {formatINR(sanction.amount)}
                </span>
              </div>

              <div className="py-3">
                <span className="text-slate-500 block mb-1.5">
                  Remarks
                </span>

                <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs leading-relaxed">
                  {sanction.remarks ||
                    "No remarks added."}
                </p>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Created By
                </span>

                <span className="font-medium text-slate-900">
                  {sanction.creatorName ||
                    sanction.createdByName ||
                    "User"}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Created Date
                </span>

                <span className="text-xs text-slate-700">
                  {formatDateTimeReadable(
                    sanction.createdAt
                  )}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Last Updated
                </span>

                <span className="text-xs text-slate-700">
                  {formatDateTimeReadable(
                    sanction.updatedAt
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Document Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Document Status
              </h2>

              <span className="font-mono text-xs font-bold text-slate-600">
                {sanction.sanctionNumber}
              </span>
            </div>

            <div className="p-6 space-y-3">
              {[
                {
                  label: "Sanction Document",
                  uploaded: Boolean(
                    sanctionPdfDoc
                  ),
                },
                {
                  label: "K2 Document",
                  uploaded: Boolean(
                    k2AgreementDoc
                  ),
                },
                {
                  label: "Invoice",
                  uploaded: Boolean(
                    invoiceDoc
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 px-3.5 rounded-lg bg-slate-50 border border-slate-200/80"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {item.label}
                  </span>

                  {item.uploaded ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <span>✅</span>
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                      <span>❌</span>
                      Missing
                    </span>
                  )}
                </div>
              ))}

              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Overall Status
                </span>

                <span
                  className={`px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                    isComplete
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isComplete
                    ? "COMPLETE"
                    : "INCOMPLETE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Documents
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  Image or PDF documents can be viewed
                  and downloaded.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <DocumentSlotCard
                icon={
                  <FileText className="w-5 h-5 text-blue-600" />
                }
                title="📄 Sanction Document"
                required
                doc={sanctionPdfDoc}
                onView={handleViewDocument}
                onUpload={() =>
                  openUpload("SANCTION_PDF")
                }
              />

              <DocumentSlotCard
                icon={
                  <FileText className="w-5 h-5 text-indigo-600" />
                }
                title="📄 K2 Document"
                required
                doc={k2AgreementDoc}
                onView={handleViewDocument}
                onUpload={() =>
                  openUpload("K2_AGREEMENT")
                }
              />

              <DocumentSlotCard
                icon={
                  <Receipt className="w-5 h-5 text-amber-600" />
                }
                title="🧾 Invoice"
                required
                doc={invoiceDoc}
                onView={handleViewDocument}
                onUpload={() =>
                  openUpload("INVOICE")
                }
              />

              {otherDocs.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Other Documents
                  </div>

                  <div className="space-y-3">
                    {otherDocs.map((doc) => (
                      <DocumentSlotCard
                        key={
                          doc._id || doc.id
                        }
                        icon={
                          <FileText className="w-5 h-5 text-slate-600" />
                        }
                        title="Other Document"
                        required={false}
                        doc={doc}
                        onView={handleViewDocument}
                        onUpload={() =>
                          openUpload("OTHER")
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {showEditForm && (
        <SanctionForm
          mode="edit"
          initialSanction={sanction}
          onClose={() =>
            setShowEditForm(false)
          }
          onSaved={handleSaved}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Upload Document
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowUploadModal(false)
                }
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="p-5 space-y-4"
            >
              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Type
                </label>

                <select
                  value={selectedDocType}
                  onChange={(e) =>
                    setSelectedDocType(
                      e.target.value
                    )
                  }
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="SANCTION_PDF">
                    Sanction Document
                  </option>

                  <option value="K2_AGREEMENT">
                    K2 Document
                  </option>

                  <option value="INVOICE">
                    Invoice
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select File
                </label>

                <div className="p-4 rounded-lg border border-dashed border-slate-300 bg-slate-50">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />

                    {selectedFile
                      ? "CHANGE FILE"
                      : "CHOOSE FILE"}

                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      className="hidden"
                      onChange={
                        handleFileChange
                      }
                    />
                  </label>

                  <p className="text-[11px] text-slate-500 mt-2">
                    Supported: JPG, JPEG, PNG, WEBP
                    and PDF.
                  </p>

                  {selectedFile && (
                    <div className="mt-3 p-2.5 bg-white rounded border border-slate-200">
                      <p className="text-xs font-mono text-slate-800 truncate">
                        {selectedFile.name}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1">
                        {Math.round(
                          selectedFile.size /
                            1024
                        )}{" "}
                        KB •{" "}
                        {selectedFile.type}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() =>
                    setShowUploadModal(false)
                  }
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={
                    uploading ||
                    !selectedFile
                  }
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50"
                >
                  {uploading
                    ? "UPLOADING..."
                    : "UPLOAD DOCUMENT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Sanction{" "}
                  {sanction.sanctionNumber}?
                </h3>

                <p className="text-sm text-slate-600 mt-1">
                  Are you sure you want to delete
                  this sanction?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              >
                CANCEL
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting
                  ? "DELETING..."
                  : "YES, DELETE SANCTION"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useEffect, useState } from "react";
// import {
//   ArrowLeft,
//   Edit,
//   Trash2,
//   FileText,
//   Image as ImageIcon,
//   ExternalLink,
//   CheckCircle2,
//   Clock,
//   User,
//   Calendar,
//   Hash,
//   Receipt,
//   IndianRupee,
// } from "lucide-react";
// import { useNavigate, useParams } from "react-router-dom";
// import API from "../../axios/axios";
// import SanctionForm from "./SanctionForm";
// import { useAuth } from "../../context/AuthContext";

// function SanctionDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const { user } = useAuth();

//   const [sanction, setSanction] =
//     useState(null);

//   const [loading, setLoading] =
//     useState(true);

//   const [error, setError] =
//     useState("");

//   const [showEditForm, setShowEditForm] =
//     useState(false);

//   const [deleting, setDeleting] =
//     useState(false);

//   // ============================================================
//   // Fetch sanction
//   // ============================================================

//   const fetchSanction = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await API.get(
//         `/sanction/${id}`
//       );

//       setSanction(
//         response.data?.sanction ||
//           response.data
//       );
//     } catch (err) {
//       console.error(
//         "Fetch sanction error:",
//         err
//       );

//       setError(
//         err?.response?.data?.message ||
//           "Failed to load sanction."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (id) {
//       fetchSanction();
//     }
//   }, [id]);

//   // ============================================================
//   // Delete
//   // ============================================================

//   const handleDelete = async () => {
//     if (!sanction) return;

//     const confirmed = window.confirm(
//       `Are you sure you want to delete sanction "${sanction.sanctionNumber}"?`
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setDeleting(true);

//       const response = await API.delete(
//         `/sanction/${sanction._id}`
//       );

//       if (response.data?.success) {
//         navigate("/sanctions");
//       } else {
//         alert(
//           response.data?.message ||
//             "Failed to delete sanction."
//         );
//       }
//     } catch (err) {
//       console.error(
//         "Delete sanction error:",
//         err
//       );

//       alert(
//         err?.response?.data?.message ||
//           "Failed to delete sanction."
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // ============================================================
//   // After edit
//   // ============================================================

//   const handleUpdated = (updatedSanction) => {
//     setSanction(updatedSanction);
//     setShowEditForm(false);
//   };

//   // ============================================================
//   // Helpers
//   // ============================================================

//   const formatDate = (date) => {
//     if (!date) return "-";

//     return new Date(date).toLocaleDateString(
//       "en-IN",
//       {
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//       }
//     );
//   };

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
//       }
//     );
//   };

//   const isComplete =
//     Boolean(sanction?.sanctionDocument) &&
//     Boolean(sanction?.k2Document) &&
//     Boolean(sanction?.invoiceDocument);

//   // ============================================================
//   // Open document
//   // ============================================================

//   const openDocument = (document) => {
//     if (!document?.url) {
//       return;
//     }

//     window.open(
//       document.url,
//       "_blank",
//       "noopener,noreferrer"
//     );
//   };

//   // ============================================================
//   // Document card
//   // ============================================================

//   const DocumentCard = ({
//     title,
//     document,
//   }) => {
//     if (!document) {
//       return (
//         <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
//               <FileText
//                 size={20}
//                 className="text-slate-400"
//               />
//             </div>

//             <div>
//               <p className="font-medium text-slate-800 dark:text-slate-200">
//                 {title}
//               </p>

//               <p className="text-sm text-slate-500 mt-1">
//                 Document not uploaded
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     const isPdf =
//       document.fileType === "pdf";

//     return (
//       <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div className="flex items-center gap-3 min-w-0">
//             <div
//               className={`w-10 h-10 rounded-lg flex items-center justify-center ${
//                 isPdf
//                   ? "bg-red-50 dark:bg-red-950/30"
//                   : "bg-blue-50 dark:bg-blue-950/30"
//               }`}
//             >
//               {isPdf ? (
//                 <FileText
//                   size={20}
//                   className="text-red-500"
//                 />
//               ) : (
//                 <ImageIcon
//                   size={20}
//                   className="text-blue-500"
//                 />
//               )}
//             </div>

//             <div className="min-w-0">
//               <p className="font-medium text-slate-800 dark:text-slate-200">
//                 {title}
//               </p>

//               <p className="text-xs text-slate-500 mt-1">
//                 {isPdf
//                   ? "PDF Document"
//                   : "Image Document"}
//               </p>
//             </div>
//           </div>

//           <CheckCircle2
//             size={19}
//             className="text-emerald-500 shrink-0"
//           />
//         </div>

//         <button
//           type="button"
//           onClick={() =>
//             openDocument(document)
//           }
//           className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
//         >
//           <ExternalLink size={16} />

//           Open Document
//         </button>
//       </div>
//     );
//   };

//   // ============================================================
//   // Loading
//   // ============================================================

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   // ============================================================
//   // Error
//   // ============================================================

//   if (error || !sanction) {
//     return (
//       <div className="space-y-4">
//         <button
//           type="button"
//           onClick={() =>
//             navigate("/sanctions")
//           }
//           className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600"
//         >
//           <ArrowLeft size={17} />

//           Back to Sanctions
//         </button>

//         <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-6 text-red-700 dark:text-red-400">
//           {error ||
//             "Sanction not found."}
//         </div>
//       </div>
//     );
//   }

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
//           <button
//             type="button"
//             onClick={() =>
//               navigate("/sanctions")
//             }
//             className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-3"
//           >
//             <ArrowLeft size={17} />

//             Back to Sanctions
//           </button>

//           <div className="flex flex-wrap items-center gap-3">
//             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
//               {sanction.sanctionNumber}
//             </h1>

//             {isComplete ? (
//               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
//                 <CheckCircle2
//                   size={14}
//                 />

//                 Complete
//               </span>
//             ) : (
//               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
//                 <Clock size={14} />

//                 Incomplete
//               </span>
//             )}
//           </div>

//           <p className="text-sm text-slate-500 mt-1">
//             Sanction details and documents
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={() =>
//               setShowEditForm(true)
//             }
//             className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
//           >
//             <Edit size={17} />

//             Edit
//           </button>

//           {String(user?.role).toLowerCase() ===
//             "admin" && (
//             <button
//               type="button"
//               onClick={handleDelete}
//               disabled={deleting}
//               className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
//             >
//               {deleting ? (
//                 <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
//               ) : (
//                 <Trash2 size={17} />
//               )}

//               Delete
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ======================================================
//           Information
//       ====================================================== */}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Sanction information */}
//         <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
//           <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
//             <h2 className="font-semibold text-slate-900 dark:text-white">
//               Sanction Information
//             </h2>
//           </div>

//           <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
//             <InfoItem
//               icon={<Hash size={17} />}
//               label="Sanction Number"
//               value={
//                 sanction.sanctionNumber
//               }
//             />

//             <InfoItem
//               icon={<Calendar size={17} />}
//               label="Sanction Date"
//               value={formatDate(
//                 sanction.sanctionDate
//               )}
//             />

//             <InfoItem
//               icon={<User size={17} />}
//               label="Customer / Company"
//               value={
//                 sanction.customerName
//               }
//             />

//             <InfoItem
//               icon={<Hash size={17} />}
//               label="Reference Number"
//               value={
//                 sanction.referenceNumber ||
//                 "-"
//               }
//             />

//             <InfoItem
//               icon={
//                 <IndianRupee size={17} />
//               }
//               label="Amount"
//               value={formatAmount(
//                 sanction.amount
//               )}
//             />

//             <InfoItem
//               icon={<Receipt size={17} />}
//               label="Invoice Number"
//               value={
//                 sanction.invoiceNumber ||
//                 "-"
//               }
//             />
//           </div>

//           {sanction.remarks && (
//             <div className="px-5 pb-5">
//               <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
//                 <p className="text-xs font-medium text-slate-500 uppercase mb-2">
//                   Remarks
//                 </p>

//                 <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
//                   {sanction.remarks}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Created information */}
//         <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
//           <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
//             <h2 className="font-semibold text-slate-900 dark:text-white">
//               Record Information
//             </h2>
//           </div>

//           <div className="p-5 space-y-5">
//             <InfoItem
//               icon={<User size={17} />}
//               label="Created By"
//               value={
//                 sanction.createdBy
//                   ?.name ||
//                 sanction.createdBy
//                   ?.username ||
//                 "-"
//               }
//             />

//             <InfoItem
//               icon={<Calendar size={17} />}
//               label="Created At"
//               value={formatDate(
//                 sanction.createdAt
//               )}
//             />

//             <InfoItem
//               icon={<Calendar size={17} />}
//               label="Last Updated"
//               value={formatDate(
//                 sanction.updatedAt
//               )}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ======================================================
//           Documents
//       ====================================================== */}

//       <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
//         <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="font-semibold text-slate-900 dark:text-white">
//                 Documents
//               </h2>

//               <p className="text-sm text-slate-500 mt-1">
//                 Three required sanction documents
//               </p>
//             </div>

//             {isComplete ? (
//               <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
//                 <CheckCircle2
//                   size={16}
//                 />

//                 All documents uploaded
//               </span>
//             ) : (
//               <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
//                 <Clock size={16} />

//                 Documents incomplete
//               </span>
//             )}
//           </div>
//         </div>

//         <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
//           <DocumentCard
//             title="Sanction Document"
//             document={
//               sanction.sanctionDocument
//             }
//           />

//           <DocumentCard
//             title="K2 Document"
//             document={
//               sanction.k2Document
//             }
//           />

//           <DocumentCard
//             title="Invoice Document"
//             document={
//               sanction.invoiceDocument
//             }
//           />
//         </div>
//       </div>

//       {/* ======================================================
//           Edit form
//       ====================================================== */}

//       <SanctionForm
//         isOpen={showEditForm}
//         onClose={() =>
//           setShowEditForm(false)
//         }
//         sanction={sanction}
//         onSaved={handleUpdated}
//       />
//     </div>
//   );
// }

// // ============================================================
// // Information item
// // ============================================================

// function InfoItem({
//   icon,
//   label,
//   value,
// }) {
//   return (
//     <div className="flex items-start gap-3">
//       <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
//         {icon}
//       </div>

//       <div className="min-w-0">
//         <p className="text-xs text-slate-500 uppercase tracking-wide">
//           {label}
//         </p>

//         <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 break-words">
//           {value}
//         </p>
//       </div>
//     </div>
//   );
// }

// export default SanctionDetail;