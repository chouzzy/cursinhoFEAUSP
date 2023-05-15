import { Router } from "express"
import { CreateSchoolClassController } from "../modules/registrations/useCases/SchoolClass/createSchoolClass/CreateSchoolClassController"
import { DeleteSchoolClassController } from "../modules/registrations/useCases/SchoolClass/deleteSchoolClass/DeleteSchoolClassController"
import { ListSchoolClassController } from "../modules/registrations/useCases/SchoolClass/listSchoolClass/ListSchoolClassController"
import { UpdateSchoolClassController } from "../modules/registrations/useCases/SchoolClass/updateSchoolClass/UpdateSchoolClassController"
import { CreateSchoolClassDocsController } from "../modules/registrations/useCases/SchoolClass/createSchoolClassDocs/CreateSchoolClassDocsController"
import { CreateSchoolClassStagesController } from "../modules/registrations/useCases/SchoolClass/createSchoolClassStages/CreateSchoolClassStagesController"
import { DeleteSchoolClassDocsController } from "../modules/registrations/useCases/SchoolClass/deleteSchoolClassDocs/DeleteSchoolClassDocsController"
import { DeleteSchoolClassStagesController } from "../modules/registrations/useCases/SchoolClass/deleteSchoolClassStages/DeleteSchoolClassStagesController"

const schoolClassRoutes = Router()

const listSchoolClassController = new ListSchoolClassController()
schoolClassRoutes.get('/', listSchoolClassController.handle)

const createSchoolClassController = new CreateSchoolClassController()
schoolClassRoutes.post('/create', createSchoolClassController.handle)

const createSchoolClassDocsController = new CreateSchoolClassDocsController()
schoolClassRoutes.post('/:schoolClassID/docs/create', createSchoolClassDocsController.handle)

const createSchoolClassStagesController = new CreateSchoolClassStagesController()
schoolClassRoutes.post('/:schoolClassID/stages/create', createSchoolClassStagesController.handle)

const deleteSchoolClassDocsController = new DeleteSchoolClassDocsController()
schoolClassRoutes.delete('/:schoolClassID/docs/:docsID/delete', deleteSchoolClassDocsController.handle)

const deleteSchoolClassStagesController = new DeleteSchoolClassStagesController()
schoolClassRoutes.delete('/:schoolClassID/stages/:stagesID/delete', deleteSchoolClassStagesController.handle)

const updateSchoolClassController = new UpdateSchoolClassController()
schoolClassRoutes.put('/:schoolClassID/update', updateSchoolClassController.handle)

const deleteSchoolClassController = new DeleteSchoolClassController()
schoolClassRoutes.delete('/:schoolClassID/delete', deleteSchoolClassController.handle)



export {schoolClassRoutes}