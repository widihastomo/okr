// Reset client data dan redirect ke onboarding
function resetClientDataAndRedirectToOnboarding() {
  // Clear all localStorage data related to onboarding
  localStorage.removeItem('companyDetailsCompleted');
  localStorage.removeItem('onboardingCompleted'); 
  localStorage.removeItem('welcomeShown');
  localStorage.removeItem('tourStarted');
  localStorage.removeItem('tourCompleted');
  
  // Redirect to onboarding page
  window.location.href = '/company-onboarding';
}

// Call this function to reset
resetClientDataAndRedirectToOnboarding();
