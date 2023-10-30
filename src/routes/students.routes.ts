import { Router } from "express"
import { CreateStudentController } from "../modules/registrations/useCases/Students/createStudents/CreateStudentsController"
import { CancelSubscriptionController } from "../modules/registrations/useCases/Students/cancelStudents/CancelSubscriptionController"
import { ListStudentsController } from "../modules/registrations/useCases/Students/listStudents/ListStudentsController"
import { UpdateStudentController } from "../modules/registrations/useCases/Students/updateStudents/UpdateStudentController"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"
import { ExcelListStudentsController } from "../modules/registrations/useCases/Students/excelListStudents/ExcelListStudentsController"
import { ListChargesStudentsController } from "../modules/registrations/useCases/Students/listChargesStudents/ListChargesStudentsController"
import { RefundStudentController } from "../modules/registrations/useCases/Students/refundStudent/RefundStudentController"
import { SyncStudentsController } from "../modules/registrations/useCases/Students/syncStudents/SyncStudentsController"

const studentsRoutes = Router()

const listStudentsController = new ListStudentsController()
studentsRoutes.get('/', ensureAuthenticated, listStudentsController.handle)

const excellistStudentsController = new ExcelListStudentsController()
studentsRoutes.get('/excel', ensureAuthenticated, excellistStudentsController.handle)

const createStudentController = new CreateStudentController()
studentsRoutes.post('/create', createStudentController.handle)

const updateStudentController = new UpdateStudentController()
studentsRoutes.put('/:studentID/update', ensureAuthenticated, updateStudentController.handle)

const cancelSubscriptionController = new CancelSubscriptionController()
studentsRoutes.put('/:studentID/:schoolClassID/cancel', ensureAuthenticated, cancelSubscriptionController.handle)

const refundStudentController = new RefundStudentController()
studentsRoutes.post('/:studentID/:chargeID/refund', ensureAuthenticated, refundStudentController.handle)

const listChargesStudentsController = new ListChargesStudentsController()
studentsRoutes.get('/:studentID/list', ensureAuthenticated, listChargesStudentsController.handle)

const syncStudentController = new SyncStudentsController()
studentsRoutes.post('/sync', ensureAuthenticated, syncStudentController.handle)


export {studentsRoutes}