// Complete client organization data reset script
// Run this in browser console after database reset

console.log('🗑️ Complete organization data reset executed');
console.log('📊 Database cleared: objectives, key results, initiatives, tasks, teams, cycles, timeline');
console.log('🔒 Preserved: user account, invoice data, billing information');
console.log('');

console.log('🔄 Now clearing browser cache and localStorage...');

// Clear all localStorage data
const keysToRemove = [
  'companyDetailsCompleted',
  'onboardingCompleted', 
  'welcomeShown',
  'tourStarted',
  'tourCompleted',
  'hasSeenWelcome',
  'user',
  'selectedCycle',
  'authToken'
];

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Removed: ${key}`);
});

// Clear sessionStorage as well
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

console.log('');
console.log('🎯 Complete reset successful!');
console.log('📋 What was cleared:');
console.log('   - All goals and objectives');
console.log('   - All key results and progress');
console.log('   - All initiatives and tasks');
console.log('   - All teams and cycles');
console.log('   - All timeline entries');
console.log('   - All tour and onboarding progress');
console.log('');
console.log('💰 What was preserved:');
console.log('   - User account and authentication');
console.log('   - Invoice history and billing data');
console.log('   - System settings');
console.log('');
console.log('🔄 Redirecting to login page for fresh start...');

// Redirect to login page for fresh authentication
setTimeout(() => {
  window.location.href = '/';
}, 2000);