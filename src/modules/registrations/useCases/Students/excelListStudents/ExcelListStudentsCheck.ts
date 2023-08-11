import { ValidationError } from "yup";
import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { ExcelListStudentsQuery } from "./ExcelListStudentsController";
import { listStudentsSchema } from "./ExcelListStudentsSchema";


async function checkQuery(studentsQuery: ExcelListStudentsQuery) {

    try {
        await listStudentsSchema.validate(studentsQuery, {
            abortEarly: false
        })
    } catch (error) {
        if (error instanceof ValidationError) {
            return { errorMessage: error.errors, statusCode: 403, isValid: false }
        }
    }

    return { isValid: true, statusCode: 302 }

}

async function ErrorValidation(student: Students[] | validationResponse): Promise<validationResponse> {

    function checkIfIsAError(student: any): student is validationResponse {
        return 'isValid' in student;
    }

    if (checkIfIsAError(student)) {
        //É um erro
        return student
    } else {
        //Não é um erro
        if (student.length == 0) {
            return {
                isValid: false,
                statusCode: 404,
                errorMessage: 'Não foi encontrado nenhum estudante.'
            }
        }
        return {
            isValid: true,
            statusCode: 202,
            successMessage: 'Não foi encontrado nenhum tipo de erro.'
        }
    }

}

export { checkQuery, ErrorValidation }