// Test the new formula implementation
function calculate_progress_status(progress: number, time_passed: number, total_time: number) {
  const ideal_progress = (time_passed / total_time) * 100;
  const gap = progress - ideal_progress;
  
  let status: string;
  
  if (progress >= 100) {
    status = "Completed";
  } else if (gap >= 0) {
    status = "Ahead";
  } else if (-0 <= gap && gap < 0) {
    status = "On Track";
  } else if (-20 <= gap && gap < -0) {
    status = "At Risk";
  } else {
    status = "Behind";
  }
  
  return { idealProgress: ideal_progress, gap: gap, status: status };
}

console.log("=== Testing New Formula Implementation ===");

// Test scenarios based on different progress and time combinations
const testCases = [
  { progress: 100, time_passed: 50, total_time: 100, description: "Target tercapai sebelum deadline" },
  { progress: 60, time_passed: 50, total_time: 100, description: "Progress lebih cepat dari jadwal" },
  { progress: 50, time_passed: 50, total_time: 100, description: "Progress sesuai jadwal" },
  { progress: 40, time_passed: 50, total_time: 100, description: "Progress sedikit tertinggal" },
  { progress: 20, time_passed: 50, total_time: 100, description: "Progress jauh tertinggal" },
  { progress: 0, time_passed: -10, total_time: 100, description: "Sebelum mulai (seperti Q3 2025)" },
];

testCases.forEach((test, index) => {
  const result = calculate_progress_status(test.progress, test.time_passed, test.total_time);
  console.log(`\n${index + 1}. ${test.description}`);
  console.log(`   Progress: ${test.progress}%`);
  console.log(`   Ideal Progress: ${Math.round(result.idealProgress)}%`);
  console.log(`   Gap: ${Math.round(result.gap)}%`);
  console.log(`   Status: ${result.status}`);
});

console.log("\n=== Formula Validation Complete ===");