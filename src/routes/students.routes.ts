import express, { Router } from "express"
import { CreateStudentController } from "../modules/registrations/useCases/Students/createStudents/CreateStudentsController"
import { CancelSubscriptionController } from "../modules/registrations/useCases/Students/cancelStudents/CancelSubscriptionController"
import { ListStudentsController } from "../modules/registrations/useCases/Students/listStudents/ListStudentsController"
import { UpdateStudentController } from "../modules/registrations/useCases/Students/updateStudents/UpdateStudentController"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"
import { ExcelListStudentsController } from "../modules/registrations/useCases/Students/excelListStudents/ExcelListStudentsController"
import { ListChargesStudentsController } from "../modules/registrations/useCases/Students/listChargesStudents/ListChargesStudentsController"
import { RefundStudentController } from "../modules/registrations/useCases/Students/refundStudent/RefundStudentController"
import { SyncStudentsController } from "../modules/registrations/useCases/Students/syncStudents/SyncStudentsController"
import { CreatePixStudentController } from "../modules/registrations/useCases/Students/createPixStudents/CreatePixStudentsController"

const studentsRoutes = Router()

const listStudentsController = new ListStudentsController()
studentsRoutes.get('/', express.json(),  ensureAuthenticated, listStudentsController.handle)

const excellistStudentsController = new ExcelListStudentsController()
studentsRoutes.get('/excel', express.json(),  ensureAuthenticated, excellistStudentsController.handle)

const createStudentController = new CreateStudentController()
studentsRoutes.post('/create', express.json(),  createStudentController.handle)

// PIX
const pixStudentController = new CreatePixStudentController()
studentsRoutes.post('/pix', express.json(),  pixStudentController.handle)

const updateStudentController = new UpdateStudentController()
studentsRoutes.put('/:studentID/update', express.json(),  ensureAuthenticated, updateStudentController.handle)

const cancelSubscriptionController = new CancelSubscriptionController()
studentsRoutes.put('/:studentID/:schoolClassID/cancel', express.json(),  ensureAuthenticated, cancelSubscriptionController.handle)

const refundStudentController = new RefundStudentController()
studentsRoutes.post('/:studentID/:chargeID/refund', express.json(),  ensureAuthenticated, refundStudentController.handle)

const listChargesStudentsController = new ListChargesStudentsController()
studentsRoutes.get('/:studentID/list', express.json(),  ensureAuthenticated, listChargesStudentsController.handle)

const syncStudentController = new SyncStudentsController()
studentsRoutes.post('/sync', express.json(),  ensureAuthenticated, syncStudentController.handle)


export {studentsRoutes}