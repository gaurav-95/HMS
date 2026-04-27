import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType?: string;
  isSuperAdmin?: boolean;
  onPermanentDelete?: () => void;
  isPending?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  entityName,
  entityType = "record",
  isSuperAdmin = false,
  onPermanentDelete,
  isPending = false,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {entityType}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{entityName}</strong>? This will deactivate the {entityType} and it can be restored later.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
          {isSuperAdmin && onPermanentDelete && (
            <Button
              type="button"
              variant="destructive"
              className="bg-red-900 hover:bg-red-950"
              onClick={onPermanentDelete}
              disabled={isPending}
            >
              Permanently Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
