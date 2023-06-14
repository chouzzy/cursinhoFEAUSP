import { Router } from "express"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"
import { adminsRoutes } from "./admins.routes"
import { donationsRoutes } from "./donations.routes"
import { refreshTokenRoutes } from "./refreshToken.routes"
import { schoolClassRoutes } from "./schoolClass.routes"
import { studentsRoutes } from "./students.routes"
import { webhooksRoutes } from "./webhooks"


const router = Router()

//donations routes
router.use('/donates', donationsRoutes)

// students routes
router.use('/students', studentsRoutes)

//regristrations routes
router.use('/admins', adminsRoutes)
router.use('/refresh-token', refreshTokenRoutes)

router.get('/logintest', ensureAuthenticated, (req,res) => {
    return res.json({success: true})
})

router.use('/schoolClass', ensureAuthenticated, schoolClassRoutes)
router.use('/webhooks', webhooksRoutes)


export {router}