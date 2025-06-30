import { storage } from "./storage";

export interface CycleStatusUpdate {
  id: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
}

/**
 * Determines the appropriate status for a cycle based on current date
 */
function calculateCycleStatus(startDate: string, endDate: string, currentStatus: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // End of day
  
  console.log(`🕐 Date comparison: today=${today.toISOString()}, start=${start.toISOString()}, end=${end.toISOString()}`);
  
  // If current date is before start date, should be "planning"
  if (today < start) {
    console.log("📅 Status should be 'planning' (today < start)");
    return "planning";
  }
  
  // If current date is after end date, should be "completed"
  if (today > end) {
    console.log("📅 Status should be 'completed' (today > end)");
    return "completed";
  }
  
  // If current date is between start and end date, should be "active"
  if (today >= start && today <= end) {
    console.log("📅 Status should be 'active' (start <= today <= end)");
    return "active";
  }
  
  console.log("📅 Fallback to current status:", currentStatus);
  return currentStatus; // Fallback to current status
}

/**
 * Updates cycle statuses based on current date
 * Returns array of cycles that were updated
 */
export async function updateCycleStatuses(): Promise<CycleStatusUpdate[]> {
  try {
    const cycles = await storage.getCycles();
    const updates: CycleStatusUpdate[] = [];
    
    console.log("🔄 Checking cycle statuses for", cycles.length, "cycles");
    
    for (const cycle of cycles) {
      const currentStatus = cycle.status;
      const newStatus = calculateCycleStatus(cycle.startDate, cycle.endDate, currentStatus);
      
      console.log(`📅 Cycle "${cycle.name}": ${cycle.startDate} to ${cycle.endDate}, current: ${currentStatus}, calculated: ${newStatus}`);
      
      if (newStatus !== currentStatus) {
        // Update the cycle status
        await storage.updateCycle(cycle.id, { status: newStatus });
        
        let reason = "";
        if (newStatus === "active" && currentStatus === "planning") {
          reason = "Siklus dimulai hari ini";
        } else if (newStatus === "completed" && currentStatus === "active") {
          reason = "Siklus berakhir";
        } else if (newStatus === "planning" && currentStatus === "active") {
          reason = "Siklus belum dimulai";
        } else {
          reason = `Status berubah dari ${currentStatus} ke ${newStatus}`;
        }
        
        updates.push({
          id: cycle.id,
          oldStatus: currentStatus,
          newStatus: newStatus,
          reason: reason
        });
        
        console.log(`✅ Updated cycle "${cycle.name}" from ${currentStatus} to ${newStatus}`);
      } else {
        console.log(`ℹ️ Cycle "${cycle.name}" status unchanged: ${currentStatus}`);
      }
    }
    
    console.log("🔄 Status update completed. Updated", updates.length, "cycles");
    return updates;
  } catch (error) {
    console.error("Error updating cycle statuses:", error);
    throw error;
  }
}

/**
 * Schedules automatic status updates to run daily
 */
export function scheduleCycleStatusUpdates() {
  // Run immediately on startup
  updateCycleStatuses()
    .then(updates => {
      if (updates.length > 0) {
        console.log(`Updated ${updates.length} cycle status(es) on startup:`, updates);
      }
    })
    .catch(error => {
      console.error("Error during startup cycle status update:", error);
    });
  
  // Schedule to run every 24 hours (86400000 milliseconds)
  const updateInterval = 24 * 60 * 60 * 1000;
  
  setInterval(async () => {
    try {
      const updates = await updateCycleStatuses();
      if (updates.length > 0) {
        console.log(`Daily cycle status update: Updated ${updates.length} cycle(s):`, updates);
      }
    } catch (error) {
      console.error("Error during scheduled cycle status update:", error);
    }
  }, updateInterval);
  
  console.log("Cycle status updater scheduled to run every 24 hours");
}

/**
 * Gets the display text for cycle status in Indonesian
 */
export function getCycleStatusText(status: string): string {
  switch (status) {
    case "planning": return "Perencanaan";
    case "active": return "Aktif";
    case "completed": return "Selesai";
    default: return status;
  }
}

/**
 * Gets the color class for cycle status badges
 */
export function getCycleStatusColor(status: string): string {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "completed": return "bg-blue-100 text-blue-800";
    case "planning": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
}