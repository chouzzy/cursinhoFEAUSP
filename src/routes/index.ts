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
import { webhookSantanderRoutes } from "./webhookSantanderRoutes"
import { inscriptionsRoutes } from "./inscriptionsRoutes"
import { couponRoutes } from "./coupon.routes"
import { asaasWebhookRoutes } from "./asaasWebhookRoutes"
import { publicRateLimit } from "../middlewares/rateLimit"
import { schoolClassListCache, invalidateSchoolClassCacheOnWrite } from "../middlewares/schoolClassCache"


const router = Router()


router.use('/webhooks', webhooksRoutes)
router.use('/webhooks/asaas', asaasWebhookRoutes);
router.use(express.json({type:"application/json"}))

// limite por IP nas rotas públicas que criam cobrança, registro ou fazem login
router.use(publicRateLimit)

// rota de teste de e-mail era pública: qualquer um disparava e-mail pelo MailerSend
router.post('/inscriptions/test-email', ensureAuthenticated)

//welcome routes
router.use('/', welcomeRoutes)
//donations routes
router.use('/donates', donationsRoutes)

// students routes
router.use('/students', studentsRoutes)
// students routes
router.use('/inscriptions', inscriptionsRoutes);

router.use('/coupons', couponRoutes)


//regristrations routes
router.use('/admins', adminsRoutes)
router.use('/refresh-token', refreshTokenRoutes)

router.get('/logintest', ensureAuthenticated, (req, res) => {
    return res.json({ success: true })
})

// cache curto da lista pública de turmas; qualquer escrita em /schoolClass limpa o cache
router.use('/schoolClass', invalidateSchoolClassCacheOnWrite, schoolClassListCache, schoolClassRoutes)


router.use('/webhook-efi', webhookEfiRoutes)
router.use('/webhooks', webhookSantanderRoutes)


export { router }