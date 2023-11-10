import { Request, Response } from "express";
import { SchoolClass } from "../../../entities/SchoolClass";
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository";
import { ErrorValidation } from "./ListAllSchoolClassCheck";
import { ListAllSchoolClassUseCase } from "./ListAllSchoolClassUseCase";

interface ListAllSchoolClassProps {
    // id: SchoolClass["id"],
    title: SchoolClass["title"]
}

class ListAllSchoolClassController {

    async handle(req: Request, res: Response): Promise<Response> {

        // Instanciando o useCase no repositório com as funções

        const { title }: ListAllSchoolClassProps = req.query as unknown as ListAllSchoolClassProps;
        // const { id } = req.params

        const schoolClassRepository = new SchoolClassRepository()

        const listSchoolClassUseCase = new ListAllSchoolClassUseCase(schoolClassRepository);

        const schoolClassResponse = await listSchoolClassUseCase.execute(title)

        return res.status(
            schoolClassResponse.statusCode
        ).json({ schoolClassResponse })

    }
}

export { ListAllSchoolClassController, ListAllSchoolClassProps }