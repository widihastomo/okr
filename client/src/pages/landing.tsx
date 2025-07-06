import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Users, BarChart3, CheckCircle, Calendar } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">OKR Manager</span>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
          >
            Masuk
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Kelola Tujuan Tim dengan
          <span className="text-blue-600 block">Metodologi Goal</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Platform manajemen tujuan komprehensif yang menggunakan metodologi Goals and Key Results 
          untuk membantu tim dan individu melacak, menyelaraskan, dan mencapai tujuan mereka dengan presisi dan keterlibatan.
        </p>
        <Button 
          onClick={() => window.location.href = '/api/login'}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors text-lg px-8 py-3"
        >
          Mulai Sekarang
        </Button>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Fitur Utama Platform
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Manajemen OKR</CardTitle>
              <CardDescription>
                Buat, kelola, dan lacak Objectives dan Key Results dengan mudah
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Pelacakan Progress</CardTitle>
              <CardDescription>
                Monitor kemajuan real-time dengan sistem kalkulasi otomatis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Manajemen Tim</CardTitle>
              <CardDescription>
                Kelola tim dengan sistem role-based dan kolaborasi yang efektif
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Siklus Waktu</CardTitle>
              <CardDescription>
                Organisasi bulanan, kuartalan, dan tahunan dengan template yang dapat digunakan kembali
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Dashboard analitik dengan insights mendalam tentang performa tim
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Status Otomatis</CardTitle>
              <CardDescription>
                Kalkulasi status otomatis berdasarkan pencapaian vs waktu tersisa
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Mengapa Menggunakan OKR Manager?
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-6">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Peningkatan Fokus</h3>
                    <p className="text-gray-600">Metodologi OKR membantu tim fokus pada tujuan yang paling penting</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Transparansi Total</h3>
                    <p className="text-gray-600">Semua anggota tim dapat melihat progress dan kontribusi masing-masing</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Pengukuran yang Terukur</h3>
                    <p className="text-gray-600">Key Results yang spesifik dan terukur memberikan clarity dalam pencapaian</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Adaptabilitas Tinggi</h3>
                    <p className="text-gray-600">Sistem yang fleksibel mendukung berbagai jenis organisasi dan industri</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/20 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Siap Mulai?</h3>
              <p className="text-gray-600 mb-6">
                Bergabunglah dengan ribuan tim yang telah merasakan manfaat metodologi Goal 
                untuk mencapai tujuan bisnis mereka.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
              >
                Mulai Gratis Sekarang
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">OKR Manager</span>
          </div>
          <p className="text-gray-400">
            Platform manajemen tujuan yang membantu tim mencapai hasil terbaik
          </p>
        </div>
      </div>
    </div>
  );
}