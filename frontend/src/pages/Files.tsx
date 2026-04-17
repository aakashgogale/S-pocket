import {
  AlertTriangle,
  FileImage,
  FileText,
  FileType2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { AlertBanner } from "../components/ui/AlertBanner";
import { RiskBadge } from "../components/ui/AppBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/AppCard";
import { useDeleteFile, useMyFiles, useUploadFile } from "../hooks/use-backend";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / BigInt(1_000_000))).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const ALLOWED_EXTENSIONS = ".pdf,.docx,.png,.jpg,.jpeg";

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf") {
    return (
      <div className="w-8 h-8 rounded bg-red-500/15 flex items-center justify-center shrink-0">
        <FileText size={14} className="text-red-400" />
      </div>
    );
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return (
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
        <FileType2 size={14} className="text-primary" />
      </div>
    );
  }
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    return (
      <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
        <FileImage size={14} className="text-emerald-400" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
      <FileText size={14} className="text-muted-foreground" />
    </div>
  );
}

// ── confirm delete dialog ─────────────────────────────────────────────────────

interface ConfirmDeleteDialogProps {
  filename: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function ConfirmDeleteDialog({
  filename,
  onConfirm,
  onCancel,
  isDeleting,
}: ConfirmDeleteDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      data-ocid="files.dialog"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border rounded-lg p-6 w-full max-w-sm mx-4 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">
              Delete file?
            </h3>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              <span className="text-foreground font-medium truncate block max-w-[200px]">
                {filename}
              </span>
              This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-fast"
            aria-label="Cancel"
            data-ocid="files.close_button"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-fast"
            data-ocid="files.cancel_button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 rounded text-sm bg-destructive/90 hover:bg-destructive text-destructive-foreground font-medium transition-fast disabled:opacity-50 flex items-center gap-2"
            data-ocid="files.confirm_button"
          >
            {isDeleting ? (
              <>
                <div className="w-3 h-3 border border-destructive-foreground/50 border-t-transparent rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── upload zone ───────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
  isUploading: boolean;
  progress: number;
}

function UploadZone({ onFile, isUploading, progress }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-ocid="files.dropzone"
      className={[
        "w-full border-2 border-dashed rounded-lg p-10 text-center transition-smooth group",
        isDragging
          ? "border-primary bg-primary/5 shadow-glow-cyan"
          : "border-border hover:border-primary/50 hover:bg-muted/20",
        isUploading ? "pointer-events-none" : "",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        aria-label="Click to browse files"
      >
        <motion.div
          animate={isDragging ? { scale: 1.06 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-smooth"
        >
          <UploadCloud
            size={22}
            className={isDragging ? "text-primary" : "text-primary/70"}
          />
        </motion.div>

        {isUploading ? (
          <>
            <p className="text-foreground font-medium mb-3">Uploading…</p>
            <div className="h-1.5 w-56 mx-auto rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-2">
              {progress}%
            </p>
          </>
        ) : (
          <>
            <p className="text-foreground font-medium mb-1">
              {isDragging
                ? "Drop your file here"
                : "Drag & drop or click to browse"}
            </p>
            <p className="text-muted-foreground text-sm">
              PDF, DOCX, PNG, JPG — max 10 MB
            </p>
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
        data-ocid="files.upload_button"
        aria-hidden
      />
    </div>
  );
}

// ── main page component ───────────────────────────────────────────────────────

function FilesContent() {
  const { data: files = [], isLoading } = useMyFiles();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingDeleteFile = files.find((f) => f.id === pendingDeleteId);

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("File type not allowed. Use PDF, DOCX, PNG, or JPG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds the 10 MB size limit.");
      return;
    }

    try {
      setProgress(30);
      await uploadFile.mutateAsync({ file });
      setProgress(100);
      setUploadSuccess(true);
      setTimeout(() => setProgress(0), 600);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setProgress(0);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteFile.mutateAsync(pendingDeleteId);
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div data-ocid="files.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">
          Vault
        </p>
        <h1 className="text-2xl font-display font-bold text-foreground">
          My Files
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload and manage your encrypted files. Only you can see these.
        </p>
      </motion.div>

      {/* Status banners */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            key="upload-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5"
          >
            <AlertBanner
              variant="error"
              message={uploadError}
              dismissible
              data-ocid="files.upload.error_state"
            />
          </motion.div>
        )}
        {uploadSuccess && (
          <motion.div
            key="upload-success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5"
          >
            <AlertBanner
              variant="success"
              message="File uploaded successfully."
              data-ocid="files.upload.success_state"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <UploadZone
          onFile={handleFile}
          isUploading={uploadFile.isPending}
          progress={progress}
        />
      </motion.div>

      {/* File list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card accent data-ocid="files.list">
          <CardHeader>
            <CardTitle>
              Uploaded Files
              {files.length > 0 && (
                <span className="ml-2 text-xs font-mono text-muted-foreground font-normal">
                  ({files.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3" data-ocid="files.loading_state">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12" data-ocid="files.empty_state">
                <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
                  <UploadCloud
                    size={22}
                    className="text-muted-foreground opacity-50"
                  />
                </div>
                <p className="text-foreground font-medium text-sm mb-1">
                  No files yet
                </p>
                <p className="text-muted-foreground text-xs">
                  Upload your first file using the area above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {files.map((file, i) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group hover:bg-muted/20 -mx-1 px-1 rounded transition-fast"
                    data-ocid={`files.item.${i + 1}`}
                  >
                    <FileTypeIcon mimeType={file.fileType} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate leading-tight">
                        {file.filename}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatBytes(file.size)}
                        <span className="mx-1 opacity-40">·</span>
                        {file.fileType.split("/").pop()?.toUpperCase() ??
                          file.fileType}
                        <span className="mx-1 opacity-40">·</span>
                        {formatDate(file.uploadDate)}
                      </p>
                    </div>

                    <RiskBadge risk={file.riskLevel} className="shrink-0" />

                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(file.id)}
                      data-ocid={`files.delete_button.${i + 1}`}
                      className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-fast opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label={`Delete ${file.filename}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {pendingDeleteId && pendingDeleteFile && (
          <ConfirmDeleteDialog
            filename={pendingDeleteFile.filename}
            onConfirm={handleConfirmDelete}
            onCancel={() => setPendingDeleteId(null)}
            isDeleting={deleteFile.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Files() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <FilesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
