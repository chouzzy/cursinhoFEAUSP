import { Request, Response } from "express";
import { SchoolClass } from "../../../entities/SchoolClass";
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository";
import { ErrorValidation } from "./ListSchoolClassCheck";
import { ListSchoolClassUseCase } from "./ListSchoolClassUseCase";

interface ListSchoolClassProps {
    page: number,
    pageRange: number
    status: SchoolClass["status"]
}

class ListSchoolClassController {

    async handle(req: Request, res: Response): Promise<Response> {

        // Instanciando o useCase no repositório com as funções

        const { page, pageRange, status }: ListSchoolClassProps = req.query as unknown as ListSchoolClassProps;

        const schoolClassRepository = new SchoolClassRepository()

        const listSchoolClassUseCase = new ListSchoolClassUseCase(schoolClassRepository);

        const schoolClassResponse = await listSchoolClassUseCase.execute({ page, pageRange, status })

        return res.status(
            schoolClassResponse.statusCode
        ).json({ schoolClassResponse })

    }
}

export { ListSchoolClassController, ListSchoolClassProps }