# APS Facial Recognition Project — Front-end

Aplicação web (HTML, CSS e JavaScript) que usa **reconhecimento facial no navegador** com [face-api.js](https://github.com/justadudewhohacks/face-api.js) para autenticar usuários pela câmera e liberar o acesso a diferentes páginas de acordo com o nível de permissão de cada pessoa cadastrada.

Este projeto é uma **APS (Atividade Prática Supervisionada)** da UNIP, sem relação com o TCC de Gestão de Resíduos Sólidos Urbanos (SWM) — é um exercício independente de biometria facial e controle de acesso.

## O problema

Sistemas de controle de acesso tradicionais (senha, crachá, cadastro manual) dependem de algo que o usuário possui ou memoriza, e não verificam de fato quem está solicitando o acesso. O desafio proposto foi simular, inteiramente no navegador, um controle de acesso baseado em biometria facial: identificar automaticamente quem está na frente da câmera e, a partir disso, decidir para qual nível de informação essa pessoa está autorizada a entrar — sem backend, sem banco de dados externo e sem enviar a imagem do rosto para nenhum servidor.

## A solução

A aplicação foi construída em **HTML, CSS e JavaScript puro**, usando a biblioteca **face-api.js** (TensorFlow.js) para rodar toda a detecção e o reconhecimento facial diretamente no navegador do usuário — os modelos pré-treinados (detecção de rosto, landmarks faciais, reconhecimento, idade/gênero e expressões) são carregados localmente a partir de `assets/lib/models`, e as fotos de referência de cada pessoa cadastrada ficam em `assets/lib/labels/<nome>`. Essa abordagem elimina a necessidade de um servidor de inferência: a câmera captura o vídeo, o `face-api.js` compara o rosto detectado com os descritores faciais de cada pessoa cadastrada (`FaceMatcher`) e, com base na correspondência de maior confiança, a aplicação decide o nível de acesso e redireciona para a página correspondente.

## O resultado

O fluxo funciona de ponta a ponta no navegador: a câmera é ativada, os rostos são detectados em tempo real (a cada ~300ms), o sistema desenha a marcação facial (landmarks, zoom na região do rosto, idade/gênero estimados) sobre o vídeo e, ao encontrar uma correspondência com confiança suficiente, redireciona automaticamente o usuário para a página do seu nível de acesso após alguns segundos — ou para uma página de "Acesso Negado" quando o rosto não corresponde a nenhum cadastro. Cada nível de acesso simulado exibe um conjunto diferente de informações (do nível básico ao "Cofre de Segurança"), demonstrando na prática o conceito de controle de acesso graduado por biometria.

## Como a aplicação funciona

1. **Carregamento dos modelos**: ao abrir a página, o face-api.js carrega os modelos de detecção, landmarks, reconhecimento, expressão e idade/gênero, além dos descritores faciais de cada pessoa cadastrada.
2. **Captura de vídeo**: a câmera do dispositivo é ativada e exibida na tela.
3. **Detecção em tempo real**: a cada intervalo, o rosto é detectado, os landmarks são desenhados e uma aproximação (zoom) é aplicada sobre a região do rosto.
4. **Reconhecimento**: o descritor facial detectado é comparado com os descritores cadastrados (FaceMatcher) para encontrar a melhor correspondência.
5. **Definição do nível de acesso**: com base no nome reconhecido, a aplicação determina o nível de acesso correspondente.
6. **Redirecionamento**: após alguns segundos, o usuário é redirecionado para a página do seu nível de acesso, ou para a página de acesso negado caso nenhuma correspondência seja encontrada.

## Níveis de acesso simulados

| Página | Nível | Conteúdo simulado |
|---|---|---|
| gustavo.html | Nível 2 | Relatórios confidenciais e configurações de acesso de um diretor. |
| bruno.html | Nível 3 | Nível de acesso mais alto simulado no projeto. |
| luan.html / mateus.html | Nível 1 | Informações públicas e relatórios básicos. |
| sem_acesso.html | Nível 0 | Página de acesso negado, exibida quando nenhum rosto cadastrado é reconhecido. |

> O conteúdo dessas páginas (relatórios, impactos ambientais, licenciamento de produtos) é fictício e foi criado apenas como cenário de exemplo para o exercício acadêmico.

## Como executar

Por usar recursos do navegador (câmera e fetch de arquivos locais), o projeto precisa ser servido por um servidor HTTP local — abrir o index.html diretamente pelo sistema de arquivos (file://) não funciona. Uma forma simples é usar a extensão Live Server do VS Code ou qualquer servidor estático:

```bash
npx serve .
```

Em seguida, acesse a aplicação pelo navegador e permita o uso da câmera quando solicitado.

## Estrutura do projeto

```
.
├── index.html                  # Página inicial com a captura de câmera e reconhecimento facial
├── assets/
│   ├── css/                    # Estilos de cada página/nível de acesso
│   ├── js/index.js             # Lógica de detecção, reconhecimento e controle de acesso
│   ├── lib/
│   │   ├── face-api.min.js     # Biblioteca face-api.js
│   │   ├── models/             # Modelos pré-treinados (detecção, landmarks, reconhecimento, etc.)
│   │   └── labels/<nome>/      # Fotos de referência de cada pessoa cadastrada
│   └── pages/                  # Páginas de destino por nível de acesso
└── images/                     # Ícones e imagens usados na interface
```

## Tecnologias principais

- HTML5 / CSS3 / JavaScript
- face-api.js (TensorFlow.js)
- Reconhecimento facial e detecção de landmarks no navegador (client-side)

## Autor

Gustavo de Almeida Pacheco, Bruno Capovila, Luan Victoni e Mateus Ferreira — desenvolvido como Atividade Prática Supervisionada (APS) na UNIP.
