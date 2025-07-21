import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TourRestartButton, { CompactTourRestartButton } from "@/components/tour-restart-button";
import { 
  HelpCircle, 
  Book, 
  MessageSquare, 
  Mail, 
  Phone, 
  ExternalLink,
  FileText,
  PlayCircle,
  Users,
  Settings,
  Target,
  CheckSquare,
  BarChart3,
  Clock
} from "lucide-react";

export default function HelpPage() {
  const faqItems = [
    {
      question: "Bagaimana cara membuat Objective baru?",
      answer: "Masuk ke halaman Goals, klik tombol 'Tambah Objective', isi form dengan judul, deskripsi, dan target yang ingin dicapai.",
      category: "Goals"
    },
    {
      question: "Apa perbedaan antara Task dan Key Result?",
      answer: "Task adalah aktivitas harian yang perlu dikerjakan. Key Result adalah target terukur yang harus dicapai untuk menyelesaikan sebuah Objective.",
      category: "Basic"
    },
    {
      question: "Bagaimana cara mengundang anggota tim?",
      answer: "Buka halaman Kelola Pengguna, klik 'Undang Anggota', masukkan email dan pilih role yang sesuai.",
      category: "Team"
    },
    {
      question: "Bisakah saya mengubah target Key Result?",
      answer: "Ya, Anda dapat mengedit Key Result dengan mengklik ikon edit pada detail Key Result.",
      category: "Goals"
    },
    {
      question: "Bagaimana cara melihat progress tim?",
      answer: "Gunakan halaman Timeline untuk melihat aktivitas terbaru atau halaman Analytics untuk laporan progress tim.",
      category: "Analytics"
    },
    {
      question: "Apa itu Daily Focus?",
      answer: "Daily Focus adalah halaman utama yang menampilkan task hari ini, progress Key Result, dan ringkasan aktivitas harian.",
      category: "Basic"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Goal Management",
      description: "Kelola Objective dan Key Result dengan sistem OKR yang terstruktur",
      features: ["Buat Objective dengan timeline", "Set Key Result terukur", "Track progress real-time"]
    },
    {
      icon: CheckSquare,
      title: "Task Management", 
      description: "Organisir dan kelola task harian dengan sistem prioritas",
      features: ["Daily Focus view", "Task categorization", "Due date tracking"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Kolaborasi tim dengan role management dan sharing progress",
      features: ["Invite team members", "Role-based access", "Team timeline"]
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Monitor performa dan progress dengan dashboard analytics",
      features: ["Progress tracking", "Performance metrics", "Visual reports"]
    }
  ];

  const resources = [
    {
      title: "Getting Started Guide",
      description: "Panduan lengkap untuk memulai menggunakan platform",
      icon: Book,
      url: "#",
      type: "Guide"
    },
    {
      title: "Video Tutorials",
      description: "Tutorial video step-by-step untuk fitur utama",
      icon: PlayCircle,
      url: "#", 
      type: "Video"
    },
    {
      title: "Best Practices",
      description: "Tips dan tricks untuk memaksimalkan penggunaan OKR",
      icon: FileText,
      url: "#",
      type: "Article"
    }
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "support@refokus.com",
      action: "mailto:support@refokus.com"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat langsung dengan tim support",
      action: "#"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+62 21 1234 5678",
      action: "tel:+622112345678"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <HelpCircle className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Temukan jawaban, panduan, dan dukungan untuk memaksimalkan penggunaan platform OKR management
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Book className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Documentation</h3>
            <p className="text-sm text-gray-600">Panduan lengkap penggunaan</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <PlayCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-600">Tutorial video interaktif</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">FAQ</h3>
            <p className="text-sm text-gray-600">Pertanyaan yang sering diajukan</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600">Hubungi tim support</p>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Platform Features
          </CardTitle>
          <CardDescription>
            Pelajari fitur-fitur utama platform OKR management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tour Restart Section */}
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-orange-800 mb-1">Tutorial Interaktif</h4>
                <p className="text-sm text-orange-700">Ikuti panduan langkah demi langkah untuk memahami platform</p>
              </div>
              <CompactTourRestartButton />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <feature.icon className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-orange-600 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Jawaban untuk pertanyaan yang sering diajukan pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{item.question}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Resources</CardTitle>
          <CardDescription>
            Materi pembelajaran untuk memahami platform lebih dalam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <resource.icon className="h-6 w-6 text-orange-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{resource.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>
            Tim support siap membantu Anda 24/7
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactMethods.map((method, index) => (
              <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <method.icon className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">{method.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => method.action.startsWith('mailto:') || method.action.startsWith('tel:') ? 
                    window.location.href = method.action : null
                  }
                >
                  Contact
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">System Information</h4>
              <p className="text-sm text-gray-600">
                Platform Version 2.0 • Last Updated: January 2025
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Response time: &lt; 2 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}