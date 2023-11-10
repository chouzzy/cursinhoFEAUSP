import { validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";

async function ErrorValidation(createdSchoolClass: SchoolClass | validationResponse): Promise<validationResponse> {
    
    function checkIfIsAError(createdSchoolClass: any): createdSchoolClass is validationResponse {
        return 'isValid' in createdSchoolClass;
    }

    if (checkIfIsAError(createdSchoolClass)) {
        //É um erro
        return createdSchoolClass

    } else {
        // não é um erro
        return {            
            isValid: true,
            statusCode: 202,
            successMessage:'Não foi encontrado nenhum tipo de erro.'
        }
    }

}
export {ErrorValidation}



