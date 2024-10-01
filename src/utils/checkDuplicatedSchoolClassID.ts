import { Students } from "../modules/registrations/entities/Students";

async function checkDuplicateSchoolClassIDs(purcharsedSubscriptions: Students["purcharsedSubscriptions"]) {
    
    const uniqueIDs = new Set();

    for (const subscription of purcharsedSubscriptions) {
        if (uniqueIDs.has(subscription.schoolClassID)) {
            return true; // Duplicate found
        }
        uniqueIDs.add(subscription.schoolClassID);
    }

    return false; // No duplicates found
}

export {checkDuplicateSchoolClassIDs}