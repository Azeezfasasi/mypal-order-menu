import { IEvent } from "@/types/event-types";

export interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: IEvent;
  onSuccess: () => void;
}
