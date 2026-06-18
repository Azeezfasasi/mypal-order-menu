// Fixed components/dialogs/MenuItemDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { FineDiningMenuItem } from "../offerings/fine-dinings-offerings/menu-section";
import {
  MenuItemForm,
  MenuItemFormValues,
} from "../offerings/forms/MenuItemForm";

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: (data: MenuItemFormValues, files: File[] | null) => void;
  defaultValues?: MenuItemFormValues;
  filePreview: string[] | null;
  onFilePreviewChange: (previews: string[] | null) => void;
  isSubmitting?: boolean;
  submitLabel: string;
  fileInputId: string;
  currentItem?: FineDiningMenuItem | null;
}

export function MenuItemDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  defaultValues,
  filePreview,
  onFilePreviewChange,
  isSubmitting = false,
  submitLabel,
  fileInputId,
  currentItem,
}: MenuItemDialogProps) {
  // State to track current file
  const [currentFiles, setCurrentFiles] = useState<File[] | null>(null);

  // State for error alert visibility and message
  const [errorAlert, setErrorAlert] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: "",
    visible: false,
  });

  // State to track if file upload is empty for validation context
  // Initialize based on whether an existing item with a file/image URL is being edited
  const [isFileUploadEmpty, setIsFileUploadEmpty] = useState(
    !(
      currentItem &&
      (currentItem.type === "Image" || currentItem.type === "PDF")
    ),
  );

  // Determine file type based on available information
  // fileType is not used, so remove it

  // Handle cancel button click
  const handleCancel = () => {
    onOpenChange(false);
  };

  // Initialize dialog state when it opens or currentItem changes
  useEffect(() => {
    console.log("MenuItemDialog useEffect [open, currentItem] triggered");
    if (open) {
      // If editing an existing item
      if (currentItem) {
        console.log("Editing existing item:", currentItem);
        if (currentItem.type === "Image" && currentItem.menu_url) {
          // For image items, set the preview directly to the URL
          console.log(
            "Setting image preview from currentItem URL:",
            currentItem.menu_url,
          );
          onFilePreviewChange([currentItem.menu_url]);
          setIsFileUploadEmpty(false); // File upload is not empty as there's a preview
        } else if (currentItem.type === "PDF" && currentItem.menu_url) {
          // For PDF items, set the special "pdf" indicator
          console.log(
            "Setting PDF preview placeholder from currentItem URL:",
            currentItem.menu_url,
          );
          onFilePreviewChange(["pdf"]);
          setIsFileUploadEmpty(false); // File upload is not empty as there's a preview
        } else if (currentItem.type === "URL" && currentItem.menu_url) {
          // For URL items, don't set a preview (will show in URL field)
          console.log("currentItem is URL type, clearing file preview.");
          onFilePreviewChange(null);
          setIsFileUploadEmpty(true); // File upload is empty as it's a URL item
        } else {
          // Handle cases where currentItem exists but type/url is unexpected
          console.warn(
            "currentItem exists but type or url is unexpected:",
            currentItem,
          );
          onFilePreviewChange(null);
          setIsFileUploadEmpty(true);
        }
        // Ensure currentFile is null when opening for editing
        setCurrentFiles(null);
      } else {
        // For new items, start with clean state
        console.log("Opening for new item, resetting state.");
        setCurrentFiles(null);
        setIsFileUploadEmpty(true);
        onFilePreviewChange(null);
      }
    } else {
      // Clean up when dialog closes
      console.log("Dialog closing, resetting state.");
      setCurrentFiles(null);
      onFilePreviewChange(null); // Clear preview on close
      setIsFileUploadEmpty(true); // Reset file upload status on close
    }
  }, [open, currentItem, onFilePreviewChange]); // Depend on open and currentItem

  // Update isFileUploadEmpty whenever filePreview or currentFiles changes
  // This effect is important to keep the validation context up-to-date
  useEffect(() => {
    setIsFileUploadEmpty(
      (!currentFiles || currentFiles.length === 0) &&
        (!filePreview || filePreview.length === 0),
    );
  }, [filePreview, currentFiles]);

  // Handle file changes from FileUploader
  const handleFileChange = (files: File[] | null) => {
    setCurrentFiles(files);
    if (files && files.length > 0) {
      // Only support one file for now
      const file = files[0];
      if (file.type === "application/pdf") {
        onFilePreviewChange(["pdf"]);
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          onFilePreviewChange([reader.result as string]);
        };
        reader.onerror = () => {
          setCurrentFiles(null);
          onFilePreviewChange(null);
          showErrorAlert("Failed to read selected file. Please try again.");
        };
        reader.readAsDataURL(file);
      } else {
        setCurrentFiles(null);
        onFilePreviewChange(null);
        showErrorAlert(
          "Unsupported file type selected. Please choose an image or PDF file.",
        );
      }
    } else {
      // File was cleared
      if (currentItem && currentItem.menu_url) {
        if (currentItem.type === "Image") {
          onFilePreviewChange([currentItem.menu_url]);
        } else if (currentItem.type === "PDF") {
          onFilePreviewChange(["pdf"]);
        } else {
          onFilePreviewChange(null);
        }
      } else {
        onFilePreviewChange(null);
      }
    }
  };

  // Show error alert function
  const showErrorAlert = (message: string) => {
    setErrorAlert({ message, visible: true });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setErrorAlert({ message: "", visible: false });
    }, 4000);
  };

  // Handle form submission
  const handleSubmit = (data: MenuItemFormValues) => {
    try {
      // The validation refinement in MenuItemForm ensures either URL or file is present (but not both)
      // We pass the currentFiles to the parent onSubmit if no URL is provided
      if (data.menu_url && data.menu_url.trim() !== "") {
        onSubmit(data, null); // Submit with URL, no file
      } else {
        onSubmit(data, currentFiles); // Submit with file(s), no URL
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      showErrorAlert(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md  max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Error Alert */}
        {errorAlert.visible && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorAlert.message}</AlertDescription>
          </Alert>
        )}

        <MenuItemForm
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          filePreview={filePreview}
          onFileChange={handleFileChange}
          onFilePreviewChange={onFilePreviewChange}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          submitLabel={submitLabel}
          fileInputId={fileInputId}
          isFileUploadEmpty={isFileUploadEmpty}
          currentItem={currentItem}
        />
      </DialogContent>
    </Dialog>
  );
}
