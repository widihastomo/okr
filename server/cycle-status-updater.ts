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
  try {
    // Get current date in GMT+7 (Indonesia timezone)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const indonesiaTime = new Date(utc + (7 * 3600000)); // GMT+7
    
    // Format to YYYY-MM-DD for comparison
    const year = indonesiaTime.getFullYear();
    const month = String(indonesiaTime.getMonth() + 1).padStart(2, '0');
    const day = String(indonesiaTime.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    // Normalize date strings to YYYY-MM-DD format
    const startStr = startDate.includes('T') ? startDate.split('T')[0] : startDate;
    const endStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;
    
    // Compare date strings directly 
    if (todayStr < startStr) {
      return "planning";
    }
    
    if (todayStr > endStr) {
      return "completed";
    }
    
    if (todayStr >= startStr && todayStr <= endStr) {
      return "active";
    }
    
    return currentStatus;
  } catch (error) {
    console.error("Error in calculateCycleStatus:", error);
    return currentStatus;
  }
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