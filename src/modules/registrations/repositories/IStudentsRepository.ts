import { validationResponse } from "../../../types"
import { Students, purcharsedSubscriptions } from "../entities/Students"
import { CreateStudentRequestProps } from "../useCases/Students/createStudents/CreateStudentsController"
import { ListStudentsQuery } from "../useCases/Students/listStudents/ListStudentsController"
import { UpdateStudentRequestProps } from "../useCases/Students/updateStudents/UpdateStudentController"


interface IStudentsRepository {

    filterStudent(
        {id, name, email, cpf, paymentStatus, schoolClassID}:ListStudentsQuery,
        page: number,
        pageRange: number
    ): Promise<validationResponse>

    createStudent(studentData: CreateStudentRequestProps): Promise<validationResponse>

    updateStudent(studentData: UpdateStudentRequestProps, studentID: Students["id"]): Promise<validationResponse>
    
    deleteStudent(studentID: Students["id"]): Promise<validationResponse>
}

export {IStudentsRepository}