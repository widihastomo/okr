import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Target, 
  TrendingUp,
  Star,
  X
} from "lucide-react";

interface CheckInData {
  keyResultId: string;
  value: string;
  notes: string;
  confidence: number;
}

export default function DailyCheckInButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInData>({
    keyResultId: '',
    value: '',
    notes: '',
    confidence: 7
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch key results for selection
  const { data: keyResults = [] } = useQuery({
    queryKey: ["/api/key-results"],
    enabled: isOpen,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: CheckInData) => {
      const response = await apiRequest("POST", "/api/check-ins", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-in berhasil",
        description: "Progress telah diperbarui dan ditambahkan ke timeline.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      setIsOpen(false);
      setCheckInData({
        keyResultId: '',
        value: '',
        notes: '',
        confidence: 7
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat check-in",
        description: error.message || "Terjadi kesalahan saat menyimpan check-in.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!checkInData.keyResultId || !checkInData.value || !checkInData.notes) {
      toast({
        title: "Form tidak lengkap",
        description: "Mohon lengkapi semua field yang diperlukan.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(checkInData);
  };

  const selectedKeyResult = keyResults.find((kr: any) => kr.id === checkInData.keyResultId);

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 8) return 'Sangat Yakin';
    if (confidence >= 6) return 'Cukup Yakin';
    return 'Kurang Yakin';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600';
    if (confidence >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Daily Check-in
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Daily Check-in</h2>
              <p className="text-gray-600 mt-1">Update progress harian untuk key result</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Result Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Pilih Key Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={checkInData.keyResultId}
                onValueChange={(value) => setCheckInData({ ...checkInData, keyResultId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih key result yang ingin diupdate" />
                </SelectTrigger>
                <SelectContent>
                  {keyResults.map((kr: any) => (
                    <SelectItem key={kr.id} value={kr.id}>
                      {kr.title} ({kr.currentValue || 0} / {kr.targetValue || 0} {kr.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedKeyResult && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Current:</strong> {selectedKeyResult.currentValue || 0} {selectedKeyResult.unit}
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>Target:</strong> {selectedKeyResult.targetValue || 0} {selectedKeyResult.unit}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Value */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Nilai Progress Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nilai Terbaru {selectedKeyResult ? `(${selectedKeyResult.unit})` : ''}
                </label>
                <input
                  type="number"
                  value={checkInData.value}
                  onChange={(e) => setCheckInData({ ...checkInData, value: e.target.value })}
                  placeholder="Masukkan nilai progress terbaru"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Catatan Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={checkInData.notes}
                onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
                placeholder="Jelaskan progress, pencapaian, atau tantangan yang dihadapi..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Confidence Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Tingkat Keyakinan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Seberapa yakin Anda dengan progress ini?</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(checkInData.confidence)}`}>
                    {getConfidenceText(checkInData.confidence)} ({checkInData.confidence}/10)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={checkInData.confidence}
                  onChange={(e) => setCheckInData({ ...checkInData, confidence: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 (Sangat Tidak Yakin)</span>
                  <span>10 (Sangat Yakin)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitMutation.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {submitMutation.isPending ? 'Menyimpan...' : 'Simpan Check-in'}
          </Button>
        </div>
      </div>
    </div>
  );
}