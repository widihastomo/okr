import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface CascadeDeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  objectiveTitle: string;
  keyResultsCount: number;
  initiativesCount: number;
  tasksCount: number;
}

export function CascadeDeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  objectiveTitle,
  keyResultsCount,
  initiativesCount,
  tasksCount,
}: CascadeDeleteConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-red-900">
                Hapus Goal dan Semua Data Terkait?
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="space-y-4">
          <p className="text-gray-600">
            Anda akan menghapus goal <strong>"{objectiveTitle}"</strong> beserta semua data terkait:
          </p>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">Data yang akan dihapus:</h4>
            <ul className="space-y-1 text-sm text-red-800">
              <li>• {keyResultsCount} Ukuran Keberhasilan dan semua check-in progress</li>
              <li>• {initiativesCount} Rencana beserta semua member dan dokumen</li>
              <li>• {tasksCount} Tugas dan semua aktivitas terkait</li>
            </ul>
          </div>
          
          <p className="text-red-600 font-medium">
            ⚠️ Tindakan ini tidak dapat dibatalkan!
          </p>
        </AlertDialogDescription>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="flex-1">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Ya, Hapus Semua
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}