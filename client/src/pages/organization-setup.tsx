import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Users, Briefcase, Save, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Indonesian provinces data
const indonesianProvinces = [
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Banten", 
  "Bali", "Sumatera Utara", "Sumatera Barat", "Sumatera Selatan", 
  "Kalimantan Barat", "Kalimantan Timur", "Sulawesi Selatan", "Papua"
];

// Indonesian cities by province
const indonesianCities: Record<string, string[]> = {
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cirebon", "Sukabumi", "Tasikmalaya"],
  "Jawa Tengah": ["Semarang", "Solo", "Yogyakarta", "Pekalongan", "Tegal", "Magelang"],
  "Jawa Timur": ["Surabaya", "Malang", "Kediri", "Blitar", "Madiun", "Mojokerto", "Pasuruan"],
  "Banten": ["Tangerang", "Serang", "Cilegon", "Tangerang Selatan"],
  "Bali": ["Denpasar", "Ubud", "Singaraja", "Tabanan"]
};

// Industry types
const industryTypes = [
  "Teknologi Informasi", "Perdagangan/Retail", "Manufaktur", "Jasa Keuangan", 
  "Pendidikan", "Kesehatan", "Konstruksi", "Transportasi", "Pariwisata", 
  "Pertanian", "Media & Komunikasi", "Konsultan", "Lainnya"
];

// Company sizes
const companySizes = [
  "1-5 karyawan", "6-10 karyawan", "11-25 karyawan", "26-50 karyawan",
  "51-100 karyawan", "101-250 karyawan", "251-500 karyawan", "500+ karyawan"
];

export default function OrganizationSetup() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form states
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    province: "",
    city: "",
    industryType: "",
    companySize: "",
    description: "",
  });
  
  const [openProvince, setOpenProvince] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openIndustry, setOpenIndustry] = useState(false);
  const [openSize, setOpenSize] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing organization data
  useEffect(() => {
    if (user && !isLoading) {
      // Fetch organization data if available
      fetch('/api/my-organization-with-role', {
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        if (data.organization) {
          const org = data.organization;
          setFormData({
            companyName: org.name || "",
            companyAddress: org.companyAddress || "",
            province: org.province || "",
            city: org.city || "",
            industryType: org.industryType || "",
            companySize: org.size || "",
            description: org.description || "",
          });
        }
      })
      .catch(err => console.error('Error loading organization data:', err));
    }
  }, [user, isLoading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset city when province changes
    if (field === 'province') {
      setFormData(prev => ({
        ...prev,
        city: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nama perusahaan wajib diisi"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/organization/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save organization setup');
      }

      toast({
        variant: "default",
        title: "Berhasil!",
        description: "Setup organisasi telah disimpan. Sistem OKR Anda siap digunakan!"
      });

      // Navigate back to main app after successful setup
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error saving organization setup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan setup organisasi. Silakan coba lagi."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCities = formData.province ? (indonesianCities[formData.province] || []) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Setup Organisasi</h1>
                <p className="text-sm text-gray-500">Lengkapi profil perusahaan Anda</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-gray-600"
            >
              Lewati untuk sekarang
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-orange-500" />
                Informasi Perusahaan
              </CardTitle>
              <CardDescription>
                Detail dasar tentang perusahaan atau organisasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nama Perusahaan *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="PT. Contoh Perusahaan"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="establishedYear">Tahun Didirikan</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    min="1900"
                    max="2025"
                    value={formData.establishedYear}
                    onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                    placeholder="2020"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Jenis Industri</Label>
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
                        <CommandInput placeholder="Cari jenis industri..." />
                        <CommandList style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <CommandEmpty>Jenis industri tidak ditemukan.</CommandEmpty>
                          {industryTypes.map((industry) => (
                            <CommandItem
                              key={industry}
                              value={industry}
                              onSelect={() => {
                                handleInputChange('industryType', industry);
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
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Ukuran Perusahaan</Label>
                  <Popover open={openSize} onOpenChange={setOpenSize}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSize}
                        className="w-full justify-between"
                      >
                        {formData.companySize || "Pilih ukuran perusahaan..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari ukuran..." />
                        <CommandList style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <CommandEmpty>Ukuran tidak ditemukan.</CommandEmpty>
                          {companySizes.map((size) => (
                            <CommandItem
                              key={size}
                              value={size}
                              onSelect={() => {
                                handleInputChange('companySize', size);
                                setOpenSize(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.companySize === size ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {size}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Deskripsi Perusahaan</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Jelaskan secara singkat tentang perusahaan Anda..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                Informasi Lokasi
              </CardTitle>
              <CardDescription>
                Alamat dan lokasi perusahaan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyAddress">Alamat Perusahaan</Label>
                <Input
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  placeholder="Jl. Contoh No. 123"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Provinsi</Label>
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
                        <CommandList style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                          {indonesianProvinces.map((province) => (
                            <CommandItem
                              key={province}
                              value={province}
                              onSelect={() => {
                                handleInputChange('province', province);
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
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Kota/Kabupaten</Label>
                  <Popover open={openCity} onOpenChange={setOpenCity}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCity}
                        className="w-full justify-between"
                        disabled={!formData.province}
                      >
                        {formData.city || (formData.province ? "Pilih kota..." : "Pilih provinsi dulu")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari kota..." />
                        <CommandList style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <CommandEmpty>Kota tidak ditemukan.</CommandEmpty>
                          {availableCities.map((city) => (
                            <CommandItem
                              key={city}
                              value={city}
                              onSelect={() => {
                                handleInputChange('city', city);
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
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              className="min-w-[200px]"
            >
              Lewati untuk sekarang
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.companyName.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan & Lanjutkan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}