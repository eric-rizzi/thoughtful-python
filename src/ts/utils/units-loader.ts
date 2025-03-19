// src/ts/utils/units-loader.ts
import { BASE_PATH } from "../config";

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: string[];
  image?: string;
}

export interface UnitsData {
  units: Unit[];
}

/**
 * Loads units data from the units.json file
 * @returns Promise resolving to units data
 */
export async function loadUnits(): Promise<UnitsData> {
  try {
    // Construct the full path to the JSON file
    const jsonPath = `${BASE_PATH}/data/units.json`;
    
    // Fetch the units JSON file
    const response = await fetch(jsonPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load units data: ${response.status} ${response.statusText}`);
    }
    
    const unitsData: UnitsData = await response.json();
    return unitsData;
  } catch (error) {
    console.error("Error loading units:", error);
    throw error;
  }
}

/**
 * Loads a specific unit by ID
 * @param unitId - The unit identifier
 * @returns Promise resolving to the unit data or null if not found
 */
export async function loadUnitById(unitId: string): Promise<Unit | null> {
  try {
    const unitsData = await loadUnits();
    
    // Find the unit with the matching ID
    const unit = unitsData.units.find(u => u.id === unitId);
    
    if (!unit) {
      console.warn(`Unit with ID ${unitId} not found`);
      return null;
    }
    
    return unit;
  } catch (error) {
    console.error(`Error loading unit ${unitId}:`, error);
    throw error;
  }
}