import axios from 'axios';
import https from 'https';
import fs from 'fs';

// --- CONFIGURAÇÃO ---
const SANTANDER_CLIENT_ID = process.env.SANTANDER_CLIENT_ID_PROD;
const SANTANDER_CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET_PROD;
const CERT_PATH = process.env.SANTANDER_CERT_PATH;
const KEY_PATH = process.env.SANTANDER_KEY_PATH;

if (!SANTANDER_CLIENT_ID || !SANTANDER_CLIENT_SECRET || !CERT_PATH || !KEY_PATH) {
  throw new Error("As variáveis de ambiente do Santander não foram configuradas corretamente.");
}

const authString = Buffer.from(`${SANTANDER_CLIENT_ID}:${SANTANDER_CLIENT_SECRET}`).toString('base64');

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
});

const apiClient = axios.create({
  baseURL: 'https://trust-pix.santander.com.br',
  httpsAgent,
});

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('Gerando novo access_token para o Santander...');
  
  // **A CORREÇÃO ESTÁ AQUI**
  // O corpo da requisição precisa incluir o parâmetro 'scope' com as permissões desejadas.
  const requestBody = new URLSearchParams();
  requestBody.append('grant_type', 'client_credentials');
  // Adicionamos os escopos para criar e ler cobranças, que são os mais comuns.
  requestBody.append('scope', 'cob.write cob.read pix.write pix.read webhook.write webhook.read');

  try {
    const response = await axios.post(
      'https://trust-pix.santander.com.br/oauth/token',
      requestBody, // Usamos o corpo da requisição formatado
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`,
        },
        httpsAgent,
      }
    );

    const { access_token, expires_in } = response.data;
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
    console.log('Novo access_token gerado com sucesso.');
    
    if (!accessToken) {
      throw new Error('Access token não recebido do Santander.');
    }
    return accessToken;
  } catch (error: any) {
    console.error('Erro ao obter access_token do Santander:', error.response?.data || error.message);
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  const token = await getAccessToken();
  
  const response = await apiClient.put(`/cob/${txid}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.data;
}

export const santanderApiClient = {
  createCob,
};

