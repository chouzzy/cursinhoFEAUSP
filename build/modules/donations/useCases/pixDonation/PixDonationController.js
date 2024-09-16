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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixDonationController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
class PixDonationController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cert = fs_1.default.readFileSync(path_1.default.resolve(__dirname, `./${process.env.EFI_CERT}`));
                const agent = new https_1.default.Agent({
                    pfx: cert,
                    passphrase: '',
                });
                const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.GEN_CLIENT_SECRET}`).toString('base64');
                return res.status(202).json({ response: "resposta" });
            }
            catch (error) {
                return res.status(403).send({ message: String(error) });
            }
        });
    }
}
exports.PixDonationController = PixDonationController;
