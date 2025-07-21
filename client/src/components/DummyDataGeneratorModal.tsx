import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DummyDataGeneratorModalProps {
  children: React.ReactNode;
}

export function DummyDataGeneratorModal({ children }: DummyDataGeneratorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const generateComprehensiveDummyData = async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      console.log("🎯 Starting comprehensive dummy data generation...");
      
      const response = await fetch("/api/auth/generate-comprehensive-dummy-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate dummy data");
      }

      const result = await response.json();
      console.log("✅ Dummy data generation successful:", result);

      setIsSuccess(true);
      toast({
        variant: "default",
        title: "Data Contoh Berhasil Dibuat!",
        description: "Sistem telah membuat struktur goals, key results, initiatives, dan tasks yang lengkap untuk Anda.",
      });

      // Auto close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        // Refresh page to show new data
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("❌ Error generating dummy data:", error);
      toast({
        variant: "destructive",
        title: "Gagal Membuat Data Contoh",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat data contoh. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-orange-500" />
            Generate Data Contoh Lengkap
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-4">
            {!isLoading && !isSuccess && (
              <>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Sistem akan membuat:
                  </h3>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 text-left">
                    <li>• 1 Parent Goal (Tim Perusahaan) - Contoh</li>
                    <li>• 4 Child Goals (Marketing, Sales, Operation, Personal) - Contoh</li>
                    <li>• Key Results untuk setiap goal</li>
                    <li>• Initiatives lengkap dengan success metrics & DoD</li>
                    <li>• Tasks dengan berbagai status</li>
                    <li>• Timeline entries dan check-ins</li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Data contoh ini akan membantu Anda memahami cara menggunakan sistem OKR dengan lengkap.
                </p>
              </>
            )}

            {isLoading && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-orange-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Sedang membuat data contoh...</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sistem sedang menyiapkan goals, initiatives, tasks, dan timeline yang lengkap untuk Anda.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-green-700 dark:text-green-400 mb-2">
                    Data Contoh Berhasil Dibuat!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Semua struktur OKR lengkap telah berhasil dibuat. Halaman akan refresh otomatis...
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isLoading && !isSuccess && (
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button onClick={generateComprehensiveDummyData} className="bg-orange-500 hover:bg-orange-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Data Contoh
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}