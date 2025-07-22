// Script untuk reset data onboarding dan redirect ke halaman onboarding
// Jalankan script ini di browser console untuk reset ulang onboarding

(function() {
  console.log('🔄 Memulai reset data onboarding...');
  
  // Clear all localStorage data related to onboarding
  const keysToRemove = [
    'companyDetailsCompleted',
    'onboardingCompleted', 
    'welcomeShown',
    'tourStarted',
    'tourCompleted',
    'hasSeenWelcome'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
  });
  
  // Also clear any existing user session to ensure fresh start
  localStorage.removeItem('user');
  console.log('✅ Cleared user session');
  
  console.log('🎯 Data berhasil direset!');
  console.log('🔄 Redirecting ke halaman onboarding...');
  
  // Redirect to onboarding page
  window.location.href = '/company-onboarding';
})();