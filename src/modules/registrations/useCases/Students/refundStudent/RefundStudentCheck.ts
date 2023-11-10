import { ValidationError } from "yup";
import { refundStudentSchema } from "./RefundStudentSchema";
import { Students } from "@prisma/client";
import { validationResponse } from "../../../../../types";

async function checkBody(studentID: Students["id"], chargeID:string): Promise<validationResponse> {
    // check body properties
    try {
        const yupValidation = await refundStudentSchema.validate({studentID, chargeID}, {
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

async function ErrorValidation(createdStudent: Students | validationResponse): Promise<validationResponse> {

    function checkIfIsAError(createdStudent: any): createdStudent is validationResponse {
        return 'isValid' in createdStudent;
    }

    if (checkIfIsAError(createdStudent)) {
        //É um erro
        return createdStudent
    } else {
        //Não é um erro
        return {            
            isValid: true,
            statusCode: 202,
            successMessage:'Não foi encontrado nenhum tipo de erro.'
        }
    }

}
export {checkBody, ErrorValidation}



