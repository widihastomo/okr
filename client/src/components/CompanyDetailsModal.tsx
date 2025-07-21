import React, { useState, useEffect } from "react";
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
import { Building2, MapPin, Briefcase, Users, Search, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SimpleSelect } from "@/components/SimpleSelect";
import { useQuery } from "@tanstack/react-query";

interface CompanyDetailsModalProps {
  open: boolean;
  onComplete: () => void;
}

export function CompanyDetailsModal({ open, onComplete }: CompanyDetailsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    province: "",
    city: "",
    industryType: "",
    position: "",
    referralSource: "",
  });

  // Fetch user data with organization info
  const { data: userData } = useQuery({
    queryKey: ['/api/my-organization-with-role'],
    enabled: open,
  });

  // Auto-fill company name and existing company details when modal opens
  useEffect(() => {
    if (userData && open) {
      const org = userData as any;
      setFormData(prev => ({
        ...prev,
        companyName: org.organization?.name || "",
        // Pre-fill other fields if they exist in user data
        companyAddress: org.user?.companyAddress || "",
        province: org.user?.province || "",
        city: org.user?.city || "",
        industryType: org.user?.industryType || "",
        position: org.user?.position || "",
        referralSource: org.user?.referralSource || "",
      }));
    }
  }, [userData, open]);

  // State untuk mengontrol combobox open/close


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

  // Data kota per provinsi (sample utama)
  const citiesByProvince: Record<string, string[]> = {
    "DKI Jakarta": ["Kota Jakarta Barat", "Kota Jakarta Pusat", "Kota Jakarta Selatan", "Kota Jakarta Timur", "Kota Jakarta Utara", "Kabupaten Kepulauan Seribu"],
    "Jawa Barat": ["Kota Bandung", "Kabupaten Bandung", "Kabupaten Bandung Barat", "Kota Bekasi", "Kabupaten Bekasi", "Kota Bogor", "Kabupaten Bogor", "Kota Cirebon", "Kabupaten Cirebon", "Kota Depok", "Kabupaten Sukabumi", "Kota Sukabumi", "Kota Tasikmalaya", "Kabupaten Tasikmalaya", "Kabupaten Karawang", "Kabupaten Purwakarta", "Kabupaten Subang", "Kabupaten Sumedang", "Kabupaten Indramayu", "Kabupaten Majalengka", "Kabupaten Kuningan", "Kabupaten Ciamis", "Kabupaten Pangandaran", "Kabupaten Garut", "Kabupaten Cianjur", "Kota Banjar", "Kabupaten Ciamis"],
    "Jawa Tengah": ["Kota Semarang", "Kabupaten Semarang", "Kota Surakarta", "Kota Magelang", "Kabupaten Magelang", "Kota Salatiga", "Kota Pekalongan", "Kabupaten Pekalongan", "Kota Tegal", "Kabupaten Tegal", "Kabupaten Kudus", "Kabupaten Purworejo", "Kabupaten Kebumen", "Kabupaten Cilacap", "Kabupaten Banyumas", "Kabupaten Purbalingga", "Kabupaten Banjarnegara", "Kabupaten Wonosobo", "Kabupaten Temanggung", "Kabupaten Kendal", "Kabupaten Demak", "Kabupaten Grobogan", "Kabupaten Blora", "Kabupaten Rembang", "Kabupaten Pati", "Kabupaten Jepara", "Kabupaten Boyolali", "Kabupaten Klaten", "Kabupaten Sukoharjo", "Kabupaten Karanganyar", "Kabupaten Sragen", "Kabupaten Wonogiri", "Kabupaten Brebes", "Kabupaten Batang", "Kabupaten Pemalang"],
    "Jawa Timur": ["Kota Surabaya", "Kota Malang", "Kabupaten Malang", "Kota Kediri", "Kabupaten Kediri", "Kota Blitar", "Kabupaten Blitar", "Kota Madiun", "Kabupaten Madiun", "Kota Pasuruan", "Kabupaten Pasuruan", "Kota Probolinggo", "Kabupaten Probolinggo", "Kota Mojokerto", "Kabupaten Mojokerto", "Kota Batu", "Kabupaten Sidoarjo", "Kabupaten Gresik", "Kabupaten Lamongan", "Kabupaten Bojonegoro", "Kabupaten Tuban", "Kabupaten Jombang", "Kabupaten Nganjuk", "Kabupaten Magetan", "Kabupaten Ngawi", "Kabupaten Pacitan", "Kabupaten Ponorogo", "Kabupaten Trenggalek", "Kabupaten Tulungagung", "Kabupaten Lumajang", "Kabupaten Jember", "Kabupaten Bondowoso", "Kabupaten Situbondo", "Kabupaten Banyuwangi", "Kabupaten Sumenep", "Kabupaten Pamekasan", "Kabupaten Sampang", "Kabupaten Bangkalan"],
    "Banten": ["Kota Tangerang", "Kota Tangerang Selatan", "Kota Serang", "Kota Cilegon", "Kabupaten Tangerang", "Kabupaten Serang", "Kabupaten Lebak", "Kabupaten Pandeglang"],
    "Bali": ["Kota Denpasar", "Kabupaten Badung", "Kabupaten Gianyar", "Kabupaten Tabanan", "Kabupaten Klungkung", "Kabupaten Bangli", "Kabupaten Karangasem", "Kabupaten Buleleng", "Kabupaten Jembrana"],
    "Sumatera Utara": ["Medan", "Binjai", "Tebing Tinggi", "Pematang Siantar", "Tanjung Balai", "Sibolga", "Padang Sidempuan"],
    "Sumatera Barat": ["Padang", "Bukittinggi", "Padang Panjang", "Payakumbuh", "Sawahlunto", "Solok", "Pariaman"],
    "Sumatera Selatan": ["Palembang", "Prabumulih", "Pagar Alam", "Lubuk Linggau", "Lahat", "Muara Enim"],
    "Lampung": ["Bandar Lampung", "Metro", "Lampung Selatan", "Lampung Tengah", "Lampung Utara", "Lampung Timur"],
    "Kalimantan Timur": ["Samarinda", "Balikpapan", "Bontang", "Kutai Kartanegara", "Berau", "Kutai Barat"],
    "Kalimantan Selatan": ["Banjarmasin", "Banjarbaru", "Kotabaru", "Banjar", "Barito Kuala", "Tapin"],
    "Sulawesi Selatan": ["Makassar", "Palopo", "Parepare", "Gowa", "Takalar", "Jeneponto", "Bantaeng"],
    "Papua": ["Jayapura", "Sorong", "Merauke", "Nabire", "Timika", "Biak", "Wamena"]
  };

  // Mendapatkan daftar kota berdasarkan provinsi yang dipilih
  const getAvailableCities = () => {
    if (!formData.province) return [];
    return citiesByProvince[formData.province] || [];
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "province") {
      // Reset kota ketika provinsi berubah
      setFormData(prev => ({ ...prev, [field]: value, city: "" }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.companyName || !formData.companyAddress || !formData.province || !formData.city || 
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
      console.log("🏢 Submitting company details:", formData);
      
      // Save company details to user profile
      const response = await apiRequest("POST", "/api/auth/update-company-details", formData);
      console.log("✅ Company details saved successfully:", response);

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
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-orange-500" />
            Lengkapi Profil Perusahaan
          </DialogTitle>
          <DialogDescription>
            Lengkapi semua informasi di bawah ini untuk melanjutkan. Semua field bertanda (*) wajib diisi dan form tidak dapat ditutup sebelum diselesaikan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nama Perusahaan *
            </Label>
            <Input
              id="companyName"
              placeholder="Masukkan nama perusahaan..."
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="bg-gray-50 border-gray-300"
            />
            
          </div>

          {/* Company Address */}
          <div className="space-y-2">
            <Label htmlFor="companyAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Alamat Perusahaan *
            </Label>
            <Input
              id="companyAddress"
              placeholder="Masukkan alamat lengkap perusahaan..."
              value={formData.companyAddress}
              onChange={(e) => handleInputChange("companyAddress", e.target.value)}
            />
          </div>

          {/* Province and City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">Provinsi *</Label>
              <SimpleSelect
                options={provinces.map(p => ({ value: p, label: p }))}
                value={formData.province}
                placeholder="Pilih provinsi..."
                searchPlaceholder="Cari provinsi..."
                emptyMessage="Provinsi tidak ditemukan."
                onSelect={(value) => handleInputChange("province", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota *</Label>
              <SimpleSelect
                options={getAvailableCities().map(c => ({ value: c, label: c }))}
                value={formData.city}
                placeholder={formData.province ? "Pilih kota..." : "Pilih provinsi dulu"}
                searchPlaceholder="Cari kota..."
                emptyMessage="Kota tidak ditemukan."
                disabled={!formData.province}
                onSelect={(value) => handleInputChange("city", value)}
              />
            </div>
          </div>

          {/* Industry Type */}
          <div className="space-y-2">
            <Label htmlFor="industryType" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jenis Industri *
            </Label>
            <SimpleSelect
              options={industryTypes.map(i => ({ value: i, label: i }))}
              value={formData.industryType}
              placeholder="Pilih jenis industri..."
              searchPlaceholder="Cari industri..."
              emptyMessage="Industri tidak ditemukan."
              onSelect={(value) => handleInputChange("industryType", value)}
            />
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
            <SimpleSelect
              options={referralSources.map(s => ({ value: s, label: s }))}
              value={formData.referralSource}
              placeholder="Pilih sumber referral..."
              searchPlaceholder="Cari sumber referral..."
              emptyMessage="Sumber referral tidak ditemukan."
              onSelect={(value) => handleInputChange("referralSource", value)}
            />
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