import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TestToast() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    console.log('Triggering success toast with variant: success');
    const toastData = {
      title: "✅ SUCCESS - Berhasil!",
      description: "Toast ini harus berwarna hijau dengan border hijau gelap",
      variant: "success" as const,
    };
    console.log('Toast data being passed:', toastData);
    toast(toastData);
  };

  const showDefaultToast = () => {
    const toastData = {
      title: "📋 DEFAULT - Informasi",
      description: "Toast ini harus berwarna putih (default)",
    };
    console.log('Default toast data:', toastData);
    toast(toastData);
  };

  const showDestructiveToast = () => {
    const toastData = {
      title: "❌ ERROR - Gagal!",
      description: "Toast ini harus berwarna merah (destructive)",
      variant: "destructive" as const,
    };
    console.log('Destructive toast data:', toastData);
    toast(toastData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Test Toast Colors</h1>
      
      <div className="flex gap-4">
        <Button 
          onClick={showSuccessToast}
          className="bg-green-600 hover:bg-green-700"
        >
          Test Success Toast (Hijau)
        </Button>
        
        <Button 
          onClick={showDefaultToast}
          variant="secondary"
        >
          Test Default Toast (Putih)
        </Button>
        
        <Button 
          onClick={showDestructiveToast}
          variant="destructive"
        >
          Test Destructive Toast (Merah)
        </Button>
      </div>
      
      <div className="mt-8 text-center text-gray-600">
        <p>Klik tombol di atas untuk test warna toast yang berbeda</p>
        <p>Toast success harus berwarna hijau dengan border hijau gelap</p>
        <p className="mt-2 text-sm text-gray-500">
          Buka Developer Console (F12) untuk melihat debug logs
        </p>
      </div>
    </div>
  );
}