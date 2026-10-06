import { useEffect, useState } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  FileText,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import API from "../../axios/axios";

const DOCUMENT_SLOTS = [
  {
    type: "SANCTION_PDF",
    label: "Sanction Document",
    description:
      "Upload sanction document as image or PDF.",
  },
  {
    type: "K2_AGREEMENT",
    label: "K2 Document",
    description:
      "Upload K2 document as image or PDF.",
  },
  {
    type: "INVOICE",
    label: "Invoice Document",
    description:
      "Upload invoice as image or PDF.",
  },
];

function getFileFromSanction(
  sanction,
  documentType
) {
  const documents =
    sanction?.documents || [];

  return documents.find(
    (doc) =>
      doc.documentType === documentType
  );
}

function getSanctionId(sanction) {
  return sanction?._id || sanction?.id;
}

export default function SanctionForm({
  mode = "add",
  initialSanction = null,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();

  const [sanctionNumber, setSanctionNumber] =
    useState("");

  const [sanctionDate, setSanctionDate] =
    useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  const [invoiceNumber, setInvoiceNumber] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  /*
   * Each document slot:
   *
   * SANCTION_PDF
   * K2_AGREEMENT
   * INVOICE
   *
   * value:
   * {
   *   file: File,
   *   existing: existing document
   * }
   */
  const [documents, setDocuments] =
    useState({
      SANCTION_PDF: null,
      K2_AGREEMENT: null,
      INVOICE: null,
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [uploadingDocument, setUploadingDocument] =
    useState(false);

  const [error, setError] =
    useState("");

  const [uploadProgressText, setUploadProgressText] =
    useState("");

  useEffect(() => {
    if (!initialSanction) {
      setSanctionNumber("");
      setSanctionDate(
        new Date()
          .toISOString()
          .slice(0, 10)
      );
      setCustomerName("");
      setReferenceNumber("");
      setInvoiceNumber("");
      setAmount("");
      setRemarks("");

      setDocuments({
        SANCTION_PDF: null,
        K2_AGREEMENT: null,
        INVOICE: null,
      });

      return;
    }

    setSanctionNumber(
      initialSanction.sanctionNumber || ""
    );

    setSanctionDate(
      initialSanction.sanctionDate
        ? String(
            initialSanction.sanctionDate
          ).slice(0, 10)
        : new Date()
            .toISOString()
            .slice(0, 10)
    );

    setCustomerName(
      initialSanction.customerName || ""
    );

    setReferenceNumber(
      initialSanction.referenceNumber || ""
    );

    setInvoiceNumber(
      initialSanction.invoiceNumber || ""
    );

    setAmount(
      initialSanction.amount != null
        ? String(initialSanction.amount)
        : ""
    );

    setRemarks(
      initialSanction.remarks || ""
    );

    setDocuments({
      SANCTION_PDF:
        getFileFromSanction(
          initialSanction,
          "SANCTION_PDF"
        ) || null,

      K2_AGREEMENT:
        getFileFromSanction(
          initialSanction,
          "K2_AGREEMENT"
        ) || null,

      INVOICE:
        getFileFromSanction(
          initialSanction,
          "INVOICE"
        ) || null,
    });
  }, [initialSanction]);

  /*
   * Check image/PDF
   */
  const isAllowedFile = (file) => {
    if (!file) return false;

    return (
      file.type === "application/pdf" ||
      file.type.startsWith("image/")
    );
  };

  /*
   * File selection
   */
  const handleFileChange = (
    documentType,
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!isAllowedFile(file)) {
      setError(
        "Only image or PDF files are allowed."
      );

      event.target.value = "";
      return;
    }

    /*
     * Optional frontend size protection.
     * Change this if your backend allows larger files.
     */
    const maxSize =
      20 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "File size must be less than 20 MB."
      );

      event.target.value = "";
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [documentType]: {
        file,
        existing: null,
      },
    }));
  };

  /*
   * Remove selected/replacement file
   */
  const removeDocument = (
    documentType
  ) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: null,
    }));
  };

  /*
   * Validation
   */
  const validateForm = () => {
    if (!sanctionNumber.trim()) {
      return "Please enter Sanction Number.";
    }

    if (!sanctionDate) {
      return "Please select Sanction Date.";
    }

    if (!customerName.trim()) {
      return "Please enter Customer / Company Name.";
    }

    if (!referenceNumber.trim()) {
      return "Please enter Customer Reference Number.";
    }

    if (
      amount === "" ||
      Number(amount) < 0
    ) {
      return "Please enter a valid sanction amount.";
    }

    /*
     * On ADD:
     * all 3 files are required.
     *
     * On EDIT:
     * existing document is enough.
     * User only needs to select a new file
     * if they want to replace it.
     */
    if (mode === "add") {
      if (!documents.SANCTION_PDF?.file) {
        return "Please upload the Sanction Document.";
      }

      if (!documents.K2_AGREEMENT?.file) {
        return "Please upload the K2 Document.";
      }

      if (!documents.INVOICE?.file) {
        return "Please upload the Invoice Document.";
      }
    }

    return null;
  };

  /*
   * Create sanction first.
   */
  const createSanction = async () => {
    const response = await API.post(
      "/sanction",
      {
        sanctionNumber:
          sanctionNumber.trim(),

        sanctionDate,

        customerName:
          customerName.trim(),

        referenceNumber:
          referenceNumber.trim(),

        invoiceNumber:
          invoiceNumber.trim(),

        amount:
          Number(amount) || 0,

        remarks:
          remarks.trim(),

        createdBy:
          user?._id || user?.id,

        createdByName:
          user?.name || "User",
      }
    );

    return (
      response.data?.sanction ||
      response.data
    );
  };

  /*
   * Update sanction.
   */
  const updateSanction = async () => {
    const sanctionId =
      getSanctionId(
        initialSanction
      );

    const response = await API.patch(
      `/sanction/${sanctionId}`,
      {
        sanctionNumber:
          sanctionNumber.trim(),

        sanctionDate,

        customerName:
          customerName.trim(),

        referenceNumber:
          referenceNumber.trim(),

        invoiceNumber:
          invoiceNumber.trim(),

        amount:
          Number(amount) || 0,

        remarks:
          remarks.trim(),
      }
    );

    return (
      response.data?.sanction ||
      response.data
    );
  };

  /*
   * Upload ONE document.
   *
   * Important:
   * We are NOT converting the file to base64.
   *
   * The actual File object is sent through
   * multipart/form-data.
   */
  const uploadDocument = async (
    sanctionId,
    documentType,
    file
  ) => {
    if (!file) return null;

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "sanctionId",
      sanctionId
    );

    formData.append(
      "documentType",
      documentType
    );

    formData.append(
      "fileName",
      file.name
    );

    formData.append(
      "invoiceNumber",
      invoiceNumber.trim()
    );

    formData.append(
      "uploadedBy",
      user?._id || user?.id || ""
    );

    formData.append(
      "uploadedByName",
      user?.name || "User"
    );

    const response =
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

    return response.data;
  };

  /*
   * Submit
   */
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setUploadProgressText("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    try {
      setSubmitting(true);

      let savedSanction;

      /*
       * STEP 1
       * Create/update sanction
       */
      if (mode === "add") {
        savedSanction =
          await createSanction();
      } else {
        savedSanction =
          await updateSanction();
      }

      const sanctionId =
        getSanctionId(
          savedSanction ||
            initialSanction
        );

      if (!sanctionId) {
        throw new Error(
          "Sanction ID was not returned by the server."
        );
      }

      /*
       * STEP 2
       * Upload selected documents.
       *
       * In ADD mode:
       * all three will have a file.
       *
       * In EDIT mode:
       * only newly selected files are uploaded.
       */
      const uploadList =
        DOCUMENT_SLOTS.filter(
          (slot) =>
            documents[
              slot.type
            ]?.file
        );

      if (uploadList.length > 0) {
        setUploadingDocument(true);

        for (
          let i = 0;
          i < uploadList.length;
          i++
        ) {
          const slot =
            uploadList[i];

          setUploadProgressText(
            `Uploading ${slot.label} (${i + 1}/${uploadList.length})...`
          );

          await uploadDocument(
            sanctionId,
            slot.type,
            documents[
              slot.type
            ].file
          );
        }
      }

      setUploadProgressText(
        ""
      );

      /*
       * Let parent refresh/update
       */
      onSaved?.(
        savedSanction ||
          initialSanction
      );
    } catch (err) {
      console.error(
        "Failed to save sanction:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save sanction."
      );
    } finally {
      setSubmitting(false);
      setUploadingDocument(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === "add"
                ? "Add Sanction"
                : `Edit Sanction (${
                    initialSanction?.sanctionNumber ||
                    ""
                  })`}
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "add"
                ? `Automatically records Created By (${
                    user?.name || "User"
                  }) & Created Date.`
                : "Update sanction details and replace documents if required."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[82vh] overflow-y-auto"
        >
          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Sanction Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Sanction Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sanction Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sanction Number{" "}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={
                    sanctionNumber
                  }
                  onChange={(e) =>
                    setSanctionNumber(
                      e.target.value
                    )
                  }
                  placeholder="e.g. SAN-006"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sanction Date{" "}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  required
                  value={
                    sanctionDate
                  }
                  onChange={(e) =>
                    setSanctionDate(
                      e.target.value
                    )
                  }
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer / Company Name{" "}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={
                    customerName
                  }
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. ABC Ltd"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Reference Number{" "}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  value={
                    referenceNumber
                  }
                  onChange={(e) =>
                    setReferenceNumber(
                      e.target.value
                    )
                  }
                  placeholder="e.g. REF-ABC-2026-009"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sanction Amount (₹){" "}
                  <span className="text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 500000"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invoice Number
                </label>

                <input
                  type="text"
                  value={
                    invoiceNumber
                  }
                  onChange={(e) =>
                    setInvoiceNumber(
                      e.target.value
                    )
                  }
                  placeholder="e.g. INV-2026-950"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Remarks */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks
                </label>

                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(
                      e.target.value
                    )
                  }
                  placeholder="Enter sanction terms, notes, or remarks..."
                  className="w-full p-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="border-t border-slate-200 pt-5">
            <div className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Documents
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
                Upload the three required documents.
                Each document can be an{" "}
                <strong className="text-slate-700">
                  image or PDF
                </strong>
                .
              </p>
            </div>

            <div className="space-y-3">
              {DOCUMENT_SLOTS.map(
                (slot) => {
                  const selected =
                    documents[
                      slot.type
                    ];

                  const existing =
                    selected &&
                    !selected.file
                      ? selected
                      : null;

                  const file =
                    selected?.file;

                  return (
                    <div
                      key={
                        slot.type
                      }
                      className={`p-3.5 rounded-lg border transition-colors ${
                        file || existing
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          {file ? (
                            file.type.startsWith(
                              "image/"
                            ) ? (
                              <ImageIcon className="w-4 h-4 text-emerald-600 mt-0.5" />
                            ) : (
                              <FileText className="w-4 h-4 text-emerald-600 mt-0.5" />
                            )
                          ) : (
                            <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                          )}

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-800">
                                {slot.label}
                              </span>

                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                                Required
                              </span>

                              {(file ||
                                existing) && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Ready
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {
                                slot.description
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Existing document */}
                      {existing && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/60">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className="text-xs font-mono text-emerald-900 truncate"
                                title={
                                  existing.fileName
                                }
                              >
                                Current:{" "}
                                {
                                  existing.fileName
                                }
                              </p>

                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Select a new file
                                below to replace
                                it.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Selected new file */}
                      {file && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/60">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className="text-xs font-mono text-emerald-900 truncate"
                                title={
                                  file.name
                                }
                              >
                                {file.name}
                              </p>

                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {Math.round(
                                  file.size /
                                    1024
                                )}{" "}
                                KB •{" "}
                                {file.type ||
                                  "Unknown"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeDocument(
                                  slot.type
                                )
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 rounded shrink-0"
                              title="Remove selected file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Upload button */}
                      <div className="flex items-center gap-2 mt-3">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-colors">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />

                          <span>
                            {file
                              ? "CHANGE FILE"
                              : existing
                              ? "REPLACE FILE"
                              : "UPLOAD"}
                          </span>

                          <input
                            type="file"
                            accept="image/*,.pdf,application/pdf"
                            className="hidden"
                            onChange={(
                              e
                            ) =>
                              handleFileChange(
                                slot.type,
                                e
                              )
                            }
                          />
                        </label>

                        <span className="text-[11px] text-slate-400">
                          Image / PDF
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgressText && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
              {uploadProgressText}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting
                ? uploadingDocument
                  ? "UPLOADING..."
                  : mode === "add"
                  ? "SAVING..."
                  : "UPDATING..."
                : mode === "add"
                ? "SAVE SANCTION"
                : "UPDATE SANCTION"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import {
//   X,
//   Upload,
//   FileText,
//   Image as ImageIcon,
//   CheckCircle2,
//   Trash2,
// } from "lucide-react";
// import API from "../../axios/axios";

// const emptyForm = {
//   sanctionNumber: "",
//   sanctionDate: "",
//   customerName: "",
//   referenceNumber: "",
//   amount: "",
//   invoiceNumber: "",
//   remarks: "",
// };

// function SanctionForm({ isOpen, onClose, sanction = null, onSaved }) {
//   const [formData, setFormData] = useState(emptyForm);

//   const [sanctionDocument, setSanctionDocument] = useState(null);
//   const [k2Document, setK2Document] = useState(null);
//   const [invoiceDocument, setInvoiceDocument] = useState(null);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const isEditMode = Boolean(sanction);

//   // ============================================================
//   // Load existing sanction when editing
//   // ============================================================

//   useEffect(() => {
//     if (!isOpen) return;

//     setError("");

//     if (sanction) {
//       setFormData({
//         sanctionNumber: sanction.sanctionNumber || "",
//         sanctionDate: sanction.sanctionDate
//           ? new Date(sanction.sanctionDate)
//               .toISOString()
//               .split("T")[0]
//           : "",
//         customerName: sanction.customerName || "",
//         referenceNumber: sanction.referenceNumber || "",
//         amount: sanction.amount ?? "",
//         invoiceNumber: sanction.invoiceNumber || "",
//         remarks: sanction.remarks || "",
//       });

//       setSanctionDocument(null);
//       setK2Document(null);
//       setInvoiceDocument(null);
//     } else {
//       setFormData(emptyForm);
//       setSanctionDocument(null);
//       setK2Document(null);
//       setInvoiceDocument(null);
//     }
//   }, [isOpen, sanction]);

//   // ============================================================
//   // Input change
//   // ============================================================

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   // ============================================================
//   // File validation
//   // Image + PDF allowed
//   // ============================================================

//   const validateFile = (file) => {
//     if (!file) return false;

//     const allowedTypes = [
//       "application/pdf",
//       "image/jpeg",
//       "image/jpg",
//       "image/png",
//       "image/webp",
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       setError(
//         "Only PDF, JPG, PNG and WEBP files are allowed."
//       );
//       return false;
//     }

//     // Optional 10 MB frontend limit
//     const maxSize = 10 * 1024 * 1024;

//     if (file.size > maxSize) {
//       setError("File size must be less than 10 MB.");
//       return false;
//     }

//     setError("");

//     return true;
//   };

//   // ============================================================
//   // File handlers
//   // ============================================================

//   const handleSanctionDocument = (e) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     if (validateFile(file)) {
//       setSanctionDocument(file);
//     }

//     e.target.value = "";
//   };

//   const handleK2Document = (e) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     if (validateFile(file)) {
//       setK2Document(file);
//     }

//     e.target.value = "";
//   };

//   const handleInvoiceDocument = (e) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     if (validateFile(file)) {
//       setInvoiceDocument(file);
//     }

//     e.target.value = "";
//   };

//   // ============================================================
//   // Remove newly selected file
//   // ============================================================

//   const removeSanctionDocument = () => {
//     setSanctionDocument(null);
//   };

//   const removeK2Document = () => {
//     setK2Document(null);
//   };

//   const removeInvoiceDocument = () => {
//     setInvoiceDocument(null);
//   };

//   // ============================================================
//   // Submit
//   // ============================================================

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setError("");

//     // ----------------------------------------------------------
//     // Basic validation
//     // ----------------------------------------------------------

//     if (!formData.sanctionNumber.trim()) {
//       setError("Sanction number is required.");
//       return;
//     }

//     if (!formData.sanctionDate) {
//       setError("Sanction date is required.");
//       return;
//     }

//     if (!formData.customerName.trim()) {
//       setError("Customer name is required.");
//       return;
//     }

//     if (
//       formData.amount === "" ||
//       formData.amount === null ||
//       formData.amount === undefined
//     ) {
//       setError("Amount is required.");
//       return;
//     }

//     // ----------------------------------------------------------
//     // Create FormData
//     // ----------------------------------------------------------

//     const data = new FormData();

//     data.append(
//       "sanctionNumber",
//       formData.sanctionNumber
//     );

//     data.append(
//       "sanctionDate",
//       formData.sanctionDate
//     );

//     data.append(
//       "customerName",
//       formData.customerName
//     );

//     data.append(
//       "referenceNumber",
//       formData.referenceNumber
//     );

//     data.append(
//       "amount",
//       formData.amount
//     );

//     data.append(
//       "invoiceNumber",
//       formData.invoiceNumber
//     );

//     data.append(
//       "remarks",
//       formData.remarks
//     );

//     // ----------------------------------------------------------
//     // Documents
//     //
//     // IMPORTANT:
//     // These names MUST exactly match your backend:
//     //
//     // sanctionDocument
//     // k2Document
//     // invoiceDocument
//     // ----------------------------------------------------------

//     if (sanctionDocument) {
//       data.append(
//         "sanctionDocument",
//         sanctionDocument
//       );
//     }

//     if (k2Document) {
//       data.append(
//         "k2Document",
//         k2Document
//       );
//     }

//     if (invoiceDocument) {
//       data.append(
//         "invoiceDocument",
//         invoiceDocument
//       );
//     }

//     try {
//       setLoading(true);

//       let response;

//       // --------------------------------------------------------
//       // ADD
//       // --------------------------------------------------------

//       if (!isEditMode) {
//         response = await API.post(
//           "/sanction",
//           data,
//           {
//             headers: {
//               "Content-Type":
//                 "multipart/form-data",
//             },
//           }
//         );
//       }

//       // --------------------------------------------------------
//       // UPDATE
//       // --------------------------------------------------------

//       else {
//         response = await API.put(
//           `/sanction/${sanction._id}`,
//           data,
//           {
//             headers: {
//               "Content-Type":
//                 "multipart/form-data",
//             },
//           }
//         );
//       }

//       // --------------------------------------------------------
//       // Success
//       // --------------------------------------------------------

//       if (response.data?.success) {
//         onSaved?.(response.data.sanction);

//         onClose?.();
//       } else {
//         setError(
//           response.data?.message ||
//             "Something went wrong."
//         );
//       }
//     } catch (err) {
//       console.error(
//         "Sanction save error:",
//         err
//       );

//       setError(
//         err?.response?.data?.message ||
//           "Failed to save sanction."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) {
//     return null;
//   }

//   // ============================================================
//   // Existing document helper
//   // ============================================================

//   const existingSanctionDocument =
//     sanction?.sanctionDocument;

//   const existingK2Document =
//     sanction?.k2Document;

//   const existingInvoiceDocument =
//     sanction?.invoiceDocument;

//   // ============================================================
//   // Document component
//   // ============================================================

//   const DocumentUploadBox = ({
//     title,
//     existingDocument,
//     selectedFile,
//     onFileChange,
//     onRemove,
//     required = true,
//   }) => {
//     return (
//       <div className="space-y-2">
//         <div className="flex items-center justify-between">
//           <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
//             {title}

//             {required && (
//               <span className="ml-1 text-red-500">
//                 *
//               </span>
//             )}
//           </label>

//           {existingDocument && !selectedFile && (
//             <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
//               <CheckCircle2 size={14} />
//               Uploaded
//             </span>
//           )}
//         </div>

//         <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
//           {/* New selected file */}
//           {selectedFile ? (
//             <div className="flex items-center justify-between gap-3">
//               <div className="flex items-center gap-3 min-w-0">
//                 {selectedFile.type ===
//                 "application/pdf" ? (
//                   <FileText
//                     size={24}
//                     className="text-red-500 shrink-0"
//                   />
//                 ) : (
//                   <ImageIcon
//                     size={24}
//                     className="text-blue-500 shrink-0"
//                   />
//                 )}

//                 <div className="min-w-0">
//                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
//                     {selectedFile.name}
//                   </p>

//                   <p className="text-xs text-slate-500">
//                     {(
//                       selectedFile.size /
//                       1024 /
//                       1024
//                     ).toFixed(2)}{" "}
//                     MB
//                   </p>
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={onRemove}
//                 className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
//               >
//                 <Trash2 size={17} />
//               </button>
//             </div>
//           ) : existingDocument ? (
//             <div className="flex items-center justify-between gap-3">
//               <div className="flex items-center gap-3 min-w-0">
//                 {existingDocument.fileType ===
//                 "pdf" ? (
//                   <FileText
//                     size={24}
//                     className="text-red-500 shrink-0"
//                   />
//                 ) : (
//                   <ImageIcon
//                     size={24}
//                     className="text-blue-500 shrink-0"
//                   />
//                 )}

//                 <div className="min-w-0">
//                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
//                     Existing document
//                   </p>

//                   <p className="text-xs text-slate-500">
//                     Upload a new file to replace it.
//                   </p>
//                 </div>
//               </div>

//               <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
//                 <Upload size={16} />

//                 Replace

//                 <input
//                   type="file"
//                   hidden
//                   accept="application/pdf,image/jpeg,image/png,image/webp"
//                   onChange={onFileChange}
//                 />
//               </label>
//             </div>
//           ) : (
//             <label className="cursor-pointer flex flex-col items-center justify-center py-4 text-center">
//               <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-2">
//                 <Upload
//                   size={20}
//                   className="text-slate-500"
//                 />
//               </div>

//               <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
//                 Click to upload
//               </p>

//               <p className="text-xs text-slate-500 mt-1">
//                 PDF, JPG, PNG or WEBP
//               </p>

//               <input
//                 type="file"
//                 hidden
//                 accept="application/pdf,image/jpeg,image/png,image/webp"
//                 onChange={onFileChange}
//               />
//             </label>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // ============================================================
//   // UI
//   // ============================================================

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Overlay */}
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-950 shadow-2xl border border-slate-200 dark:border-slate-800">
//         {/* Header */}
//         <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
//           <div>
//             <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
//               {isEditMode
//                 ? "Edit Sanction"
//                 : "Create Sanction"}
//             </h2>

//             <p className="text-sm text-slate-500 mt-1">
//               {isEditMode
//                 ? "Update sanction information and documents"
//                 : "Add a new sanction with required documents"}
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {/* Form */}
//         <form
//           onSubmit={handleSubmit}
//           className="p-6 space-y-6"
//         >
//           {/* Error */}
//           {error && (
//             <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
//               {error}
//             </div>
//           )}

//           {/* ==================================================
//               Sanction Information
//           ================================================== */}

//           <div>
//             <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
//               Sanction Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Sanction Number */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                   Sanction Number
//                   <span className="text-red-500 ml-1">
//                     *
//                   </span>
//                 </label>

//                 <input
//                   type="text"
//                   name="sanctionNumber"
//                   value={formData.sanctionNumber}
//                   onChange={handleChange}
//                   placeholder="Enter sanction number"
//                   className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Date */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                   Sanction Date
//                   <span className="text-red-500 ml-1">
//                     *
//                   </span>
//                 </label>

//                 <input
//                   type="date"
//                   name="sanctionDate"
//                   value={formData.sanctionDate}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Customer */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                   Customer / Company Name
//                   <span className="text-red-500 ml-1">
//                     *
//                   </span>
//                 </label>

//                 <input
//                   type="text"
//                   name="customerName"
//                   value={formData.customerName}
//                   onChange={handleChange}
//                   placeholder="Enter customer name"
//                   className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Reference */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                   Reference Number
//                 </label>

//                 <input
//                   type="text"
//                   name="referenceNumber"
//                   value={formData.referenceNumber}
//                   onChange={handleChange}
//                   placeholder="Enter reference number"
//                   className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Amount */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                   Amount
//                   <span className="text-red-500 ml-1">
//                     *
//                   </span>
//                 </label>

//                 <input
//                   type="number"
//                   name="amount"
//                   value={formData.amount}
//                   onChange={handleChange}
//                   placeholder="Enter amount"
//                   min="0"
//                   step="0.01"
//                   className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Invoice */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                   Invoice Number
//                 </label>

//                 <input
//                   type="text"
//                   name="invoiceNumber"
//                   value={formData.invoiceNumber}
//                   onChange={handleChange}
//                   placeholder="Enter invoice number"
//                   className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//             </div>

//             {/* Remarks */}
//             <div className="mt-4">
//               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
//                 Remarks
//               </label>

//               <textarea
//                 name="remarks"
//                 value={formData.remarks}
//                 onChange={handleChange}
//                 rows={3}
//                 placeholder="Enter remarks"
//                 className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
//               />
//             </div>
//           </div>

//           {/* ==================================================
//               Documents
//           ================================================== */}

//           <div>
//             <div className="mb-4">
//               <h3 className="text-base font-semibold text-slate-900 dark:text-white">
//                 Required Documents
//               </h3>

//               <p className="text-sm text-slate-500 mt-1">
//                 Upload PDF or image files for each document.
//               </p>
//             </div>

//             <div className="grid grid-cols-1 gap-4">
//               <DocumentUploadBox
//                 title="Sanction Document"
//                 existingDocument={
//                   existingSanctionDocument
//                 }
//                 selectedFile={sanctionDocument}
//                 onFileChange={
//                   handleSanctionDocument
//                 }
//                 onRemove={
//                   removeSanctionDocument
//                 }
//               />

//               <DocumentUploadBox
//                 title="K2 Document"
//                 existingDocument={
//                   existingK2Document
//                 }
//                 selectedFile={k2Document}
//                 onFileChange={handleK2Document}
//                 onRemove={removeK2Document}
//               />

//               <DocumentUploadBox
//                 title="Invoice Document"
//                 existingDocument={
//                   existingInvoiceDocument
//                 }
//                 selectedFile={invoiceDocument}
//                 onFileChange={
//                   handleInvoiceDocument
//                 }
//                 onRemove={
//                   removeInvoiceDocument
//                 }
//               />
//             </div>
//           </div>

//           {/* ==================================================
//               Buttons
//           ================================================== */}

//           <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={loading}
//               className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={loading}
//               className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 size={18} />

//                   {isEditMode
//                     ? "Update Sanction"
//                     : "Create Sanction"}
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default SanctionForm;