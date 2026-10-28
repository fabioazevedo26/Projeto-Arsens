import Icon from "./Icon";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
              <Icon name="activity" className="h-5 w-5 text-brand" />
              Monitoramento participativo da qualidade do ar
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Projeto acadêmico ARSENS, na Av. Djalma Batista, em Manaus/AM. Medições com finalidade educativa,
              preventiva e indicativa de saúde pública.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300">
            <Icon name="cpu" className="h-4 w-4 text-brand" />
            ESP32 + MQ-7 + BME280
          </span>
        </div>
        <p className="flex items-start gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          As medições são indicativas e não substituem estações oficiais de monitoramento da qualidade do ar.
        </p>
      </div>
    </footer>
  );
}
