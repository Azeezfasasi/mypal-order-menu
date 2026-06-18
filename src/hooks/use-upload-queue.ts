import { useEffect, useRef, useState } from "react";

export type MediaType = "image" | "video" | "flyer" | "custom";

export type QueueItem = {
  id: string;
  file?: File;
  type: MediaType;
  previewUrl?: string;
  status: "queued" | "uploading" | "success" | "error";
  progress: number;
  serverId?: string;
  error?: string | null;
};

type UploadProgressEvent = { loaded: number; total: number };

type UploadFn = (
  form: FormData,
  onUploadProgress?: (progressEvent: UploadProgressEvent) => void,
) => Promise<unknown>;

export function useUploadQueue(opts: { uploadFn: UploadFn }) {
  const { uploadFn } = opts;
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const progressIntervals = useRef<Record<string, number>>({});

  // Helper to generate temp ids
  const genId = () =>
    `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Create preview URL (object URL for non-image, data url for image is handled by consumers)
  const makePreviewIfNeeded = (file: File) => {
    try {
      if (file.type.startsWith("image/")) {
        // consumers may already create dataURL previews; fall back to object URL
        return URL.createObjectURL(file);
      }
      if (file.type.startsWith("video/")) {
        return URL.createObjectURL(file);
      }
      // for pdf and others return placeholder string; consumers may treat 'pdf'
      return "file";
    } catch {
      return undefined;
    }
  };

  const clearPreviewIfBlob = (url?: string) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  // remove queue item(s)
  const removeQueueItems = (ids: string[]) => {
    setUploadQueue((s) => s.filter((it) => !ids.includes(it.id)));
  };

  // internal: start simulated progress until upload finishes
  const startSimulatedProgress = (id: string) => {
    // avoid double intervals
    if (progressIntervals.current[id]) return;
    const interval = window.setInterval(() => {
      setUploadQueue((s) =>
        s.map((it) => {
          if (it.id !== id || it.status !== "uploading") return it;
          const next = Math.min(
            90,
            it.progress + Math.floor(Math.random() * 15) + 5,
          );
          return { ...it, progress: next };
        }),
      );
    }, 500);
    progressIntervals.current[id] = interval;
  };

  const stopSimulatedProgress = (id: string) => {
    const iv = progressIntervals.current[id];
    if (iv) {
      clearInterval(iv);
      delete progressIntervals.current[id];
    }
  };

  // Upload multiple files in one request. Creates optimistic queue items and returns when done
  const enqueueMultipleFiles = async (
    files: File[],
    type: MediaType = "image",
  ) => {
    if (!files || files.length === 0) return;

    const tempItems: QueueItem[] = files.map((f) => {
      const id = genId();
      const previewUrl = makePreviewIfNeeded(f);
      return {
        id,
        file: f,
        type,
        previewUrl,
        status: "uploading",
        progress: 5,
      };
    });

    setUploadQueue((s) => [...tempItems, ...s]);

    // start simulated progress per item
    tempItems.forEach((t) => startSimulatedProgress(t.id));

    const form = new FormData();
    for (const f of files) form.append("files", f);
    form.append("type", type);

    // Precompute sizes for mapping overall progress to per-file progress
    const sizes = files.map((f) => f.size);
    const totalBytes = sizes.reduce((a, b) => a + b, 0) || undefined;

    try {
      await uploadFn(form, (ev) => {
        // Map overall loaded bytes to per-file progress if we have sizes
        if (!totalBytes || totalBytes <= 0) return;
        const loaded = ev.loaded;

        // compute per-file progress
        let acc = 0;
        const perFileProgress = tempItems.map((t, idx) => {
          const size = sizes[idx] || 0;
          const start = acc;
          const end = acc + size;
          acc = end;
          if (size === 0) return 0;
          if (loaded >= end) return 100;
          if (loaded <= start) return 0;
          const inFile = loaded - start;
          return Math.min(100, Math.round((inFile / size) * 100));
        });

        // update queue items with mapped progress
        setUploadQueue((s) =>
          s.map((it) => {
            const idx = tempItems.findIndex((t) => t.id === it.id);
            if (idx === -1) return it;
            return {
              ...it,
              status: "uploading",
              progress: perFileProgress[idx],
            };
          }),
        );
      });

      // mark success for all temp items
      setUploadQueue((s) =>
        s.map((it) =>
          tempItems.find((t) => t.id === it.id)
            ? { ...it, status: "success", progress: 100 }
            : it,
        ),
      );

      // stop simulated progress and remove items after short delay
      tempItems.forEach((t) => {
        stopSimulatedProgress(t.id);
      });
      setTimeout(() => removeQueueItems(tempItems.map((t) => t.id)), 900);

      // revoke previews
      tempItems.forEach((t) => clearPreviewIfBlob(t.previewUrl));
    } catch (err) {
      // stop intervals
      tempItems.forEach((t) => stopSimulatedProgress(t.id));

      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadQueue((s) =>
        s.map((it) =>
          tempItems.find((t) => t.id === it.id)
            ? { ...it, status: "error", error: message }
            : it,
        ),
      );
    }
  };

  const enqueueAndUpload = async (
    file: File | null,
    type: MediaType = "image",
  ) => {
    if (!file) return;
    const id = genId();
    const previewUrl = makePreviewIfNeeded(file);
    const item: QueueItem = {
      id,
      file,
      type,
      previewUrl,
      status: "queued",
      progress: 0,
    };

    setUploadQueue((s) => [item, ...s]);

    // small delay to flip to uploading state
    setTimeout(
      () =>
        setUploadQueue((s) =>
          s.map((it) =>
            it.id === id ? { ...it, status: "uploading", progress: 5 } : it,
          ),
        ),
      50,
    );

    startSimulatedProgress(id);

    const form = new FormData();
    form.append("files", file);
    form.append("type", type);

    try {
      await uploadFn(form, undefined);
      stopSimulatedProgress(id);
      setUploadQueue((s) =>
        s.map((it) =>
          it.id === id ? { ...it, status: "success", progress: 100 } : it,
        ),
      );
      setTimeout(() => removeQueueItems([id]), 900);
      clearPreviewIfBlob(previewUrl);

      return { success: true };
    } catch (err) {
      stopSimulatedProgress(id);
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadQueue((s) =>
        s.map((it) =>
          it.id === id ? { ...it, status: "error", error: message } : it,
        ),
      );
      return { success: false, error: message };
    }
  };

  // cleanup on unmount
  useEffect(() => {
    const ivsSnapshot = progressIntervals.current;
    return () => {
      Object.keys(ivsSnapshot).forEach((k) => {
        clearInterval(ivsSnapshot[k]);
      });
      // revoke any preview blob urls
      uploadQueue.forEach((q) => {
        if (q.previewUrl && q.previewUrl.startsWith("blob:"))
          URL.revokeObjectURL(q.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    uploadQueue,
    enqueueMultipleFiles,
    enqueueAndUpload,
    removeQueueItems,
    setUploadQueue,
  } as const;
}
