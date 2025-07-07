import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { clientRegistrationSchema, type ClientRegistrationData } from "@shared/schema";
import { Building2, User, Mail, Lock, Globe, MapPin, Users, Briefcase, ChevronRight, ChevronLeft, Check } from "lucide-react";

const industries = [
  "Teknologi & Software",
  "Keuangan & Perbankan",
  "Kesehatan & Farmasi",
  "Pendidikan",
  "Ritel & E-commerce",
  "Manufaktur",
  "Konstruksi & Real Estate",
  "Media & Hiburan",
  "Transportasi & Logistik",
  "Energi & Utilities",
  "Konsultan & Layanan Profesional",
  "Lainnya"
];

const organizationSizes = [
  "1-10 karyawan",
  "11-50 karyawan",
  "51-200 karyawan",
  "201-500 karyawan",
  "500+ karyawan"
];

export default function ClientRegistration() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<ClientRegistrationData>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      organizationName: "",
      organizationSlug: "",
      website: "",
      industry: "",
      size: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      jobTitle: "",
      department: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: ClientRegistrationData) => {
      const response = await apiRequest("POST", "/api/auth/register-client", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Organisasi Anda telah berhasil didaftarkan. Tim kami akan meninjau dalam 1-2 hari kerja.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientRegistrationData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    registerMutation.mutate(data);
  };

  // Handle organization name change
  const handleOrganizationNameChange = (value: string) => {
    form.setValue("organizationName", value);
  };

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['organizationName', 'industry', 'size'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    }
    
    const result = await form.trigger(fieldsToValidate as any);
    if (result) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Informasi Organisasi";
      case 2:
        return "Informasi Admin";
      case 3:
        return "Konfirmasi & Selesai";
      default:
        return "Pendaftaran";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Masukkan detail organisasi Anda";
      case 2:
        return "Buat akun admin untuk organisasi";
      case 3:
        return "Tinjau dan konfirmasi pendaftaran";
      default:
        return "Lengkapi form pendaftaran";
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Pendaftaran Berhasil!</CardTitle>
            <CardDescription className="text-center">
              Terima kasih telah mendaftar. Tim kami akan meninjau permohonan Anda dalam 1-2 hari kerja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Langkah Selanjutnya:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Kami akan meninjau informasi organisasi Anda</li>
                <li>• Konfirmasi melalui email dalam 1-2 hari kerja</li>
                <li>• Akses ke platform akan diberikan setelah disetujui</li>
              </ul>
            </div>
            <Button asChild className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
              <Link href="/login">Kembali ke Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Daftar Organisasi Baru
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bergabunglah dengan platform OKR management terdepan
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>
              {getStepDescription()}
            </CardDescription>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep > step
                        ? 'bg-green-500 text-white'
                        : currentStep === step
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-1 ${
                        currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-center space-x-8 mt-2">
              <span className={`text-xs ${currentStep >= 1 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                Organisasi
              </span>
              <span className={`text-xs ${currentStep >= 2 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                Admin
              </span>
              <span className={`text-xs ${currentStep >= 3 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                Konfirmasi
              </span>
            </div>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Organization Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Building2 className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-medium text-gray-900">Informasi Organisasi</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Organisasi</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="PT. Contoh Indonesia"
                              {...field}
                              onChange={(e) => handleOrganizationNameChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Opsional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                placeholder="https://contoh.com" 
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industri</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih industri" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {industries.map((industry) => (
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ukuran Organisasi</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih ukuran" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {organizationSizes.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Admin Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-medium text-gray-900">Informasi Admin Organisasi</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Depan</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Belakang</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type="email"
                                placeholder="john@contoh.com" 
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="password"
                                  placeholder="Minimal 8 karakter" 
                                  {...field}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Konfirmasi Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="password"
                                  placeholder="Ulangi password" 
                                  {...field}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jabatan</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="CEO, Manager, dll" 
                                  {...field}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departemen</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="IT, HR, Sales, dll" 
                                  {...field}
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Check className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-medium text-gray-900">Konfirmasi Pendaftaran</h3>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Organisasi</h4>
                        <p className="text-sm text-gray-600">{form.watch("organizationName")}</p>
                        <p className="text-sm text-gray-600">{form.watch("industry")} • {form.watch("size")}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">Admin</h4>
                        <p className="text-sm text-gray-600">{form.watch("firstName")} {form.watch("lastName")}</p>
                        <p className="text-sm text-gray-600">{form.watch("email")}</p>
                        <p className="text-sm text-gray-600">{form.watch("jobTitle")} • {form.watch("department")}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Dengan mendaftar, Anda menyetujui:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Syarat dan ketentuan penggunaan platform</li>
                        <li>• Kebijakan privasi data organisasi</li>
                        <li>• Proses verifikasi organisasi 1-2 hari kerja</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6">
                  <div className="flex space-x-2">
                    {currentStep > 1 && (
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={prevStep}
                        className="flex items-center space-x-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                      </Button>
                    )}
                    
                    {currentStep === 1 && (
                      <Button variant="outline" asChild>
                        <Link href="/login">Kembali ke Login</Link>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {currentStep < totalSteps ? (
                      <Button 
                        type="button"
                        onClick={nextStep}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 flex items-center space-x-2"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={registerMutation.isPending}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                        onClick={(e) => {
                          console.log('Submit button clicked');
                          console.log('Form state:', form.formState);
                          console.log('Form values:', form.getValues());
                          console.log('Form errors:', form.formState.errors);
                          if (!form.formState.isValid) {
                            e.preventDefault();
                            console.log('Form is not valid, preventing submit');
                          }
                        }}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Memproses Pendaftaran...
                          </div>
                        ) : (
                          "Daftar Organisasi"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}