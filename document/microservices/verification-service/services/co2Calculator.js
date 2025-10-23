class CO2Calculator {
  constructor() {
    // Emission factors (kg CO2 per km)
    this.emissionFactors = {
      gasoline: 0.21,  // Average gasoline car
      diesel: 0.18,    // Average diesel car
      electric: 0.0,   // Electric vehicle (direct emissions)
      grid: 0.05       // Grid electricity emissions (varies by region)
    };
    
    // Default factor for CO2 reduction calculation
    this.defaultReductionFactor = 0.15; // kg CO2 saved per km by using EV instead of gasoline car
  }

  /**
   * Calculate CO2 reduction from EV usage
   * @param {number} totalKm - Total kilometers driven
   * @param {string} replacedVehicleType - Type of vehicle replaced (gasoline, diesel)
   * @returns {Object} CO2 calculation results
   */
  calculateCO2Reduction(totalKm, replacedVehicleType = 'gasoline') {
    if (!totalKm || totalKm <= 0) {
      throw new Error('Total kilometers must be greater than 0');
    }

    const replacedEmissions = totalKm * this.emissionFactors[replacedVehicleType];
    const evEmissions = totalKm * this.emissionFactors.grid; // Indirect emissions from grid
    const totalReduction = replacedEmissions - evEmissions;

    return {
      totalKm,
      replacedVehicleType,
      replacedEmissions: Math.round(replacedEmissions * 100) / 100,
      evEmissions: Math.round(evEmissions * 100) / 100,
      totalReduction: Math.round(totalReduction * 100) / 100,
      emissionFactor: this.emissionFactors[replacedVehicleType] - this.emissionFactors.grid,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate carbon credits from CO2 reduction
   * @param {number} co2Reduction - CO2 reduction in kg
   * @returns {number} Carbon credits (1 credit = 10 kg CO2)
   */
  calculateCarbonCredits(co2Reduction) {
    if (!co2Reduction || co2Reduction <= 0) {
      return 0;
    }
    
    // 1 carbon credit = 10 kg CO2 reduction
    return Math.round((co2Reduction / 10) * 100) / 100;
  }

  /**
   * Validate trip data for CO2 calculation
   * @param {Object} tripData - Trip data object
   * @returns {Object} Validation result
   */
  validateTripData(tripData) {
    const errors = [];

    if (!tripData) {
      errors.push('Trip data is required');
      return { isValid: false, errors };
    }

    if (!tripData.totalKm || tripData.totalKm <= 0) {
      errors.push('Total kilometers must be greater than 0');
    }

    if (!tripData.startDate) {
      errors.push('Start date is required');
    }

    if (!tripData.endDate) {
      errors.push('End date is required');
    }

    if (tripData.startDate && tripData.endDate) {
      const startDate = new Date(tripData.startDate);
      const endDate = new Date(tripData.endDate);
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }

      // Check if dates are not in the future
      const now = new Date();
      if (startDate > now || endDate > now) {
        errors.push('Trip dates cannot be in the future');
      }
    }

    if (tripData.routes && Array.isArray(tripData.routes)) {
      const totalRouteDistance = tripData.routes.reduce((sum, route) => sum + (route.distance || 0), 0);
      const tolerance = tripData.totalKm * 0.1; // 10% tolerance
      
      if (Math.abs(totalRouteDistance - tripData.totalKm) > tolerance) {
        errors.push('Total route distance does not match total kilometers');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new CO2Calculator();