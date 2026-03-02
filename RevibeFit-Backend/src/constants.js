export const DB_NAME = "revibe_fit";
export const USERS_COLLECTION = "users";

// User Types
export const USER_TYPES = {
  FITNESS_ENTHUSIAST: "fitness-enthusiast",
  TRAINER: "trainer",
  LAB_PARTNER: "lab-partner",
  ADMIN: "admin",
  MANAGER: "manager",
};

// Manager Types
export const MANAGER_TYPES = {
  TRAINER_MANAGER: "trainer_manager",
  LAB_MANAGER: "lab_manager",
};

// Indian States & Union Territories (for user state validation)
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
  "Puducherry",
];

// Indian Regions (for manager region scoping)
export const INDIAN_REGIONS = {
  "Northern India": [
    "Jammu and Kashmir", "Himachal Pradesh", "Punjab", "Uttarakhand",
    "Haryana", "Delhi", "Chandigarh", "Ladakh", "Rajasthan", "Uttar Pradesh",
  ],
  "Southern India": [
    "Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu",
    "Telangana", "Puducherry", "Lakshadweep",
  ],
  "Eastern India": [
    "Bihar", "Jharkhand", "Odisha", "West Bengal",
    "Andaman and Nicobar Islands",
  ],
  "Western India": [
    "Gujarat", "Maharashtra", "Goa",
    "Dadra and Nagar Haveli and Daman and Diu",
  ],
  "Central India": [
    "Chhattisgarh", "Madhya Pradesh",
  ],
  "North-Eastern India": [
    "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Tripura", "Sikkim",
  ],
};

export const REGION_NAMES = Object.keys(INDIAN_REGIONS);

/**
 * Given an array of region names, return all states/UTs that fall under those regions.
 * @param {string[]} regions - Array of region names (e.g., ["Northern India", "Western India"])
 * @returns {string[]} - Flat array of state/UT names
 */
export const getStatesForRegions = (regions) => {
  if (!Array.isArray(regions)) return [];
  const states = [];
  for (const region of regions) {
    if (INDIAN_REGIONS[region]) {
      states.push(...INDIAN_REGIONS[region]);
    }
  }
  return [...new Set(states)]; // deduplicate
};

/**
 * Given a state name, return its region.
 * @param {string} state
 * @returns {string|null}
 */
export const getRegionForState = (state) => {
  for (const [regionName, statesList] of Object.entries(INDIAN_REGIONS)) {
    if (statesList.includes(state)) return regionName;
  }
  return null;
};

// HTTP Status Codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};
