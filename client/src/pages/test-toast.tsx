import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TestToast() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "Test Success Toast",
      description: "Ini adalah toast success dengan warna hijau",
      variant: "success",
    });
  };

  const showDefaultToast = () => {
    toast({
      title: "Test Default Toast",
      description: "Ini adalah toast default dengan warna putih",
    });
  };

  const showDestructiveToast = () => {
    toast({
      title: "Test Destructive Toast",  
      description: "Ini adalah toast destructive dengan warna merah",
      variant: "destructive",
    });
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
      </div>
    </div>
  );
}