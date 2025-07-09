import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, Calendar, CheckCircle } from "lucide-react";

interface ReminderSettingsProps {
  cadence: string;
  reminderTime: string;
  reminderDay?: string;
  reminderDate?: string;
  onCadenceChange: (cadence: string) => void;
  onReminderTimeChange: (time: string) => void;
  onReminderDayChange?: (day: string) => void;
  onReminderDateChange?: (date: string) => void;
}

export function ReminderSettings({
  cadence,
  reminderTime,
  reminderDay,
  reminderDate,
  onCadenceChange,
  onReminderTimeChange,
  onReminderDayChange,
  onReminderDateChange,
}: ReminderSettingsProps) {
  const [customTimeInput, setCustomTimeInput] = useState("");

  const timePresets = [
    { value: "08:00", label: "08:00 - Pagi" },
    { value: "12:00", label: "12:00 - Siang" },
    { value: "17:00", label: "17:00 - Sore" },
    { value: "09:00", label: "09:00 - Pagi" },
    { value: "15:00", label: "15:00 - Siang" },
    { value: "19:00", label: "19:00 - Malam" },
  ];

  const dayOptions = [
    { value: "1", label: "Senin" },
    { value: "2", label: "Selasa" },
    { value: "3", label: "Rabu" },
    { value: "4", label: "Kamis" },
    { value: "5", label: "Jumat" },
    { value: "6", label: "Sabtu" },
    { value: "7", label: "Minggu" },
  ];

  const handleTimePresetClick = (time: string) => {
    onReminderTimeChange(time);
    setCustomTimeInput("");
  };

  const handleCustomTimeSubmit = () => {
    if (customTimeInput.match(/^\d{2}:\d{2}$/)) {
      onReminderTimeChange(customTimeInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cadence Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Pilih Ritme Check-in
          </CardTitle>
          <CardDescription>
            Seberapa sering Anda ingin mendapat reminder untuk update progress?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={cadence} onValueChange={onCadenceChange}>
            <div className="grid grid-cols-1 gap-4">
              {[
                { value: "harian", label: "Harian", description: "Setiap hari" },
                { value: "mingguan", label: "Mingguan", description: "Setiap minggu" },
                { value: "bulanan", label: "Bulanan", description: "Setiap bulan" },
              ].map((option) => (
                <div key={option.value}>
                  <Card
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                      cadence === option.value
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => onCadenceChange(option.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={option.value} />
                        <div className="flex-1">
                          <Label className="text-base font-medium cursor-pointer">
                            {option.label}
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {option.description}
                          </p>
                        </div>
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Pilih Waktu Reminder
          </CardTitle>
          <CardDescription>
            Kapan waktu terbaik untuk mengingatkan Anda?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {timePresets.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={reminderTime === preset.value ? "default" : "outline"}
                  className={`p-3 h-auto ${
                    reminderTime === preset.value
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                      : "hover:border-orange-300"
                  }`}
                  onClick={() => handleTimePresetClick(preset.value)}
                >
                  <div className="text-center">
                    <div className="font-medium">{preset.label}</div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Atau masukkan waktu custom:
              </Label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={customTimeInput}
                  onChange={(e) => setCustomTimeInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="HH:MM"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCustomTimeSubmit}
                  className="hover:border-orange-300"
                >
                  Set
                </Button>
              </div>
            </div>

            {reminderTime && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span>Waktu reminder: {reminderTime}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Day Selection */}
      {cadence === "mingguan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Pilih Hari
            </CardTitle>
            <CardDescription>
              Pilih hari untuk reminder mingguan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={reminderDay} onValueChange={onReminderDayChange}>
              <div className="grid grid-cols-2 gap-3">
                {dayOptions.map((day) => (
                  <div key={day.value}>
                    <Card
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                        reminderDay === day.value
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => onReminderDayChange?.(day.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={day.value} />
                          <Label className="cursor-pointer">{day.label}</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Monthly Date Selection */}
      {cadence === "bulanan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Pilih Tanggal
            </CardTitle>
            <CardDescription>
              Pilih tanggal untuk reminder bulanan (1-31)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                <Button
                  key={date}
                  type="button"
                  variant={reminderDate === date.toString() ? "default" : "outline"}
                  className={`h-10 w-10 p-0 ${
                    reminderDate === date.toString()
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                      : "hover:border-orange-300"
                  }`}
                  onClick={() => onReminderDateChange?.(date.toString())}
                >
                  {date}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}