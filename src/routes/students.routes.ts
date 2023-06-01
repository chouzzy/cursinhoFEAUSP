import { Router } from "express"
import { CreateStudentController } from "../modules/registrations/useCases/Students/createStudents/CreateStudentsController"
import { DeleteStudentController } from "../modules/registrations/useCases/Students/deleteStudents/DeleteStudentController"
import { ListStudentsController } from "../modules/registrations/useCases/Students/listStudents/ListStudentsController"
import { UpdateStudentController } from "../modules/registrations/useCases/Students/updateStudents/UpdateStudentController"

const studentsRoutes = Router()

const listStudentsController = new ListStudentsController()
studentsRoutes.get('/', listStudentsController.handle)

const createStudentController = new CreateStudentController()
studentsRoutes.post('/create', createStudentController.handle)

const updateStudentController = new UpdateStudentController()
studentsRoutes.put('/:studentID/update', updateStudentController.handle)

const deleteStudentController = new DeleteStudentController()
studentsRoutes.delete('/:studentID/delete', deleteStudentController.handle)


export {studentsRoutes}