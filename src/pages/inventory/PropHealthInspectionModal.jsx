'use client';

import { PropInspectionModal } from './PropInspectionModal';
import { PropInspectionReviewModal } from '@/components/audits/PropInspectionReviewModal';
import { supabase } from '@/lib/supabase/client';

export { PropInspectionModal };
export { PropInspectionReviewModal as PropHealthInspectionModal } from '@/components/audits/PropInspectionReviewModal';
export { PropInspectionReviewModal } from '@/components/audits/PropInspectionReviewModal';

/**
 * Strict Single-Asset Inspection Mutation function
 * Targets strictly by unique item_code (e.g. 'ASH-ELEC-MOU-0001')
 * Zero batch side-effects: never touches sibling units or parent prop SKU
 */
export async function executeStrictAssetInspection({
  currentScannedProp,
  selectedCondition,
  newLocation,
  inspectorNotes,
}) {
  const targetSerialCode = currentScannedProp.item_code; // e.g. "ASH-ELEC-MOU-0001"

  if (!targetSerialCode) {
    throw new Error('Inspection mutation aborted: item_code is missing');
  }

  const { data, error } = await supabase
    .from('properties')
    .update({
      physical_condition: selectedCondition, // Only updates this unit (e.g. DAMAGED)
      godown: newLocation.godown,
      floor: newLocation.floor,
      rack: newLocation.rack,
      shelf: newLocation.shelf,
      storage_location: `${newLocation.godown} > ${newLocation.floor} > ${newLocation.rack} > ${newLocation.shelf}`,
      last_audit_date: new Date().toISOString(),
      damage_notes: inspectorNotes,
    })
    .eq('item_code', targetSerialCode); // MUST TARGET ONLY THIS UNIQUE SERIAL CODE!

  if (error && error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
    throw error;
  }

  return { success: true, data };
}

export default PropInspectionModal;
