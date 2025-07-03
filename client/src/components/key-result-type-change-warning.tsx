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

interface KeyResultTypeChangeWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentType: string;
  newType: string;
  checkInCount: number;
}

export function KeyResultTypeChangeWarning({
  open,
  onOpenChange,
  onConfirm,
  currentType,
  newType,
  checkInCount,
}: KeyResultTypeChangeWarningProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Naik ke (Increase To)";
      case "decrease_to":
        return "Turun ke (Decrease To)";
      case "should_stay_above":
        return "Harus tetap di atas (Stay Above)";
      case "should_stay_below":
        return "Harus tetap di bawah (Stay Below)";
      case "achieve_or_not":
        return "Ya/Tidak (Achieve or Not)";
      default:
        return type;
    }
  };

  const getWarningMessage = () => {
    if (checkInCount === 0) {
      return "Tidak ada update progress yang akan terpengaruh.";
    }

    const isChangingToBinary = newType === "achieve_or_not" || newType === "should_stay_above" || newType === "should_stay_below";
    const isChangingFromBinary = currentType === "achieve_or_not" || currentType === "should_stay_above" || currentType === "should_stay_below";

    if (isChangingToBinary && !isChangingFromBinary) {
      return `Terdapat ${checkInCount} update progress yang akan dikonversi. Nilai numerik akan diubah menjadi status pencapaian berdasarkan perbandingan dengan target.`;
    }

    if (!isChangingToBinary && isChangingFromBinary) {
      return `Terdapat ${checkInCount} update progress yang akan dikonversi. Status pencapaian akan diubah menjadi nilai numerik berdasarkan target yang ditentukan.`;
    }

    return `Terdapat ${checkInCount} update progress yang akan dihitung ulang dengan formula baru.`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Konfirmasi Perubahan Tipe
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              Anda akan mengubah tipe dari <strong>{getTypeLabel(currentType)}</strong> ke{" "}
              <strong>{getTypeLabel(newType)}</strong>.
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">
                {getWarningMessage()}
              </p>
            </div>

            {checkInCount > 0 && (
              <div className="text-sm text-gray-600">
                <strong>Dampak perubahan:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Progress percentage akan dihitung ulang dengan formula baru</li>
                  <li>Data historis akan tetap tersimpan namun interpretasinya berubah</li>
                  <li>Chart dan laporan akan menampilkan progress berdasarkan tipe baru</li>
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Lanjutkan Perubahan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}