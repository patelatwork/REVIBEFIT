import config from "../config/index.js";
import { GST_TYPES } from "../constants.js";

/**
 * Calculate GST on commission amount.
 * Intra-state (same state): CGST 9% + SGST 9%
 * Inter-state (different state): IGST 18%
 *
 * @param {number} commissionAmount - Commission amount in INR
 * @param {string} [labPartnerState] - Lab partner's state
 * @returns {{ type: string, cgst: number, sgst: number, igst: number, totalTax: number, cgstRate: number, sgstRate: number, igstRate: number }}
 */
export const calculateGST = (commissionAmount, labPartnerState) => {
  const platformState = config.platform.state;
  const gstRate = config.platform.gstRate; // 18
  const halfRate = gstRate / 2; // 9

  const isIntraState =
    labPartnerState &&
    platformState &&
    labPartnerState.toLowerCase() === platformState.toLowerCase();

  if (isIntraState) {
    const cgst = Math.round((commissionAmount * halfRate) / 100);
    const sgst = Math.round((commissionAmount * halfRate) / 100);
    return {
      type: GST_TYPES.INTRA_STATE,
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
    };
  }

  // Inter-state or state unknown
  const igst = Math.round((commissionAmount * gstRate) / 100);
  return {
    type: GST_TYPES.INTER_STATE,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: gstRate,
    cgst: 0,
    sgst: 0,
    igst,
    totalTax: igst,
  };
};

/**
 * Calculate commission and GST breakdown for a booking.
 *
 * @param {number} totalAmount - Total booking amount in INR
 * @param {number} commissionRate - Commission rate (e.g. 20 for 20%)
 * @param {string} [labPartnerState] - Lab partner's state
 * @returns {{ commissionAmount: number, gstBreakdown: Object, totalDeduction: number, netSettlement: number }}
 */
export const calculateBookingFinancials = (
  totalAmount,
  commissionRate,
  labPartnerState
) => {
  const commissionAmount = Math.round((totalAmount * commissionRate) / 100);
  const gstBreakdown = calculateGST(commissionAmount, labPartnerState);
  const totalDeduction = commissionAmount + gstBreakdown.totalTax;
  const netSettlement = totalAmount - totalDeduction;

  return {
    commissionAmount,
    gstBreakdown,
    totalDeduction,
    netSettlement,
  };
};

export default { calculateGST, calculateBookingFinancials };
