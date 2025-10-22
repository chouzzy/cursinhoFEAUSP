import axios, { AxiosRequestConfig } from 'axios';
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

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
});

// apiClient continua com a baseURL correta para /cob
// mas não será usado diretamente para o token ou o cob PUT
const apiClient = axios.create({
    baseURL: 'https://trust-pix.santander.com.br',
    httpsAgent, // Mantemos aqui caso seja usado para outras chamadas futuras
});


let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  // accessToken = null; // Descomente para forçar a renovação

  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('SANTANDER_CLIENT_ID:', SANTANDER_CLIENT_ID);
  console.log('SANTANDER_CLIENT_SECRET:', SANTANDER_CLIENT_SECRET);
  console.log('Gerando novo access_token para o Santander com scopes...');

  // **AJUSTE 1: Solicitando Scopes no Corpo**
  const urlForToken = `https://trust-pix.santander.com.br/oauth/token`; // URL base do token
  const requiredScopes = 'cob.write cob.read pix.read pix.write webhook.read webhook.write';

  const requestBody = new URLSearchParams();
  requestBody.append('grant_type', 'client_credentials'); // Grant_type também no corpo é o padrão OAuth
  requestBody.append('client_id', SANTANDER_CLIENT_ID || '');
  requestBody.append('client_secret', SANTANDER_CLIENT_SECRET || '');
  requestBody.append('scope', requiredScopes); // Solicitamos os scopes necessários aqui

  console.log('Request URL for Token:', urlForToken);
  console.log('Request Body for Token:', requestBody.toString());

  try {
    const response = await axios.post(
      urlForToken,
      requestBody,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent, // Certificado necessário para a conexão
      }
    );

    console.log('Access Token Response:', response.data);
    // Verificamos se os scopes foram concedidos
    if (!response.data.scopes || !requiredScopes.split(' ').every(scope => response.data.scopes.includes(scope))) {
         console.warn(`Nem todos os scopes solicitados foram concedidos pelo Santander. Recebido: ${response.data.scopes}`);
         // Poderíamos lançar um erro aqui se cob.write for essencial
         // throw new Error('Scope cob.write não concedido pelo Santander.');
    } else {
        console.log("Scopes necessários foram concedidos!");
    }

    const { access_token, expires_in } = response.data;
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
    console.log('Novo access_token gerado com sucesso.');

    if (!accessToken) {
      throw new Error('Access token não recebido do Santander.');
    }
    return accessToken;
  } catch (error: any) {
    console.error('Erro ao obter access_token do Santander:', error.response?.status, error.response?.data || error.message);
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  const token = await getAccessToken(); // Pega o token (esperamos que agora com os scopes certos)
  const url = `https://trust-pix.santander.com.br/cob/${txid}`;

  console.log(`Tentando fazer PUT para: ${url}`);
  console.log(`Usando token com scopes decodificados: ${accessToken ? JSON.stringify(accessToken.split('.')[1] ? JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString()) : {}) : 'N/A'}`);


  // **AJUSTE 2: Garantindo httpsAgent na Chamada PUT**
  const options: AxiosRequestConfig = {
    method: 'PUT',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: data,
    httpsAgent: httpsAgent // Inclui os certificados na chamada direta
  };

  try {
    const response = await axios.request(options);
    console.log(`PUT para ${url} bem-sucedido.`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao fazer PUT para ${url}:`, error.response?.status, error.response?.data || error.message);
    console.error('Opções da requisição (sem dados):', { method: options.method, url: options.url, headers: options.headers });
    throw error;
  }
}

export const santanderApiClient = {
  createCob,
};

