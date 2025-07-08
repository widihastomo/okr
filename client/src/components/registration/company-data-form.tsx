import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CompanyData } from "@/pages/client-registration";

const companyDataSchema = z.object({
  name: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  industry: z.string().min(1, "Industri wajib dipilih"),
  size: z.string().min(1, "Ukuran perusahaan wajib dipilih"),
  phone: z.string().min(10, "Nomor telepon minimal 10 karakter"),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  website: z.string().url("Format website tidak valid").optional().or(z.literal("")),
  description: z.string().optional(),
});

type CompanyDataFormData = z.infer<typeof companyDataSchema>;

const industries = [
  { value: "technology", label: "Teknologi" },
  { value: "finance", label: "Keuangan" },
  { value: "healthcare", label: "Kesehatan" },
  { value: "education", label: "Pendidikan" },
  { value: "manufacturing", label: "Manufaktur" },
  { value: "retail", label: "Retail" },
  { value: "consulting", label: "Konsultan" },
  { value: "other", label: "Lainnya" },
];

const companySizes = [
  { value: "1-10", label: "1-10 karyawan" },
  { value: "11-50", label: "11-50 karyawan" },
  { value: "51-200", label: "51-200 karyawan" },
  { value: "201-500", label: "201-500 karyawan" },
  { value: "500+", label: "500+ karyawan" },
];

interface CompanyDataFormProps {
  onSubmit: (data: CompanyData) => void;
  initialData?: CompanyData | null;
  isLoading?: boolean;
}

export function CompanyDataForm({ onSubmit, initialData, isLoading }: CompanyDataFormProps) {
  const form = useForm<CompanyDataFormData>({
    resolver: zodResolver(companyDataSchema),
    defaultValues: {
      name: initialData?.name || "",
      industry: initialData?.industry || "",
      size: initialData?.size || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      website: initialData?.website || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = (data: CompanyDataFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Perusahaan *</FormLabel>
                <FormControl>
                  <Input placeholder="PT Teknologi Maju" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industri *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih industri" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
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
                <FormLabel>Ukuran Perusahaan *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ukuran perusahaan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Telepon *</FormLabel>
                <FormControl>
                  <Input placeholder="021-1234567" {...field} />
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
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.perusahaan.com" {...field} />
                </FormControl>
                <FormDescription>
                  Opsional - masukkan URL lengkap website perusahaan
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat Perusahaan *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Jl. Sudirman No. 123, Jakarta Pusat 10270"
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Perusahaan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Deskripsi singkat tentang perusahaan..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Opsional - ceritakan sedikit tentang perusahaan Anda
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : "Lanjutkan ke Data Administrator"}
        </Button>
      </form>
    </Form>
  );
}