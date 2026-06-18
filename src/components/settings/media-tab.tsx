"use client";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import { useUploadQueue } from "@/hooks/use-upload-queue";
import { BusinessMediaApi } from "@/services/api/business-media-api"; // Adjust import path if needed
import type { IBusinessMediaItem } from "@/types/business-types";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Ensure toast is imported
import CustomizationModal from "./customization-modal";
import SingleMediaCustomizationModal from "./single-media-customization-modal";

export default function MediaTab() {
  // Primary UI state
  const [editMode, setEditMode] = useState(false);
  const [isCustomizationOpen, setCustomizationOpen] = useState(false);
  const [editingCustomization, setEditingCustomization] = useState<{
    id?: string;
    type?: "color_theme" | "slogan" | "tags";
    value?: string;
  } | null>(null);
  const [isGalleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  // Confirmation dialogs
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReplaceItem, setConfirmReplaceItem] = useState<{
    existingId: string;
    type: "video" | "flyer";
    newFile?: File;
  } | null>(null);

  // API: fetch and mutations
  const { data: mediaData, isLoading: isLoadingMedia } =
    BusinessMediaApi.useGetBusinessMedia();
  const { mutateAsync: uploadMediaAsync, isPending: isUploading } =
    BusinessMediaApi.useUploadBusinessMedia();
  const { mutate: deleteMedia, isPending: isDeleting } =
    BusinessMediaApi.useDeleteBusinessMedia();

  // wire upload queue hook to the API upload function
  const { uploadQueue, enqueueMultipleFiles, enqueueAndUpload } =
    useUploadQueue({ uploadFn: async (form) => await uploadMediaAsync(form) });

  // use galleryStartIndex to focus the clicked image when opening the gallery
  useEffect(() => {
    if (!isGalleryOpen) return;
    setTimeout(() => {
      const el = document.querySelector(
        `[data-gallery-index="${galleryStartIndex}"]`,
      ) as HTMLElement | null;
      if (el)
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
    }, 50);
  }, [isGalleryOpen, galleryStartIndex]);

  // Derived lists
  const mediaItems: IBusinessMediaItem[] = mediaData?.data || [];
  const customizationItems = mediaItems.filter((m) =>
    ["color_theme", "slogan", "tags"].includes((m.type || "").toString()),
  );
  const imageItems = mediaItems.filter(
    (m) => (m.type || "").toString().toLowerCase() === "image",
  );
  const videoItems = mediaItems.filter(
    (m) => (m.type || "").toString().toLowerCase() === "video",
  );
  const flyerItems = mediaItems.filter(
    (m) => (m.type || "").toString().toLowerCase() === "flyer",
  );

  // Helpers
  const openCustomization = (item?: {
    id?: string;
    type?: string | null;
    value?: string | null;
  }) => {
    if (item) {
      const t =
        item.type &&
        ["color_theme", "slogan", "tags"].includes(String(item.type))
          ? (item.type as "color_theme" | "slogan" | "tags")
          : "color_theme";
      setEditingCustomization({
        id: item.id,
        type: t,
        value: item.value || "",
      });
    } else {
      setEditingCustomization(null);
    }
    setCustomizationOpen(true);
  };
  const closeCustomization = () => {
    setCustomizationOpen(false);
    setEditingCustomization(null);
  };

  // new modal state
  const [modalMode, setModalMode] = useState<
    "image" | "video" | "flyer" | "custom"
  >("image");
  const [isSingleModalOpen, setSingleModalOpen] = useState(false);

  const openSingleModal = (mode: "image" | "video" | "flyer" | "custom") => {
    setModalMode(mode);
    setSingleModalOpen(true);
  };
  const closeSingleModal = () => setSingleModalOpen(false);

  // onSubmit for modal
  const handleModalSubmit = async ({
    files,
    file,
    type,
    value,
  }: {
    files?: File[] | null;
    file?: File | null;
    type: "image" | "video" | "flyer" | "custom";
    value?: string | null;
  }) => {
    if (type === "custom") {
      if (!value) return;
      const [t, v] = String(value).split("::");
      const form = new FormData();
      form.append("type", t);
      form.append("value", v);
      try {
        await uploadMediaAsync(form);
        toast.success("Customization added");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add customization");
      }
      return;
    }

    if (type === "image") {
      if (!files || files.length === 0) return;
      await enqueueMultipleFiles(files, "image");
      return;
    }

    if (type === "flyer") {
      if (!files || files.length === 0) return;
      await enqueueMultipleFiles(files, "flyer");
      return;
    }

    if (file) {
      await enqueueAndUpload(file, type);
    }
  };

  // Delete flow
  const requestDelete = (id: string) => setConfirmDeleteId(id);
  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    deleteMedia(confirmDeleteId);
    setConfirmDeleteId(null);
  };
  const cancelDelete = () => setConfirmDeleteId(null);

  // Replace flow
  const confirmReplace = () => {
    if (!confirmReplaceItem) return;
    (async () => {
      if (!confirmReplaceItem) return;
      const res = await enqueueAndUpload(
        confirmReplaceItem.newFile || null,
        confirmReplaceItem.type,
      );
      if (res?.success && confirmReplaceItem.existingId) {
        deleteMedia(confirmReplaceItem.existingId);
      }
    })();
    setConfirmReplaceItem(null);
  };
  const cancelReplace = () => setConfirmReplaceItem(null);

  // Replace the tabbed UI with a single page layout
  return (
    <section>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            Media & Customizations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Media management (Images & videos)
          </p>
        </div>
      </div>

      {/* Images Section - show up to 3 images, last tile shows +N */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Images</h3>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => openSingleModal("image")}
              disabled={isUploading || isDeleting}
            >
              Add image(s)
            </Button>
            <Button
              size="sm"
              variant={editMode ? "outline" : "default"}
              onClick={() => setEditMode((v) => !v)}
              disabled={isUploading || isDeleting}
            >
              {editMode ? "Disable editing" : "Enable editing"}
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          High-quality photos of your business. Recommended min 1200px. Max
          10MB.
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          {isLoadingMedia ? (
            // skeleton placeholders
            <>
              <div className="col-span-3 grid grid-cols-3 md:grid-cols-1 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 bg-gray-200 animate-pulse rounded-md"
                  />
                ))}
              </div>
            </>
          ) : imageItems.length === 0 ? (
            <div className="col-span-3 text-center text-muted-foreground p-8 border rounded">
              No images yet.
            </div>
          ) : (
            (() => {
              const show = 5;
              const first = imageItems.slice(0, show);
              const remaining = Math.max(0, imageItems.length - show);
              return (
                <>
                  {first.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="relative rounded overflow-hidden bg-muted h-40 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        setGalleryStartIndex(idx);
                        setGalleryOpen(true);
                      }}
                    >
                      <Image
                        src={m.url || `/placeholder.svg?text=Image${idx + 1}`}
                        alt={m.value || `Image ${idx + 1}`}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                      {editMode && (
                        <div className="absolute top-2 right-2">
                          <button
                            aria-label="Delete image"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(m.id);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-sm text-red-600 shadow"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9.75 3.5a1 1 0 00-.97.757L8.5 5H5.25a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5H15.5l-.28-.743A1 1 0 0014.25 3.5h-4.5zM6.5 7.5a.75.75 0 00-.75.75v9.5A2.75 2.75 0 008.5 20.5h7a2.75 2.75 0 002.75-2.75v-9.5a.75.75 0 00-.75-.75h-11zM10 10a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6zm3.5 0a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {remaining > 0 && (
                    <div
                      className="relative rounded overflow-hidden bg-muted h-40 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        setGalleryStartIndex(show);
                        setGalleryOpen(true);
                      }}
                    >
                      <Image
                        src={
                          imageItems[show]?.url || `/placeholder.svg?text=More`
                        }
                        alt={`+${remaining}`}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xl font-semibold">
                        +{remaining}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>
      </div>

      {/* Video Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Video</h3>
          <div>
            {videoItems.length === 0 ? (
              <Button
                size="sm"
                onClick={() => openSingleModal("video")}
                disabled={isUploading || isDeleting}
              >
                Add video
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  videoItems[0]?.id && requestDelete(videoItems[0].id)
                }
                disabled={isUploading || isDeleting}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          One 60-second video showcasing your offerings. MP4 recommended.
        </div>
        <div>
          {videoItems.length === 0 ? (
            <div className="text-muted-foreground">No video uploaded yet.</div>
          ) : (
            <div className="aspect-video rounded overflow-hidden">
              <video
                src={videoItems[0].url || ""}
                controls
                className="w-full h-auto size-28  aspect-video object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Branded Filters Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Branded Filters</h3>
          <div>
            {flyerItems.length === 0 ? (
              <Button
                size="sm"
                onClick={() => openSingleModal("flyer")}
                disabled={isUploading || isDeleting}
              >
                Add filters
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  // delete all branded filters
                  flyerItems.forEach((f) => {
                    if (f.id) deleteMedia(f.id);
                  });
                }}
                disabled={isUploading || isDeleting}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          Upload branded filters/overlays. Up to 5 files, 10MB each.
        </div>
        <div>
          {flyerItems.length === 0 ? (
            <div className="text-muted-foreground">No branded filters yet.</div>
          ) : (
            <div className="w-full rounded overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-2">
              {flyerItems.slice(0, 5).map((f, i) => (
                <div key={f.id || i} className="p-1 bg-gray-50 rounded">
                  {f.url ? (
                    <Image
                      src={f.url}
                      alt={`Filter ${i + 1}`}
                      width={300}
                      height={200}
                      className="object-contain w-full h-28"
                    />
                  ) : (
                    <a href={f.url || "#"} target="_blank" rel="noreferrer">
                      Open filter
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customizations list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Customizations</h3>
          <div>
            <Button
              size="sm"
              onClick={() => openSingleModal("custom")}
              disabled={isUploading || isDeleting}
            >
              Add customization
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          Add brand color theme, slogan, or tags.
        </div>
        {customizationItems.length === 0 ? (
          <div className="text-muted-foreground">No customizations yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {customizationItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  {item.type === "color_theme" ? (
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ background: item.value || "#fff" }}
                    />
                  ) : (
                    <div className="px-2 py-1 border rounded text-sm">
                      {item.type}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{item.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.value || item.url || "-"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openCustomization(item)}
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => requestDelete(item.id)}
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload progress modal */}
      {(() => {
        const overallProgress =
          uploadQueue.length > 0
            ? Math.round(
                uploadQueue.reduce((sum, q) => sum + q.progress, 0) /
                  uploadQueue.length,
              )
            : 0;
        const uploadingCount = uploadQueue.filter(
          (q) => q.status === "uploading",
        ).length;
        const fileName =
          uploadQueue[0]?.file?.name ||
          `${uploadingCount} file${uploadingCount !== 1 ? "s" : ""}`;
        const message =
          uploadingCount > 1
            ? `Uploading ${uploadingCount} files...`
            : "Uploading your file...";

        return (
          <UploadProgressModal
            open={uploadQueue.length > 0}
            progress={overallProgress}
            fileName={fileName}
            message={message}
          />
        );
      })()}

      {/* Confirm dialogs (use shared ConfirmDeleteDialog) */}
      <ConfirmDeleteDialog
        open={!!confirmDeleteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete media"
        description="Are you sure you want to delete this media? This action cannot be undone."
        confirmText="Delete"
      />
      <ConfirmDeleteDialog
        open={!!confirmReplaceItem}
        onClose={cancelReplace}
        onConfirm={confirmReplace}
        title="Replace media"
        description="Replace existing media with the selected file? The existing item will be removed after successful upload."
        confirmText="Replace"
      />

      {/* Single media modal for add actions */}
      <SingleMediaCustomizationModal
        isOpen={isSingleModalOpen}
        onClose={closeSingleModal}
        mode={modalMode}
        onSubmit={handleModalSubmit}
        initialValue={""}
      />

      {/* Existing customization modal for editing */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={closeCustomization}
        defaultType={
          (editingCustomization?.type as "color_theme" | "slogan" | "tags") ||
          undefined
        }
        initialValue={editingCustomization?.value || ""}
      />

      {/* Gallery modal for viewing all images */}
      <Dialog open={isGalleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Images</h4>
            <div>
              <Button variant="ghost" onClick={() => setGalleryOpen(false)}>
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid sm:grid-cols-2 grid-cols-4 gap-3">
              {imageItems.map((m, i) => (
                <div
                  key={m.id || i}
                  data-gallery-index={i}
                  className="relative aspect-square rounded overflow-hidden bg-muted"
                >
                  <Image
                    src={m.url || `/placeholder.svg?text=Image${i + 1}`}
                    alt={m.value || `Image ${i + 1}`}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                  />
                  {editMode && (
                    <div className="absolute top-2 right-2">
                      <button
                        aria-label={`Delete image ${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(m.id);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-sm text-red-600 shadow"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.75 3.5a1 1 0 00-.97.757L8.5 5H5.25a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5H15.5l-.28-.743A1 1 0 0014.25 3.5h-4.5zM6.5 7.5a.75.75 0 00-.75.75v9.5A2.75 2.75 0 008.5 20.5h7a2.75 2.75 0 002.75-2.75v-9.5a.75.75 0 00-.75-.75h-11zM10 10a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6zm3.5 0a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
