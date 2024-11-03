/**
 *  Uma descricao rapida do que se trata cada uma das bibliotecas consumidas dentro da promisse:
 *  - tinyFaceDetector: E a biblioteca responsavel por realizar o procedimento de seguimentacao de uma imagem e atribuir as classes de objetos/rosto para prcessamento.
 *  - faceLandmark68Net: E a biblioteca responsavel por realizar dentro da classe de objeto, a cricao dos pontos de identificacao, que o modelo de aprendizado supervisionado ira consumir para definir os pontos em comum entre todas imagens de entrada, do que sera comparado no futuro pelas previsioes para autentificacao e habilitacao de acesso do usuario.
 *  - faceRecognitionNet: E responsavel por atraves da matris de pixels vindo de entrada, buscar nas bases de dados da aplicacao de quem se trata aquele usuario e buscar seus dados pessoais.
 *  - faceExpressionNet: E a biblioteca responsavel por dectecar emocoes e expressoes vindas do usuarios e resgistra-las.
 *  - ageGenderNet: E uma biblioteca responsavel por registrar uma tentativa de melhor esforco com base em um tempo, qual seria a minha idade e meu sexo (masculino, feminino). Atraves de um modelo treinado com dados reais de pessoas e suas fotos de uma aproximacao do que seria a imagem vinda como entrada e gerar uma previsao disto.
 *  - ssdMobilenetv1: E a biblioteca responsavel por fazer a estilizacao do faceLandmark68Net e aplicar os quadrados de deteccao e etc.
 */

// Função para exibir detecções em tempo real e aplicar zoom com ajuste nos landmarks
async function exibirDeteccoesTempoReal(camera, labels, canvas, canvasSize) {
    const ctx = canvas.getContext('2d');

    setInterval(async () => {
        // Obter as detecções de faces e suas características
        const detections = await faceapi.detectAllFaces(camera, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withAgeAndGender()
            .withFaceDescriptors();

        if (detections.length === 0) {
            console.log("Nenhuma face detectada.");
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas quando não há detecção
            return;
        }

        const resizedDetections = faceapi.resizeResults(detections, canvasSize);
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6); // Ajusta a precisão da correspondência

        // Limpa o canvas para redesenhar a cada frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Loop para processar cada face detectada
        resizedDetections.forEach(detection => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

            // Se a face for correspondente com um nível de confiança aceitável
            if (bestMatch.label !== "unknown") {
                const box = detection.detection.box;
                const landmarks = detection.landmarks;

                // Verificar se os landmarks estão definidos antes de acessá-los
                if (landmarks && landmarks.positions) {
                    // Ajustar a região da face detectada para um zoom aproximado
                    const zoomFactor = 1.58; // Definir o fator de zoom (ajustável)
                    const zoomedBox = {
                        x: box.x - (box.width * (zoomFactor - 1)) / 2,
                        y: box.y - (box.height * (zoomFactor - 1)) / 2,
                        width: box.width * zoomFactor,
                        height: box.height * zoomFactor
                    };

                    // Desenha a imagem da câmera no canvas com a aproximação aplicada
                    ctx.drawImage(
                        camera,
                        zoomedBox.x, zoomedBox.y, zoomedBox.width, zoomedBox.height,
                        0, 0, canvas.width, canvas.height
                    );

                    // Ajustar os landmarks com base no fator de zoom
                    const zoomedLandmarks = landmarks.positions.map(position => ({
                        x: (position.x - box.x) * zoomFactor + zoomedBox.x,
                        y: (position.y - box.y) * zoomFactor + zoomedBox.y
                    }));

                    // Desenhar os landmarks ajustados no canvas
                    ctx.fillStyle = 'blue';
                    zoomedLandmarks.forEach(position => {
                        ctx.beginPath();
                        ctx.arc(position.x, position.y, 3, 0, 2 * Math.PI);
                        ctx.fill();
                    });

                    // Redesenhar as boxes de detecção ajustadas ao zoom
                    ctx.strokeStyle = '#00FF00'; // Cor verde
                    ctx.lineWidth = 2;
                    ctx.strokeRect(zoomedBox.x, zoomedBox.y, zoomedBox.width, zoomedBox.height);

                    // Exibir idade e gênero ajustados ao zoom
                    const { age, gender, genderProbability } = detection;
                    new faceapi.draw.DrawTextField([
                        `${parseInt(age, 10)} anos`,
                        `${gender} (${parseInt(genderProbability * 100, 10)}%)`
                    ], { x: zoomedBox.x + zoomedBox.width, y: zoomedBox.y + zoomedBox.height }).draw(canvas);

                    // Após desenhar a imagem, obtemos a matriz de pixels RGB (Vermelho, Verde e Azul)
                    const rgbMatriz = getAquisicaoDaImagemEmRGB(canvas);

                    // Converter a matriz RGB para string
                    const rgbString = converteMatrizRGBParaString(rgbMatriz);

                    // Fazer download do arquivo de texto com a matriz RGB
                    downloadArquivoTexto(rgbString, 'rgbMatriz.txt');

                    // Após desenhar a imagem, obtemos a matriz de pixels em tons de cinza (processo de pre-processamento)
                    const grayMatriz = getAquisicaoDaImagemEmTonsDeCinza(canvas);

                    // Converter a matriz de tons de cinza para string
                    const grayString = converteMatrizTonsDeCinzaParaString(grayMatriz);

                    // Fazer download do arquivo de texto com a matriz de tons de cinza
                    downloadArquivoTexto(grayString, 'grayMatriz.txt');

                    // Converter o quadrado de detecção para tons de cinza
                    const faceRegion = ctx.getImageData(zoomedBox.x, zoomedBox.y, zoomedBox.width, zoomedBox.height);
                    const grayFaceRegion = new ImageData(zoomedBox.width, zoomedBox.height);

                    // Aplicar a conversão para tons de cinza
                    for (let i = 0; i < faceRegion.data.length; i += 4) {
                        const r = faceRegion.data[i];
                        const g = faceRegion.data[i + 1];
                        const b = faceRegion.data[i + 2];

                        // Fórmula de conversão para tons de cinza
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                        // Atribuir o valor de cinza a todos os canais RGB
                        grayFaceRegion.data[i] = gray;
                        grayFaceRegion.data[i + 1] = gray;
                        grayFaceRegion.data[i + 2] = gray;
                        grayFaceRegion.data[i + 3] = faceRegion.data[i + 3]; // Transparência (alfa)
                    }

                    // Desenhar a região da face em tons de cinza no canvas
                    ctx.putImageData(grayFaceRegion, zoomedBox.x, zoomedBox.y);

                    // Exibir a correspondência do rosto e a porcentagem de similaridade
                    new faceapi.draw.DrawTextField([
                        `${bestMatch.label} (${parseInt((1 - bestMatch.distance) * 100, 10)}%)`
                    ], { x: zoomedBox.x, y: zoomedBox.y - 10 }).draw(canvas);

                    // Processar o nível de acesso para o rosto detectado
                    processarNivelDeAcesso([bestMatch]);
                }
            }
        });
    }, 300); // Atualiza a cada 100ms (ajustável para maior desempenho)
}


// Função para determinar o nível de acesso com base no nome e acurácia
function determinarNivelDeAcesso(label) {
    const niveisDeAcesso = {
        "Bruno": { nivel: 3, url: "http://127.0.0.1:5500/assets/pages/bruno.html" },
        "Gustavo": { nivel: 2, url: "http://127.0.0.1:5500/assets/pages/gustavo.html" },
        "Mateus": { nivel: 1, url: "http://127.0.0.1:5500/assets/pages/mateus.html" },
        "Luan": { nivel: 1, url: "http://127.0.0.1:5500/assets/pages/luan.html" }
    };

    return niveisDeAcesso[label] || { nivel: 0, url: "http://127.0.0.1:5500/assets/pages/sem_acesso.html" }; // Nível 0: Sem acesso
}

// Função para processar os resultados e redirecionar após 10 segundos
function processarNivelDeAcesso(resultadoDaAcuracia) {
    // Variáveis para armazenar o rosto com maior acurácia
    let maiorAcuracia = 0;
    let melhorLabel = "";
    const threshold = 0.5; // Definimos um limite de distância (quanto menor, mais rigoroso)

    // Verifica cada resultado de acurácia e encontra o melhor
    resultadoDaAcuracia.forEach(resultado => {
        const { label, distance } = resultado;
        const acuracia = 1 - distance; // Quanto menor a distância, maior a acurácia

        if (distance < threshold && acuracia > maiorAcuracia) {
            maiorAcuracia = acuracia;
            melhorLabel = label;
        }
    });

    // Se o rosto não for suficientemente próximo, consideramos como "indefinido"
    setTimeout(() => {
        if (!melhorLabel) {
            console.log("Nenhuma correspondência encontrada. Acesso negado.");
            window.location.href = "http://127.0.0.1:5500/assets/pages/sem_acesso.html"; // Redireciona para a página de "sem acesso"
        } else {
            const nivelDeAcesso = determinarNivelDeAcesso(melhorLabel);
            console.log(`Melhor correspondência: ${melhorLabel}, Nível de Acesso: ${nivelDeAcesso.nivel}`);

            // Redirecionar após 10 segundos para a URL correspondente ao nível de acesso

            window.location.href = nivelDeAcesso.url;
        }
    }, 10000); // 10 segundos
}

// Função para converter a matriz de pixels RGB em uma string para salvar no arquivo .txt
function converteMatrizRGBParaString(rgbMatrix) {
    return rgbMatrix.map(row => row.map(pixel => `(${pixel.join(',')})`).join(' ')).join('\n');
}

// Função para converter a matriz de pixels em tons de cinza em uma string para salvar no arquivo .txt
function converteMatrizTonsDeCinzaParaString(grayMatrix) {
    return grayMatrix.map(row => row.join(' ')).join('\n');
}

// Função para criar e baixar o arquivo .txt
function downloadArquivoTexto(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para converter uma imagem para tons de cinza e gerar uma matriz de intensidades
function getAquisicaoDaImagemEmTonsDeCinza(canvas) {
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


const camera = document.getElementById('camera');

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
                        );
                    }
                }
            });
        }
    });
};

// Função para processar e obter descrições
const leituraDasFeatures = () => {
    const name = ['Gustavo', 'Bruno', 'Luan', 'Mateus'];
    return Promise.all(name.map(async label => {
        const descricao = [];
        for (let i = 1; i < 5; i++) {
            const imagens = await faceapi.fetchImage(`assets/lib/labels/${label}/${i}.jpg`);
            const detection = await faceapi.detectSingleFace(imagens).withFaceLandmarks().withFaceDescriptor();
            if (detection && detection.descriptor) { // Verifica se há detecções
                descricao.push(detection.descriptor);
            } else {
                console.warn(`Detecção de face falhou para ${label} imagem ${i}`);
            }
        }
        return new faceapi.LabeledFaceDescriptors(label, descricao);
    }));
};

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

    const labels = await leituraDasFeatures();
    faceapi.matchDimensions(canvas, canvasSize);

    // Colocar o canvas sobre o vídeo (no mesmo container)
    const container = document.querySelector('.camera-container');
    container.appendChild(canvas);

    // Chamar a função para exibir as detecções em tempo real com zoom e outras exibições
    exibirDeteccoesTempoReal(camera, labels, canvas, canvasSize);
    }
);