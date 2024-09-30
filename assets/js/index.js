/**
 *  Uma descricao rapida do que se trata cada uma das bibliotecas consumidas dentro da promisse:
 *  - tinyFaceDetector: E a biblioteca responsavel por realizar o procedimento de seguimentacao de uma imagem e atribuir as classes de objetos/rosto para prcessamento.
 *  - faceLandmark68Net: E a biblioteca responsavel por realizar dentro da classe de objeto, a cricao dos pontos de identificacao, que o modelo de aprendizado supervisionado ira consumir para definir os pontos em comum entre todas imagens de entrada, do que sera comparado no futuro pelas previsioes para autentificacao e habilitacao de acesso do usuario.
 *  - faceRecognitionNet: E responsavel por atraves da matris de pixels vindo de entrada, buscar nas bases de dados da aplicacao de quem se trata aquele usuario e buscar seus dados pessoais.
 *  - faceExpressionNet: E a biblioteca responsavel por dectecar emocoes e expressoes vindas do usuarios e resgistra-las.
 *  - ageGenderNet: E uma biblioteca responsavel por registrar uma tentativa de melhor esforco com base em um tempo, qual seria a minha idade e meu sexo (masculino, feminino). Atraves de um modelo treinado com dados reais de pessoas e suas fotos de uma aproximacao do que seria a imagem vinda como entrada e gerar uma previsao disto.
 *  - ssdMobilenetv1: E a biblioteca responsavel por fazer a estilizacao do faceLandmark68Net e aplicar os quadrados de deteccao e etc.
 */

// Função para converter a matriz de pixels RGB em uma string para salvar no arquivo .txt
function convertRgbMatrixToString(rgbMatrix) {
    return rgbMatrix.map(row => row.map(pixel => `(${pixel.join(',')})`).join(' ')).join('\n');
}

// Função para converter a matriz de pixels em tons de cinza em uma string para salvar no arquivo .txt
function convertGrayMatrixToString(grayMatrix) {
    return grayMatrix.map(row => row.join(' ')).join('\n');
}

// Função para criar e baixar o arquivo .txt
function downloadTxtFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para converter uma imagem para tons de cinza e gerar uma matriz de intensidades
function getGrayscalePixelMatrixFromCanvas(canvas) {
    const { width, height } = canvas;

    // Reduzir a resolução do canvas para economizar processamento
    const targetWidth = Math.floor(width * 0.5);  // Reduz pela metade a largura
    const targetHeight = Math.floor(height * 0.5);  // Reduz pela metade a altura

    // Criar um canvas offscreen (como se fosse uma imagem desenhada maualmente pelo computador) menor para a conversão
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // Desenhar a imagem da câmera no canvas offscreen
    offscreenCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    // Obter os pixels da imagem do canvas offscreen
    const imageData = offscreenCtx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;

    // Declaracao da matriz de intensidades dos tons de cinza
    const grayMatrix = [];

    for (let y = 0; y < targetHeight; y++) {
        const row = [];
        for (let x = 0; x < targetWidth; x++) {
            const index = (y * targetWidth + x) * 4;
            const r = data[index];      // Componente Vermelho
            const g = data[index + 1];  // Componente Verde
            const b = data[index + 2];  // Componente Azul

            // Converter para tons de cinza usando a fórmula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Adicionar o valor de cinza à linha (largura da matriz)
            row.push(gray);
        }
        grayMatrix.push(row);  // Adicionar a linha à matriz (largura da matriz)
    }

    return grayMatrix;
}


// Função para obter a matriz de pixels com valores RGB (Vermelho, Verde e Azul)
function getAquisicaoDaImagemEmRGB(canvas) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Reduzir a resolução do canvas para minimizar dados processados
    const targetWidth = Math.floor(width * 0.5);  // Reduz pela metade a largura
    const targetHeight = Math.floor(height * 0.5);  // Reduz pela metade a altura

    // Criar um canvas menor (desenho manual) para diminuir o uso de bits
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // Desenhar a imagem da câmera em uma resolução mais baixa
    offscreenCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    const imageData = offscreenCtx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;

    // Declarar a matriz de pixels RGB
    const rgbMatrix = [];

    for (let y = 0; y < targetHeight; y++) {
        const row = [];
        for (let x = 0; x < targetWidth; x++) {
            const index = (y * targetWidth + x) * 4;
            const r = data[index];      // Componente Vermelho
            const g = data[index + 1];  // Componente Verde
            const b = data[index + 2];  // Componente Azul

            // Adicionar o pixel RGB à linha (largura da matriz)
            row.push([r, g, b]);
        }
        rgbMatrix.push(row);  // Adicionar a linha à matriz (largura da matriz)
    }

    return rgbMatrix;
}


const camera = document.getElementById('camera')

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
        if (Array.isArray(devices)) {
            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    if (device.label.includes('')) {
                        navigator.getUserMedia(
                            {
                                video: {
                                    deviceId: device.deviceId
                                }
                            },
                            stream => camera.srcObject = stream,
                            error => console.error(error)
                        )
                    }
                }
            })
        }
    })
}

const leituraDasFeatures = () => {
    const name = ['Gustavo']
    name.map(async label => {
        const descricao = [];
        for(let i = 1; i < 5; i++){
            const imagens = await faceapi.fetchImage(`/assets/lib/labels/${name}/${i}.jpg`);
            const detecoes = await faceapi.detectSingleFace(imagens).withFaceLandmarks().withFaceDescriptor();
            descricao.push(detecoes.descriptor)
        }
    })
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/models')
]).then(startVideo)


camera.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(camera);
    const canvasSize = {
        width: camera.videoWidth,
        height: camera.videoHeight
    };
    const labels = await leituraDasFeatures()
    faceapi.matchDimensions(canvas, canvasSize);
    document.body.appendChild(canvas);

    setInterval(async () => {
        // Obter as detecções de faces (processo de aquisicao e segumentacao para classe de objetos e indicacao das labels para biblioteca)
        const detecoes = await faceapi.detectAllFaces(camera, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withAgeAndGender();
        const resizedDetections = faceapi.resizeResults(detecoes, canvasSize);

        const ctx = canvas.getContext('2d');

        // Limpar o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Desenhar a imagem da câmera no canvas (processo de desenho manual da imagem, feita pela biblioteca canvas)
        ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);

        // Desenhar as detecções (processo de segmentacao)
        faceapi.draw.drawDetections(canvas, resizedDetections);

        // Obtem os pontos chave de registro, dos pixels do rosto (olhos, boca e queixo)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        resizedDetections.forEach(dect => {
            const {age, gender, genderProbability} = dect;
            new faceapi.draw.DrawTextField([
                `${parseInt(age, 10)} anos`,
                `${gender} (${parseInt(genderProbability * 100, 10)})`
            ], dect.detection.box.topRight).draw(canvas)
        })

        // Após desenhar a imagem, obtemos a matriz de pixels RGB (Vermelho, Verde e Azul)
        const rgbMatrix = getAquisicaoDaImagemEmRGB(canvas);

        // Converter a matriz RGB para string
        const rgbString = convertRgbMatrixToString(rgbMatrix);

        // Fazer download do arquivo de texto com a matriz RGB
        downloadTxtFile(rgbString, 'rgbMatrix.txt');

        // Após desenhar a imagem, obtemos a matriz de pixels em tons de cinza (processo de pre-processamento)
        const grayMatrix = getGrayscalePixelMatrixFromCanvas(canvas);

        // Converter a matriz de tons de cinza para string
        const grayString = convertGrayMatrixToString(grayMatrix);

        // Fazer download do arquivo de texto com a matriz de tons de cinza
        downloadTxtFile(grayString, 'grayMatrix.txt');

    }, 100);
});
