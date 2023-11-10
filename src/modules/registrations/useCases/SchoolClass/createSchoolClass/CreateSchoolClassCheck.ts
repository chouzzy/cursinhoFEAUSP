import { ValidationError } from "yup";
import { validationResponse } from "../../../../../types";
import { CreateSchoolClassRequestProps } from "./CreateSchoolClassController";
import { createSchoolClassSchema } from "./CreateSchoolClassSchema";
import { Students } from "../../../entities/Students";
import { SchoolClass } from "../../../entities/SchoolClass";




async function checkBody(schoolClassData: CreateSchoolClassRequestProps): Promise<validationResponse> {
    // check body properties
    try {
        const yupValidation = await createSchoolClassSchema.validate(schoolClassData, {
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




async function ErrorValidation(createdSchoolClass: SchoolClass | validationResponse): Promise<validationResponse> {

    function checkIfIsAError(createdSchoolClass: any): createdSchoolClass is validationResponse {
        return 'isValid' in createdSchoolClass;
    }

    if (checkIfIsAError(createdSchoolClass)) {

        //É um erro
        return createdSchoolClass
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



