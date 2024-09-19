import { ValidationError } from "yup";
import { errorSchema } from "../../../../errors/ErrorSchema";
import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { createPixDonationSchema } from "./CreatePixDonationSchema";
import { CreatePixDonationProps } from "./CreatePixDonationController";

async function checkBody(pixDonationData: CreatePixDonationProps): Promise<validationResponse> {
    // check body properties
    try {
        await createPixDonationSchema.validate(pixDonationData, {
            abortEarly: false,
        })

        return { isValid: true, statusCode: 202 }
    }
    catch (error) {
        if (error instanceof ValidationError) {
            return { errorMessage: error.errors, statusCode: 403, isValid: false }
        }
    }
    return { isValid: true, statusCode: 202 }
}

export { checkBody }



