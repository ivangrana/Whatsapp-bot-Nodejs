const fs = require('fs');
const qrcode = require('qrcode-terminal'); //QR Code no Terminal

const { Client, MessageMedia } = require('whatsapp-web.js'); // Whatsapp

const SESSION_FILE_PATH = './session.json';
let ws;

let dataSession;

//Validação da sessão
const withSession = () => {
    dataSession = require(SESSION_FILE_PATH);
    ws = new Client({ session: dataSession });
    ws.on('ready', () => console.log('Cliente está pronto!'));
    ws.on('auth_failure', () => {
        console.log('** O erro de autenticação recupera o QRCODE (Excluir o arquivo session.json) **');
    })
    ws.initialize();
}


const withOutSession = () => {
    ws = new Client();
    // Geramos o QRCODE no Terminal
    ws.on('qr', qr => { qrcode.generate(qr, { small: true }); });
    ws.on('ready', () => console.log('Cliente está pronto!'));
    ws.on('auth_failure', () => {
        console.log('** O erro de autenticação regenera o QRCODE (Excluir o arquivo session.json) **');
    })
    // Se for autenticado, gera um arquivo com as variáveis  de sessão
    ws.on('authenticated', (session) => {
        dataSession = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
            if (err) console.log(err);
        });
    });
    ws.initialize();
}

/**
 * Verificamos se existe um arquivo com credenciais!
*/

(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();

 // Enviar mensagem
 const sendMessage = (number = null, text = null) => {
    number = number.replace('@c.us', '');
    number = `${number}@c.us`
    const message = text || `Olá, eu sou um BOT`;
    ws.sendMessage(number, message);
}

// Enviar mensagem Multimidia
const sendMessageMedia = (number, fileName, caption) => {
    number = number.replace('@c.us', '');
    number = `${number}@c.us`
    const media = MessageMedia.fromFilePath(`./media/${fileName}`)
    ws.sendMessage(number, media, { caption: caption });

}

// API
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));

// Controllers
const sendText = (req, res) => {
    const { message, number } = req.body
    sendMessage(number, message)
    res.send({ status: 'Enviado mensagem!' })
}


const sendMidia = (req, res) => {
    const { number, fileName, caption } = req.body
    sendMessageMedia(number, fileName, caption)
    res.send({ status: 'Enviado mensagem multimidia!' })
}


// Rotas
app.post('/send', sendText);
app.post('/sendMedia', sendMidia);

// Ativar o Servidor

app.listen(9000, () => console.log('Server ready!'));
