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
import { Building2, User, Mail, Lock, Globe, MapPin, Users, Briefcase } from "lucide-react";

const industries = [
  "Teknologi Informasi",
  "Keuangan",
  "Perbankan",
  "Manufaktur",
  "Retail",
  "E-commerce",
  "Pendidikan",
  "Kesehatan",
  "Real Estate",
  "Konsultan",
  "Media & Kreatif",
  "Transportasi",
  "Logistik",
  "Energi",
  "Pariwisata",
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
      const response = await apiRequest("POST", "/api/client-registration", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Permohonan pendaftaran Anda telah dikirim dan sedang dalam proses review.",
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
    registerMutation.mutate(data);
  };

  // Generate slug automatically from organization name
  const handleOrganizationNameChange = (value: string) => {
    form.setValue("organizationName", value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");
    form.setValue("organizationSlug", slug);
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
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-12 w-12 text-orange-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Daftar Organisasi Baru
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bergabunglah dengan platform OKR management terdepan
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pendaftaran</CardTitle>
            <CardDescription>
              Lengkapi form di bawah untuk mendaftarkan organisasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Organization Information */}
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
                    name="organizationSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug Organisasi</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="pt-contoh-indonesia"
                            {...field}
                            readOnly
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          URL akses: platform.com/{field.value}
                        </p>
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

                {/* Owner Information */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
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

                <div className="flex items-center justify-between pt-6">
                  <Button variant="outline" asChild>
                    <Link href="/login">Kembali ke Login</Link>
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={registerMutation.isPending}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  >
                    {registerMutation.isPending ? "Mendaftar..." : "Daftar Organisasi"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}