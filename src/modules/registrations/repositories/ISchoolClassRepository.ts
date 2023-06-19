import { Students } from "@prisma/client"
import { validationResponse } from "../../../types"
import { DocumentsTypes, SchoolClass, SchoolClassSelectiveStages } from "../entities/SchoolClass"
import { CreateSchoolClassRequestProps } from "../useCases/SchoolClass/createSchoolClass/CreateSchoolClassController"
import { CreateSchoolClassDocsRequestProps } from "../useCases/SchoolClass/createSchoolClassDocs/CreateSchoolClassDocsController"
import { CreateSchoolClassStagesRequestProps } from "../useCases/SchoolClass/createSchoolClassStages/CreateSchoolClassStagesController"
import { UpdateSchoolClassRequestProps } from "../useCases/SchoolClass/updateSchoolClass/UpdateSchoolClassController"


interface ISchoolClassRepository {

    listAllSchoolClasses(page: number, pageRange: number): Promise<validationResponse>

    createSchoolClass(schoolClassData: CreateSchoolClassRequestProps): Promise<validationResponse>

    updateSchoolClass(
        schoolClassData: UpdateSchoolClassRequestProps,
        schoolClassID: SchoolClass["id"],
        stripeProductID?: SchoolClass["stripeProductID"]
    ): Promise<validationResponse>

    deleteSchoolClass(schoolClassID: SchoolClass["id"]): Promise<validationResponse>

    createDocs(
        schoolClassDocsData: CreateSchoolClassDocsRequestProps[],
        schoolClassID: Students["id"]
    ): Promise<validationResponse>

    createStages(
        schoolClassStagesData: CreateSchoolClassStagesRequestProps[],
        schoolClassID: Students["id"]
    ): Promise<validationResponse>

    deleteDocs(
        docsID: DocumentsTypes["docsID"],
        schoolClassID: SchoolClass["id"]
    ): Promise<validationResponse>

    deleteStages(
        stagesID: SchoolClassSelectiveStages["stagesID"],
        schoolClassID: SchoolClass["id"]
    ): Promise<validationResponse>
}

export { ISchoolClassRepository }