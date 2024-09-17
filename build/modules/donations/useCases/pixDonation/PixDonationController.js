"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixDonationController = void 0;
class PixDonationController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // const cert = fs.readFileSync(
                //     path.resolve(__dirname, `./${process.env.EFI_CERT}`)
                // )
                // const agent = new https.Agent({
                //     pfx: cert,
                //     passphrase: '',
                // })
                // const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64')
                // const config = {
                //     method: 'post',
                //     url: `${process.env.EFI_ENDPOINT}/oauth/token`, // Use uma variável de ambiente para a URL base
                //     headers: {
                //         Authorization: `Basic ${credentials}`, // Substitua 'credentials' pelas suas credenciais
                //         'Content-Type': 'application/json'
                //     },
                //     httpsAgent: agent, // Opcional: para configurações de proxy ou outros agentes HTTP
                //     data: {
                //         grant_type: 'client_credentials'
                //     }
                // };
                // await axios(config)
                //     .then(response => {
                //         // Lógica para lidar com a resposta bem-sucedida
                //         console.log(response.data);
                //         return res.status(202).json({ response: response.data })
                //     })
                //     .catch(error => {
                //         // Lógica para lidar com erros
                //         console.error(error);
                //         return res.status(400).json({ response: "resposta" })
                //     });
                // // return res.status(202).json({ response: "resposta" })
                return res.status(202).json('Pix Donation Controller acionado');
            }
            catch (error) {
                return res.status(403).send({ message: String(error) });
            }
        });
    }
}
exports.PixDonationController = PixDonationController;
