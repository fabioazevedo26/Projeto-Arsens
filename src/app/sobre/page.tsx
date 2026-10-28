import Icon, { type IconName } from "@/components/Icon";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const COMPONENTS: { title: string; icon: IconName; tone: string; text: string }[] = [
  {
    title: "Sensor MQ-7",
    icon: "activity",
    tone: "bg-teal-50 text-teal-700",
    text: "Responsável por mensurar a concentração de Monóxido de Carbono através de ciclos químicos precisos de aquecimento e estabilização.",
  },
  {
    title: "Sensor BME280",
    icon: "thermometer",
    tone: "bg-orange-50 text-orange-600",
    text: "Monitora a temperatura e a umidade relativa do ar em tempo real. Como as condições climáticas de regiões tropicais (como Manaus) afetam a leitura de sensores de gás, desenvolvemos um algoritmo de correção dinâmica que calibra os dados de PPM (Partes por Milhão) de acordo com o clima local.",
  },
  {
    title: "Conectividade Total",
    icon: "send",
    tone: "bg-sky-50 text-sky-600",
    text: "Os dados são transmitidos simultaneamente para uma plataforma em nuvem (ThingSpeak) para análise de gráficos históricos, exibidos em um painel web local e enviados instantaneamente via alertas no Telegram caso um limite crítico de segurança seja ultrapassado.",
  },
];

function Card({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight sm:text-2xl">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-strong">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        {title}
      </h2>
      <div className="mt-4 leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function SobrePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900">
      <SiteHeader active="sobre" />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 lg:px-8 lg:py-12">
        <div>
          <p className="text-xs font-bold tracking-[0.08em] text-brand-strong uppercase">Ciência cidadã · Manaus</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Sobre o Projeto Arsens</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">
            O Arsens é uma iniciativa tecnológica desenvolvida por um grupo de universitários com o propósito de
            enfrentar um desafio invisível, mas extremamente perigoso: a poluição por gases tóxicos em ambientes internos
            e urbanos. Focado inicialmente na detecção de Monóxido de Carbono (CO) — um gás inodoro, insípido e altamente
            letal —, o projeto une Internet das Coisas (IoT), telemetria em tempo real e análise climática para salvar
            vidas e promover ambientes mais seguros.
          </p>
        </div>

        <Card icon="lightbulb" title="Nossa Missão">
          <p>
            Nossa missão é democratizar o acesso a sistemas inteligentes de monitoramento ambiental. Utilizando hardware de
            código aberto e sensores de alta precisão, o Arsens transforma dados brutos da atmosfera em informações claras,
            acessíveis e acionáveis para o usuário comum.
          </p>
        </Card>

        <Card icon="cpu" title="Como Funciona?">
          <p>O dispositivo utiliza o microcontrolador ESP32 como cérebro central, integrando:</p>
          <ul className="mt-5 space-y-4">
            {COMPONENTS.map((c) => (
              <li key={c.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{c.title}</h3>
                  <p className="mt-1 text-slate-600">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card icon="graduation" title="O Impacto Acadêmico e Social">
          <p>
            Mais do que um protótipo de engenharia, o Arsens representa a aplicação prática do conhecimento universitário
            em prol da sociedade. Acreditamos que a tecnologia e a prevenção são as melhores ferramentas para transformar a
            saúde pública e a segurança residencial.
          </p>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
