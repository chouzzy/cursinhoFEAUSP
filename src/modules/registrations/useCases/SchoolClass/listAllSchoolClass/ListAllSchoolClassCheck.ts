import { ValidationError } from "yup";
import { validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";

async function ErrorValidation(schoolClass: SchoolClass[] | validationResponse): Promise<validationResponse> {

    function checkIfIsAError(schoolClass: any): schoolClass is validationResponse {
        return 'isValid' in schoolClass;
    }

    if (checkIfIsAError(schoolClass)) {
        //É um erro
        return schoolClass
    } else {
        //Não é um erro
        if (schoolClass.length == 0) {
            return {
                isValid: false,
                statusCode: 404,
                errorMessage: 'Não foi encontrada nenhuma turma.'
            }
        }
        return {
            isValid: true,
            statusCode: 202,
            successMessage: 'Não foi encontrado nenhum tipo de erro.'
        }
    }

}

export { ErrorValidation }