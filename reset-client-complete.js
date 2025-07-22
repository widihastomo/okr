// COMPLETE SYSTEM RESET SCRIPT
// Run this in browser console after database reset

console.log('🗑️ COMPLETE SYSTEM RESET EXECUTED');
console.log('📊 Database reset: ALL users and organizations deleted except system owner');
console.log('🔒 Preserved: System owner (admin@refokus.com), invoice data, billing information');
console.log('');

console.log('🔄 Now clearing browser cache and localStorage...');

// Clear all localStorage data completely
localStorage.clear();
console.log('✅ Cleared all localStorage');

// Clear sessionStorage as well
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

console.log('');
console.log('🎯 COMPLETE SYSTEM RESET SUCCESSFUL!');
console.log('📋 What was completely deleted:');
console.log('   - ALL user accounts (except system owner)');
console.log('   - ALL organizations (except system organization)');
console.log('   - ALL goals, objectives, key results');
console.log('   - ALL initiatives, tasks, teams');
console.log('   - ALL cycles, timeline entries');
console.log('   - ALL tour and onboarding data');
console.log('   - ALL organizational subscriptions');
console.log('');
console.log('💰 What was preserved:');
console.log('   - System owner: admin@refokus.com');
console.log('   - System organization: Refokus System');
console.log('   - Invoice history and billing data');
console.log('   - Application settings and subscription plans');
console.log('');
console.log('🔄 Redirecting to login page for fresh start...');
console.log('💡 Only system owner can now login: admin@refokus.com');

// Redirect to login page for fresh authentication
setTimeout(() => {
  window.location.href = '/';
}, 3000);