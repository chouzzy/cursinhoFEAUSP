// src/modules/registrations/useCases/SchoolClass/listSchoolClass/ListSchoolClassSchema.ts

import * as yup from "yup" ;

const listSchoolClassSchema = yup.object({
    page: yup.number(),
    pageRange: yup.number(),
    status: yup.string().oneOf(['active', 'inactive', 'all'])
})

export { listSchoolClassSchema }