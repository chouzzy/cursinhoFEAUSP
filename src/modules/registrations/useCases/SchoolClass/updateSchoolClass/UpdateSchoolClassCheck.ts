import { ValidationError } from "yup";
import { validationResponse } from "../../../../../types";
import { UpdateSchoolClassRequestProps } from "./UpdateSchoolClassController";
import { updateSchoolClassSchema } from "./UpdateSchoolClassSchema";
import { Students } from "../../../entities/Students";
import { SchoolClass } from "../../../entities/SchoolClass";




async function checkBody(schoolClassData: UpdateSchoolClassRequestProps): Promise<validationResponse> {
    // check body properties
    try {
        const yupValidation = await updateSchoolClassSchema.validate(schoolClassData, {
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




async function ErrorValidation(updatedSchoolClass: SchoolClass | validationResponse): Promise<validationResponse> {

    function checkIfIsAError(updatedSchoolClass: any): updatedSchoolClass is validationResponse {
        return 'isValid' in updatedSchoolClass;
    }

    if (checkIfIsAError(updatedSchoolClass)) {

        //É um erro
        return updatedSchoolClass
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



