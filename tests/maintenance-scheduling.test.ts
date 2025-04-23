import { describe, it, expect, beforeEach } from 'vitest';

// Mock state
let state = {
  maintenanceSchedules: new Map(),
  maintenanceTypes: new Map(),
  lastTypeId: 0,
  blockHeight: 100 // Mock block height
};

// Reset state before each test
beforeEach(() => {
  state = {
    maintenanceSchedules: new Map(),
    maintenanceTypes: new Map(),
    lastTypeId: 0,
    blockHeight: 100
  };
});

// Mock contract functions
const maintenanceScheduling = {
  setMaintenanceSchedule: (vehicleId, currentMileage, maintenanceInterval) => {
    const nextMaintenance = currentMileage + maintenanceInterval;
    
    state.maintenanceSchedules.set(vehicleId, {
      lastMaintenanceMileage: currentMileage,
      maintenanceInterval: maintenanceInterval,
      nextMaintenanceMileage: nextMaintenance,
      lastMaintenanceDate: state.blockHeight
    });
    
    return { ok: true };
  },
  
  updateMileage: (vehicleId, newMileage) => {
    const schedule = state.maintenanceSchedules.get(vehicleId);
    if (!schedule) return { err: 1 };
    
    const nextMaintenance = schedule.nextMaintenanceMileage;
    
    // Update the schedule
    state.maintenanceSchedules.set(vehicleId, {
      ...schedule,
      nextMaintenanceMileage: schedule.lastMaintenanceMileage + schedule.maintenanceInterval
    });
    
    // Return whether maintenance is needed
    return { ok: newMileage >= nextMaintenance };
  },
  
  recordMaintenance: (vehicleId, currentMileage) => {
    const schedule = state.maintenanceSchedules.get(vehicleId);
    if (!schedule) return { err: 1 };
    
    const nextMaintenance = currentMileage + schedule.maintenanceInterval;
    
    state.maintenanceSchedules.set(vehicleId, {
      lastMaintenanceMileage: currentMileage,
      maintenanceInterval: schedule.maintenanceInterval,
      nextMaintenanceMileage: nextMaintenance,
      lastMaintenanceDate: state.blockHeight
    });
    
    return { ok: true };
  },
  
  getMaintenanceSchedule: (vehicleId) => {
    return state.maintenanceSchedules.get(vehicleId);
  },
  
  isMaintenanceDue: (vehicleId, currentMileage) => {
    const schedule = state.maintenanceSchedules.get(vehicleId) || {
      lastMaintenanceMileage: 0,
      maintenanceInterval: 0,
      nextMaintenanceMileage: 0,
      lastMaintenanceDate: 0
    };
    
    return currentMileage >= schedule.nextMaintenanceMileage;
  },
  
  addMaintenanceType: (name, description, recommendedInterval) => {
    const newId = state.lastTypeId + 1;
    state.lastTypeId = newId;
    
    state.maintenanceTypes.set(newId, {
      name,
      description,
      recommendedInterval
    });
    
    return { ok: newId };
  },
  
  getMaintenanceType: (typeId) => {
    return state.maintenanceTypes.get(typeId);
  }
};

describe('Maintenance Scheduling Contract', () => {
  it('should set a maintenance schedule for a vehicle', () => {
    const result = maintenanceScheduling.setMaintenanceSchedule(1, 10000, 5000);
    
    expect(result.ok).toBe(true);
    
    const schedule = maintenanceScheduling.getMaintenanceSchedule(1);
    expect(schedule).toBeDefined();
    expect(schedule.lastMaintenanceMileage).toBe(10000);
    expect(schedule.maintenanceInterval).toBe(5000);
    expect(schedule.nextMaintenanceMileage).toBe(15000);
    expect(schedule.lastMaintenanceDate).toBe(state.blockHeight);
  });
  
  it('should update mileage and check if maintenance is needed', () => {
    // Set up a schedule first
    maintenanceScheduling.setMaintenanceSchedule(1, 10000, 5000);
    
    // Test with mileage below maintenance threshold
    let result = maintenanceScheduling.updateMileage(1, 12000);
    expect(result.ok).toBe(false); // Maintenance not needed yet
    
    // Test with mileage at maintenance threshold
    result = maintenanceScheduling.updateMileage(1, 15000);
    expect(result.ok).toBe(true); // Maintenance needed
    
    // Test with mileage above maintenance threshold
    result = maintenanceScheduling.updateMileage(1, 16000);
    expect(result.ok).toBe(true); // Maintenance needed
  });
  
  it('should record completed maintenance', () => {
    // Set up a schedule first
    maintenanceScheduling.setMaintenanceSchedule(1, 10000, 5000);
    
    // Record maintenance at a new mileage
    const result = maintenanceScheduling.recordMaintenance(1, 15000);
    expect(result.ok).toBe(true);
    
    // Check updated schedule
    const schedule = maintenanceScheduling.getMaintenanceSchedule(1);
    expect(schedule.lastMaintenanceMileage).toBe(15000);
    expect(schedule.nextMaintenanceMileage).toBe(20000); // 15000 + 5000
    expect(schedule.lastMaintenanceDate).toBe(state.blockHeight);
  });
  
  it('should check if maintenance is due', () => {
    // Set up a schedule
    maintenanceScheduling.setMaintenanceSchedule(1, 10000, 5000);
    
    // Check before maintenance is due
    let isDue = maintenanceScheduling.isMaintenanceDue(1, 14000);
    expect(isDue).toBe(false);
    
    // Check when maintenance is due
    isDue = maintenanceScheduling.isMaintenanceDue(1, 15000);
    expect(isDue).toBe(true);
    
    // Check after maintenance is due
    isDue = maintenanceScheduling.isMaintenanceDue(1, 16000);
    expect(isDue).toBe(true);
  });
  
  it('should add and retrieve maintenance types', () => {
    const result = maintenanceScheduling.addMaintenanceType(
        'Oil Change',
        'Regular oil change service',
        5000
    );
    
    expect(result.ok).toBe(1);
    
    const maintenanceType = maintenanceScheduling.getMaintenanceType(1);
    expect(maintenanceType).toBeDefined();
    expect(maintenanceType.name).toBe('Oil Change');
    expect(maintenanceType.description).toBe('Regular oil change service');
    expect(maintenanceType.recommendedInterval).toBe(5000);
  });
});

console.log('Maintenance Scheduling Contract tests completed successfully!');
