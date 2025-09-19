// src/modules/registrations/useCases/SchoolClass/listSchoolClass/ListSchoolClassCheck.ts

import { ValidationError } from "yup";
import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ListSchoolClassProps } from "./ListSchoolClassController";
import { listSchoolClassSchema } from "./ListSchoolClassSchema";

async function checkBody({ page, pageRange, status }: ListSchoolClassProps): Promise<validationResponse> {
    // check body properties
    try {
        const yupValidation = await listSchoolClassSchema.validate({ page, pageRange, status }, {
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




async function ErrorValidation(listSchoolClass: SchoolClass | validationResponse): Promise<validationResponse> {

    function checkIfIsAError(listSchoolClass: any): listSchoolClass is validationResponse {
        return 'isValid' in listSchoolClass;
    }

    if (checkIfIsAError(listSchoolClass)) {

        //É um erro
        return listSchoolClass
    } else {

        //Não é um erro
        return {
            isValid: true,
            statusCode: 202,
            successMessage: 'Não foi encontrado nenhum tipo de erro.'
        }
    }

}
export { checkBody, ErrorValidation }



