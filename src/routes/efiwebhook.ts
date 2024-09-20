import { Router } from "express"
import { prisma } from "../prisma";
import { pixWebhookResponseProps } from "../types";
// import { io } from "../server";

interface EfiWebhookResponse {
    pix: PixTransaction[];
  }
  
  interface PixTransaction {
    endToEndId: string;
    txid: string;
    chave: string;
    valor: number; // Ou string se precisar manter o formato original
    horario: string; // Considerar usar uma biblioteca de data para melhor manipulação
  }

const webhookEfiRoutes = Router()


webhookEfiRoutes.post('/pix', async (req, res) => {

    console.log('Rota webhook pix acionada');


    try {

      const pixWebhookResponse:pixWebhookResponseProps = req.body

      console.log(pixWebhookResponse)

      const pixRecebido :pixWebhookResponseProps["pix"][0] = pixWebhookResponse.pix[0]

      const donation = await prisma.donations.update({
        where: {
          txid: pixRecebido.txid
        },
        data: {
          pixStatus: 'CONCLUIDA'
        }
      }) 

      // const students = await prisma.students.findFirst({
      //   where: {
      //     txid: req.body
      //   }
      // }) 

      if (!donation) {
        console.log(` Pix ${pixRecebido.txid} falhou devido a ausência de donation no banco de dados.`)
        return res.sendStatus(202)
      }

        console.log(` Pix ${pixRecebido.txid} recebido com sucesso.`)
        res.sendStatus(200);
    } catch (error) {
        console.error('Erro ao processar o webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})





export { webhookEfiRoutes }