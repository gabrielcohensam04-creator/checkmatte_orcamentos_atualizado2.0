import { useEffect } from 'react';

const PRELOAD_IMAGES = [
  '/IMAGEM_ETAPA01.jpeg',
  '/IMAGEM_ETAPA02.jpeg',
  '/IMAGEM_ETAPA03.jpeg',
  '/IMAGEM_ETAPA04.jpeg',
  '/IMAGEM_ETAPA05.jpeg',
  '/IMAGEM_ETAPA06.jpeg',
  '/IMAGEM_ETAPA07.jpeg',
  '/IMAGEM_ETAPA08.jpeg',
  '/IMAGEM_ETAPA09.jpeg',
  '/IMAGEM_ETAPA10.jpeg',
  '/IMAGEM_BLACKMAGIC.jpeg',
  '/IMAGEM_FX9.jpeg',
  '/IMAGEM_FX3.jpeg',
  '/IMAGEM_50-1000.jpeg',
  '/IMAGEM_25-250.jpeg',
  '/IMAGEM_17-120.jpeg',
  '/IMAGEM_200-600.jpeg',
  '/IMAGEM_20-120.jpeg',
  '/IMAGEM_19-90.jpeg',
  '/IMAGEM_14-24.jpeg',
  '/IMAGEM_16-35.jpeg',
  '/IMAGEM_24-70.jpeg',
  '/IMAGEM_18-110.jpeg',
  '/IMAGEM_28-135.jpeg',
  '/IMAGEM_24-290.jpeg',
  '/IMAGEM_DJIFPV.jpeg',
  '/IMAGEM_INSPAIRE.jpeg',
  '/IMAGEM_SOLIDCOMM1.jpeg',
  '/IMAGEM_STEDY.jpeg',
  '/imagem_ronin.jpeg',
  '/IMAGEM_CARRETA.jpeg',
  '/IMAGEM_DELIVERY.jpeg',
  '/IMAGEM_RACK.jpeg',
  '/IMAGEM_Kitsdecomunicaçãoadicionais.jpeg',
  '/OPERADOR_DE CAMERA.jpeg',
  '/ASSISTENTE.jpeg',
  '/TECNICO DE CAMERAS.jpeg',
  '/VIDEO MAN.jpeg',
  '/COOREDENADOR.jpeg',
  '/TECNICO DE SISTEMAS.jpeg',
  '/MAQUINISTA.jpeg',
  '/MOTORISTA CARRO.jpeg',
  '/MOTORISTA CAMINHAO.jpeg'
];

export default function ImagePreloader() {
  useEffect(() => {
    // Delaying the preloading slightly so it doesn't block the initial render
    const timer = setTimeout(() => {
      PRELOAD_IMAGES.forEach((src) => {
        // Verifica se já não existe
        if (!document.querySelector(`link[href="${src}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          // You can also use fetchPriority = "low" to ensure it doesn't compete with crucial resources
          link.fetchPriority = 'low';
          document.head.appendChild(link);
        }
      });
    }, 500); // Aguarda meio segundo para iniciar o preload pesado

    return () => clearTimeout(timer);
  }, []);

  return null;
}
