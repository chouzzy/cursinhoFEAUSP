import { validationResponse } from "../../../types"
import { Students } from "../entities/Students"
import { CreatePixStudentRequestProps } from "../useCases/Students/createPixStudents/CreatePixStudentsController"
import { CreateStudentRequestProps } from "../useCases/Students/createStudents/CreateStudentsController"
import { ListStudentsQuery } from "../useCases/Students/listStudents/ListStudentsController"
import { UpdateStudentRequestProps } from "../useCases/Students/updateStudents/UpdateStudentController"


interface IStudentsRepository {

    filterStudent(
        { id, name, email, cpf, paymentStatus, schoolClassID }: ListStudentsQuery,
        page: number,
        pageRange: number
    ): Promise<validationResponse>

    createStudentPaymentIntent(studentData: CreateStudentRequestProps): Promise<validationResponse>

    createPixStudent(studentData: CreatePixStudentRequestProps): Promise<validationResponse>

    updateStudent(studentData: UpdateStudentRequestProps, studentID: Students["id"]): Promise<validationResponse>

    cancelSubscription(studentID: Students["id"], stripeSubscriptionID:Students["purcharsedSubscriptions"][0]["stripeSubscriptionID"]): Promise<validationResponse>
    listChargesStudent(studentID: Students["id"]): Promise<validationResponse>
    refundStudent(studentID: Students["id"], chargeID: string): Promise<validationResponse>

    syncStudents(): Promise<validationResponse>
}

export { IStudentsRepository }