import express, { Router } from "express"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"
import { adminsRoutes } from "./admins.routes"
import { donationsRoutes } from "./donations.routes"
import { refreshTokenRoutes } from "./refreshToken.routes"
import { schoolClassRoutes } from "./schoolClass.routes"
import { studentsRoutes } from "./students.routes"
import { webhooksRoutes } from "./webhooks"
import { welcomeRoutes } from "./welcome.routes"
import { webhookEfiRoutes } from "./efiwebhook"


const router = Router()

//welcome routes
router.use('/', welcomeRoutes)
//donations routes
router.use('/donates', donationsRoutes)

// students routes
router.use('/students', studentsRoutes)

//regristrations routes
router.use('/admins', adminsRoutes)
router.use('/refresh-token', refreshTokenRoutes)

router.get('/logintest', express.json(), ensureAuthenticated, (req,res) => {
    return res.json({success: true})
})

router.use('/schoolClass', schoolClassRoutes)

router.use('/webhooks', webhooksRoutes)

router.use('/webhook-efi', webhookEfiRoutes)


export {router}