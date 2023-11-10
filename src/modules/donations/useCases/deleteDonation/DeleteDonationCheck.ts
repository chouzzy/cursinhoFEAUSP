import { ValidationError } from "yup";
import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { DeleteDonationProps } from "./DeleteDonationController";
import { donationSchema } from "./DeleteDonationSchema";

async function checkBody(donationID:Donations["id"]): Promise<validationResponse> {
    // check body properties
    try {
        const yupValidation = await donationSchema.validate({donationID}, {
            abortEarly:false,
        })
        return {isValid:true, statusCode:202}
    } 
    catch (error) {
        if (error instanceof ValidationError) {
            return {errorMessage: error.errors, statusCode: 403, isValid: false}
    }}
    return {isValid:true, statusCode:202}
}

async function ErrorValidation(deletedDonation: Donations | validationResponse): Promise<validationResponse> {
    
    function checkIfIsAError(deletedDonation: any): deletedDonation is validationResponse {
        return 'isValid' in deletedDonation;
    }

    if (checkIfIsAError(deletedDonation)) {
        //É um erro
        return deletedDonation

    } else {
        // não é um erro
        return {            
            isValid: true,
            statusCode: 202,
            successMessage:'Não foi encontrado nenhum tipo de erro.'
        }
    }

}
export {ErrorValidation, checkBody}



