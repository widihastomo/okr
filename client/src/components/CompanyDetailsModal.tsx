import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, MapPin, Briefcase, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CompanyDetailsModalProps {
  open: boolean;
  onComplete: () => void;
}

export function CompanyDetailsModal({ open, onComplete }: CompanyDetailsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyAddress: "",
    province: "",
    city: "",
    industryType: "",
    position: "",
    referralSource: "",
  });

  const provinces = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi",
    "Bengkulu", "Sumatera Selatan", "Bangka Belitung", "Lampung", "DKI Jakarta",
    "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
    "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
    "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
    "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan",
    "Sulawesi Tenggara", "Maluku", "Maluku Utara", "Papua Barat", "Papua", "Papua Tengah",
    "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"
  ];

  const industryTypes = [
    "Teknologi Informasi", "Manufaktur", "Perdagangan", "Jasa Keuangan", "Pendidikan",
    "Kesehatan", "Konstruksi", "Transportasi", "Perhotelan & Pariwisata", "Media & Komunikasi",
    "Energi & Pertambangan", "Pertanian", "Real Estate", "Konsultan", "Pemerintahan",
    "Non-Profit", "E-commerce", "Startup", "FMCG", "Otomotif", "Farmasi",
    "Telekomunikasi", "Logistik", "Perbankan", "Asuransi", "Lainnya"
  ];

  const referralSources = [
    "Google Search", "Media Sosial (Instagram, LinkedIn, Facebook)", "Rekomendasi Teman/Kolega",
    "Event/Webinar", "YouTube", "Blog/Artikel", "Iklan Online", "Word of Mouth",
    "Partnership/Kemitraan", "Cold Email/Sales", "Lainnya"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.companyAddress || !formData.province || !formData.city || 
        !formData.industryType || !formData.position || !formData.referralSource) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save company details to user profile
      await apiRequest("/api/auth/update-company-details", "POST", formData);

      // Mark company details as completed
      localStorage.setItem("company-details-completed", "true");
      
      toast({
        title: "Data berhasil disimpan",
        description: "Informasi perusahaan telah tersimpan",
        variant: "default",
      });

      onComplete();
    } catch (error) {
      toast({
        title: "Gagal menyimpan data",
        description: "Terjadi kesalahan saat menyimpan informasi perusahaan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-orange-500" />
            Lengkapi Profil Perusahaan
          </DialogTitle>
          <DialogDescription>
            Bantu kami mengenal perusahaan Anda lebih baik untuk memberikan pengalaman yang optimal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Address */}
          <div className="space-y-2">
            <Label htmlFor="companyAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Alamat Perusahaan *
            </Label>
            <Textarea
              id="companyAddress"
              placeholder="Masukkan alamat lengkap perusahaan..."
              value={formData.companyAddress}
              onChange={(e) => handleInputChange("companyAddress", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Province and City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">Provinsi *</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => handleInputChange("province", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih provinsi" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota *</Label>
              <Input
                id="city"
                placeholder="Masukkan nama kota"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
          </div>

          {/* Industry Type */}
          <div className="space-y-2">
            <Label htmlFor="industryType" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jenis Industri *
            </Label>
            <Select
              value={formData.industryType}
              onValueChange={(value) => handleInputChange("industryType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis industri" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {industryTypes.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Posisi / Jabatan *
            </Label>
            <Input
              id="position"
              placeholder="Contoh: CEO, Manager, Staff, dll."
              value={formData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
            />
          </div>

          {/* Referral Source */}
          <div className="space-y-2">
            <Label htmlFor="referralSource" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Tahu Refokus dari mana? *
            </Label>
            <Select
              value={formData.referralSource}
              onValueChange={(value) => handleInputChange("referralSource", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih sumber referral" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {referralSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan & Lanjutkan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}