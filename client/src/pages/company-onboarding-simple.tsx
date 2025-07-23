import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { CompanyDetailsModal } from "@/components/CompanyDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Target, Users, TrendingUp } from "lucide-react";
import refokusLogo from "@assets/refokus_1751810711179.png";

export default function CompanyOnboardingSimple() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Mark onboarding as completed when component loads - NO AUTO REDIRECT
  useEffect(() => {
    if (!isLoading && user) {
      // Mark onboarding completed in localStorage and server
      localStorage.setItem("onboarding-completed", "true");
      
      // Also mark onboarding progress as completed on server
      fetch("/api/auth/update-onboarding-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          step: "missions_completed"
        })
      }).then(() => {
        console.log("✅ Onboarding marked as completed on server");
      }).catch(err => {
        console.error("❌ Failed to mark onboarding completed on server:", err);
      });
    }
  }, [user, isLoading]);

  // Handle company details completion - redirect to full onboarding
  const handleCompanyDetailsComplete = () => {
    setShowCompanyModal(false);
    // Don't mark onboarding as completed yet - let user go through full onboarding
    localStorage.removeItem("onboarding-completed");
    navigate("/company-onboarding");
  };

  // Handle skip onboarding - complete onboarding and redirect
  const handleSkipOnboarding = async () => {
    try {
      // Mark locally
      localStorage.setItem("onboarding-completed", "true");
      
      // Mark onboarding progress as completed on server
      await fetch("/api/auth/update-onboarding-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          step: "missions_completed"
        })
      });
      
      console.log("✅ Onboarding completed, redirecting to main app");
      
      // Force redirect to main app
      window.location.href = "/";
      
    } catch (error) {
      console.error("❌ Failed to complete onboarding:", error);
      // Still redirect even if server update fails
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Company Details Modal */}
      <CompanyDetailsModal
        open={showCompanyModal}
        onComplete={handleCompanyDetailsComplete}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <img src={refokusLogo} alt="Refokus Logo" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-bold text-gray-900">
              Setup Organisasi
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Selamat datang di Refokus!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mari setup organisasi Anda untuk memulai perjalanan pencapaian target yang terukur
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader className="pb-3">
              <Building2 className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-sm">Setup Organisasi</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Lengkapi profil dan struktur perusahaan
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-sm">Buat Target</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Tentukan objective dan key results
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-sm">Undang Tim</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Ajak anggota tim untuk berkolaborasi
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <CardTitle className="text-sm">Tracking Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Monitor pencapaian secara real-time
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleSkipOnboarding}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
          >
            Mulai menggunakan aplikasi
          </Button>
          
          <p className="text-sm text-gray-500">
            Setup organisasi dapat dilakukan nanti melalui menu Pengaturan
          </p>
        </div>
      </div>
    </div>
  );
}