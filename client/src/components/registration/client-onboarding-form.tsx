import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Rocket, Target, TrendingUp, Users, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { OnboardingData } from "@/pages/client-registration";

const clientOnboardingSchema = z.object({
  teamFocus: z.enum(["penjualan", "marketing", "operasional", "produk"], {
    required_error: "Pilih fokus tim",
  }),
  cycleDuration: z.enum(["1_bulan", "3_bulan", "6_bulan", "1_tahun"], {
    required_error: "Pilih durasi siklus",
  }),
  cycleStartDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  cycleEndDate: z.string().min(1, "Tanggal berakhir wajib diisi"),
  objective: z.string().min(10, "Objektif minimal 10 karakter"),
  keyResults: z.array(z.string().min(5, "Key result minimal 5 karakter")).min(1, "Minimal 1 key result"),
  cadence: z.enum(["harian", "mingguan", "bulanan"], {
    required_error: "Pilih frekuensi reminder",
  }),
  reminderTime: z.string().min(1, "Waktu reminder wajib diisi"),
  invitedMembers: z.array(z.string().email("Email tidak valid")).optional(),
  initiatives: z.array(z.string().min(5, "Inisiatif minimal 5 karakter")).optional(),
  tasks: z.array(z.string().min(5, "Task minimal 5 karakter")).optional(),
});

interface ClientOnboardingFormProps {
  onSubmit: (data: OnboardingData) => void;
  isLoading?: boolean;
}

export function ClientOnboardingForm({ onSubmit, isLoading }: ClientOnboardingFormProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [keyResults, setKeyResults] = useState<string[]>([""]);
  const [invitedMembers, setInvitedMembers] = useState<string[]>([""]);
  const [initiatives, setInitiatives] = useState<string[]>([""]);
  const [tasks, setTasks] = useState<string[]>([""]);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      teamFocus: "penjualan",
      cycleDuration: "1_bulan",
      cycleStartDate: "",
      cycleEndDate: "",
      objective: "",
      keyResults: [],
      cadence: "harian",
      reminderTime: "09:00",
      invitedMembers: [],
      initiatives: [],
      tasks: [],
    },
  });

  const handleSubmit = (data: OnboardingData) => {
    const processedData = {
      ...data,
      keyResults: keyResults.filter(kr => kr.trim() !== ""),
      invitedMembers: invitedMembers.filter(email => email.trim() !== ""),
      initiatives: initiatives.filter(init => init.trim() !== ""),
      tasks: tasks.filter(task => task.trim() !== ""),
    };
    onSubmit(processedData);
  };

  const addKeyResult = () => {
    setKeyResults([...keyResults, ""]);
  };

  const removeKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index));
  };

  const updateKeyResult = (index: number, value: string) => {
    const updated = [...keyResults];
    updated[index] = value;
    setKeyResults(updated);
  };

  const addInvitedMember = () => {
    setInvitedMembers([...invitedMembers, ""]);
  };

  const removeInvitedMember = (index: number) => {
    setInvitedMembers(invitedMembers.filter((_, i) => i !== index));
  };

  const updateInvitedMember = (index: number, value: string) => {
    const updated = [...invitedMembers];
    updated[index] = value;
    setInvitedMembers(updated);
  };

  const addInitiative = () => {
    setInitiatives([...initiatives, ""]);
  };

  const removeInitiative = (index: number) => {
    setInitiatives(initiatives.filter((_, i) => i !== index));
  };

  const updateInitiative = (index: number, value: string) => {
    const updated = [...initiatives];
    updated[index] = value;
    setInitiatives(updated);
  };

  const addTask = () => {
    setTasks([...tasks, ""]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, value: string) => {
    const updated = [...tasks];
    updated[index] = value;
    setTasks(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Setup Awal Platform
          </CardTitle>
          <CardDescription>
            Konfigurasi awal untuk memulai menggunakan platform manajemen goal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Team Focus */}
              <FormField
                control={form.control}
                name="teamFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Fokus Tim
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="penjualan" id="penjualan" />
                          <Label htmlFor="penjualan">Penjualan</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="marketing" id="marketing" />
                          <Label htmlFor="marketing">Marketing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="operasional" id="operasional" />
                          <Label htmlFor="operasional">Operasional</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="produk" id="produk" />
                          <Label htmlFor="produk">Produk</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cycle Duration */}
              <FormField
                control={form.control}
                name="cycleDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durasi Siklus Goal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih durasi siklus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1_bulan">1 Bulan</SelectItem>
                        <SelectItem value="3_bulan">3 Bulan</SelectItem>
                        <SelectItem value="6_bulan">6 Bulan</SelectItem>
                        <SelectItem value="1_tahun">1 Tahun</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cycleStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Mulai</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {startDate ? (
                                format(startDate, "PPP", { locale: id })
                              ) : (
                                <span>Pilih tanggal mulai</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cycleEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal Berakhir</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {endDate ? (
                                format(endDate, "PPP", { locale: id })
                              ) : (
                                <span>Pilih tanggal berakhir</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                            disabled={(date) => date < (startDate || new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Objective */}
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objektif Utama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan objektif utama untuk periode ini"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsikan goal utama yang ingin dicapai
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Key Results */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Key Results
                </Label>
                {keyResults.map((keyResult, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Key result ${index + 1}`}
                      value={keyResult}
                      onChange={(e) => updateKeyResult(index, e.target.value)}
                      className="flex-1"
                    />
                    {keyResults.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeKeyResult(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyResult}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Key Result
                </Button>
              </div>

              {/* Reminder Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cadence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frekuensi Reminder</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih frekuensi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="harian">Harian</SelectItem>
                          <SelectItem value="mingguan">Mingguan</SelectItem>
                          <SelectItem value="bulanan">Bulanan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Reminder</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Optional: Invited Members */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Undang Anggota Tim (Opsional)
                </Label>
                {invitedMembers.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder={`Email anggota ${index + 1}`}
                      value={email}
                      onChange={(e) => updateInvitedMember(index, e.target.value)}
                      className="flex-1"
                    />
                    {invitedMembers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInvitedMember(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvitedMember}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Anggota
                </Button>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Menyelesaikan Registrasi..." : "Selesaikan Registrasi"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}