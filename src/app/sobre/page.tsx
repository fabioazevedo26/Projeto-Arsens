import Link from "next/link";
import Image from "next/image";

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png.jpeg" 
              alt="ARSENS Logo" 
              width={48}
              height={48}
              className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            />
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Sobre o Projeto
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-gray-300 hover:text-white"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <h2 className="text-3xl font-bold text-white mb-6">Sobre o Projeto Arsens</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            O Arsens é uma iniciativa tecnológica desenvolvida por um grupo de universitários com o propósito de enfrentar um desafio invisível, mas extremamente perigoso: a poluição por gases tóxicos em ambientes internos e urbanos. Focado inicialmente na detecção de Monóxido de Carbono (CO) — um gás inodoro, insípido e altamente letal —, o projeto une Internet das Coisas (IoT), telemetria em tempo real e análise climática para salvar vidas e promover ambientes mais seguros.
          </p>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-500/10 transition-colors"></div>
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-yellow-500">💡</span> Nossa Missão
          </h3>
          <p className="text-gray-300 leading-relaxed">
            Nossa missão é democratizar o acesso a sistemas inteligentes de monitoramento ambiental. Utilizando hardware de código aberto e sensores de alta precisão, o Arsens transforma dados brutos da atmosfera em informações claras, acessíveis e acionáveis para o usuário comum.
          </p>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors"></div>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-blue-500">🛠️</span> Como Funciona?
          </h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            O dispositivo utiliza o microcontrolador ESP32 como cérebro central, integrando:
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1.5 bg-orange-500 rounded-full"></div>
              <div>
                <h4 className="text-lg font-semibold text-white">Sensor MQ-7</h4>
                <p className="text-gray-400 mt-1">Responsável por mensurar a concentração de Monóxido de Carbono através de ciclos químicos precisos de aquecimento e estabilização.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-1.5 bg-cyan-500 rounded-full"></div>
              <div>
                <h4 className="text-lg font-semibold text-white">Sensor BME280</h4>
                <p className="text-gray-400 mt-1">Monitora a temperatura e a umidade relativa do ar em tempo real. Como as condições climáticas de regiões tropicais (como Manaus) afetam a leitura de sensores de gás, desenvolvemos um algoritmo de correção dinâmica que calibra os dados de PPM (Partes por Milhão) de acordo com o clima local.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1.5 bg-green-500 rounded-full"></div>
              <div>
                <h4 className="text-lg font-semibold text-white">Conectividade Total</h4>
                <p className="text-gray-400 mt-1">Os dados são transmitidos simultaneamente para uma plataforma em nuvem (ThingSpeak) para análise de gráficos históricos, exibidos em um painel web local e enviados instantaneamente via alertas no Telegram caso um limite crítico de segurança seja ultrapassado.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors"></div>
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-purple-500">🎓</span> O Impacto Acadêmico e Social
          </h3>
          <p className="text-gray-300 leading-relaxed">
            Mais do que um protótipo de engenharia, o Arsens representa a aplicação prática do conhecimento universitário em prol da sociedade. Acreditamos que a tecnologia e a prevenção são as melhores ferramentas para transformar a saúde pública e a segurança residencial.
          </p>
        </section>
      </main>
    </div>
  );
}
