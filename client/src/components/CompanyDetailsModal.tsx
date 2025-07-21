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
import { Building2, MapPin, Briefcase, Users, Search, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

  // State untuk mengontrol combobox open/close
  const [openProvince, setOpenProvince] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openIndustry, setOpenIndustry] = useState(false);
  const [openReferral, setOpenReferral] = useState(false);

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
    "DKI Jakarta": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"],
    "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Karawang", "Purwakarta", "Subang"],
    "Jawa Tengah": ["Semarang", "Surakarta", "Yogyakarta", "Magelang", "Salatiga", "Pekalongan", "Tegal", "Kudus", "Purwokerto"],
    "Jawa Timur": ["Surabaya", "Malang", "Kediri", "Blitar", "Madiun", "Pasuruan", "Probolinggo", "Mojokerto", "Batu", "Sidoarjo"],
    "Banten": ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon", "Lebak", "Pandeglang"],
    "Bali": ["Denpasar", "Badung", "Gianyar", "Tabanan", "Klungkung", "Bangli", "Karangasem", "Buleleng", "Jembrana"],
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
              <Popover open={openProvince} onOpenChange={setOpenProvince}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProvince}
                    className="w-full justify-between"
                  >
                    {formData.province || "Pilih provinsi..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Cari provinsi..." />
                    <CommandList>
                      <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {provinces.map((province) => (
                          <CommandItem
                            key={province}
                            value={province}
                            onSelect={(currentValue) => {
                              handleInputChange("province", currentValue === formData.province ? "" : currentValue);
                              setOpenProvince(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.province === province ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {province}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota *</Label>
              <Popover open={openCity} onOpenChange={setOpenCity}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCity}
                    disabled={!formData.province}
                    className="w-full justify-between"
                  >
                    {formData.city || (formData.province ? "Pilih kota..." : "Pilih provinsi dulu")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Cari kota..." />
                    <CommandList>
                      <CommandEmpty>Kota tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {getAvailableCities().map((city) => (
                          <CommandItem
                            key={city}
                            value={city}
                            onSelect={(currentValue) => {
                              handleInputChange("city", currentValue === formData.city ? "" : currentValue);
                              setOpenCity(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.city === city ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {city}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Industry Type */}
          <div className="space-y-2">
            <Label htmlFor="industryType" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jenis Industri *
            </Label>
            <Popover open={openIndustry} onOpenChange={setOpenIndustry}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openIndustry}
                  className="w-full justify-between"
                >
                  {formData.industryType || "Pilih jenis industri..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Cari industri..." />
                  <CommandList>
                    <CommandEmpty>Industri tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {industryTypes.map((industry) => (
                        <CommandItem
                          key={industry}
                          value={industry}
                          onSelect={(currentValue) => {
                            handleInputChange("industryType", currentValue === formData.industryType ? "" : currentValue);
                            setOpenIndustry(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.industryType === industry ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {industry}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Popover open={openReferral} onOpenChange={setOpenReferral}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openReferral}
                  className="w-full justify-between"
                >
                  {formData.referralSource || "Pilih sumber referral..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Cari sumber referral..." />
                  <CommandList>
                    <CommandEmpty>Sumber referral tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {referralSources.map((source) => (
                        <CommandItem
                          key={source}
                          value={source}
                          onSelect={(currentValue) => {
                            handleInputChange("referralSource", currentValue === formData.referralSource ? "" : currentValue);
                            setOpenReferral(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.referralSource === source ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {source}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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