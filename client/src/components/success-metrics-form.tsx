import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SuccessMetricsFormProps {
  metric?: {
    name: string;
    target: string;
    achievement: string;
  };
  onSave: (metric: { name: string; target: string; achievement: string }) => void;
  onCancel: () => void;
}

export function SuccessMetricsForm({ metric, onSave, onCancel }: SuccessMetricsFormProps) {
  const [formData, setFormData] = useState({
    name: metric?.name || "",
    target: metric?.target || "",
    achievement: metric?.achievement || ""
  });

  useEffect(() => {
    if (metric) {
      setFormData({
        name: metric.name || "",
        target: metric.target || "",
        achievement: metric.achievement || ""
      });
    }
  }, [metric]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.target.trim()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Metrik *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Contoh: Tingkat Kepuasan Pelanggan"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target">Target *</Label>
        <Input
          id="target"
          value={formData.target}
          onChange={(e) => setFormData({ ...formData, target: e.target.value })}
          placeholder="Contoh: 90% atau 1000 pengguna"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievement">Capaian Saat Ini</Label>
        <Input
          id="achievement"
          value={formData.achievement}
          onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
          placeholder="Contoh: 75% atau 750 pengguna"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          disabled={!formData.name.trim() || !formData.target.trim()}
        >
          Simpan
        </Button>
      </div>
    </form>
  );
}