import type {Context} from '../context.js';
import {captureCurrentSidebar,captureOpenConversation} from '../../platform/capture.js';
import {hasSiteAccess,requestSiteAccess,activateInlineForCurrentTab} from '../../platform/site-access.js';
import {PROVIDER_LABEL} from '../../domain/providers.js';
import {importChats,clearAll,copyLegacyToProfile} from '../../platform/db.js';
import {activeScope,LEGACY_SCOPE,listProfiles,createProfile,selectProfile,requireSelectedProfile} from '../../platform/profiles.js';
import {parseExport} from '../../domain/importer.js';
import {downloadJson,makeBackup,parseBackup,restoreBackup} from '../../platform/backup.js';
import {saveSettings} from '../../platform/settings.js';
import {DEFAULT_SETTINGS} from '../../domain/organizer.js';
import {convertLegacyBackup} from '../../domain/legacy.js';
import {el,action,field,notify,confirmAction} from '../dom.js';
const MAX_FILE_BYTES=50 * 1024 * 1024;
async function readJson(file:File):Promise<unknown>{
  if(file.size>MAX_FILE_BYTES)throw Error('Arquivo maior que 50 MB. Importação de arquivos grandes será suportada por streaming em uma versão futura.');
  try{return JSON.parse(await file.text()) as unknown;}catch{throw Error('JSON inválido ou arquivo corrompido.');}
}
export function renderData(ctx:Context):HTMLElement{
  const fold=(name:string,content:HTMLElement):HTMLDetailsElement=>{const details=el('details','disclosure');details.append(el('summary','disclosure-trigger',name),content);return details;};
  const root=el('section','screen');root.append(el('h2','screen-title','Contas e dados'));
  const profiles=el('div','panel local-profiles');
  profiles.append(el('h3','section-heading','Perfis locais separados'));
  profiles.append(el('p','hint','Um perfil guarda seus dados em um IndexedDB independente. Não identifica nem autentica sua conta do ChatGPT/Gemini. Confirme o perfil manualmente antes de qualquer ação. Os dados anteriores permanecem em Legado.'));
  const chosen=el('select');chosen.setAttribute('aria-label','Selecionar perfil local para Biblioteca e Dados');
  const fill=async()=>{
    const available=await listProfiles();
    chosen.replaceChildren(new Option('Legado · dados antigos não atribuídos',LEGACY_SCOPE));
    for(const profile of available)chosen.append(new Option((profile.provider==='chatgpt'?'ChatGPT':'Gemini')+' · '+profile.label,profile.id));
    chosen.value=activeScope();
  };
  void fill().catch(e=>notify(String(e),true));
  chosen.addEventListener('change',()=>{void selectProfile(chosen.value).then(ctx.refresh).catch(e=>notify(String(e),true));});
  profiles.append(field('Biblioteca ativa',chosen));
  const newProvider=el('select');newProvider.append(new Option('ChatGPT','chatgpt'),new Option('Gemini','gemini'));
  const newLabel=el('input');newLabel.maxLength=64;newLabel.placeholder='Ex.: Pessoal, Trabalho';
  const create=action('Criar perfil local',async()=>{
    const p=await createProfile(newProvider.value==='gemini'?'gemini':'chatgpt',newLabel.value);
    await selectProfile(p.id);notify('Perfil local criado; biblioteca isolada ativada.');await ctx.refresh();
  },'primary');
  profiles.append(field('Plataforma',newProvider),field('Nome do perfil',newLabel),create);
  const migrate=action('Copiar dados legados para este perfil',async()=>{
    const p=await requireSelectedProfile();
    if(!confirmAction('Copiar registros antigos do '+(p.provider==='chatgpt'?'ChatGPT':'Gemini')+' para o perfil '+p.label+'? O banco Legado será preservado e o destino precisa estar vazio.'))return;
    const result=await copyLegacyToProfile(p.id,p.provider);
    notify(result.chats+' conversas e '+result.queue+' mensagens copiadas; o banco Legado foi preservado.');
    await ctx.refresh();
  });
  profiles.append(migrate,el('p','fineprint','O seletor do painel e o gerenciador podem apontar para perfis diferentes. Confira sempre o nome antes de importar, restaurar ou limpar.'));
  root.append(profiles);
  const site=el('div','panel site-access-panel');
  site.append(el('h3','section-heading','Conectar seus assistentes'));
  site.append(el('p','hint','Autorize uma única vez o acesso ao ChatGPT ou Gemini. A permissão é limitada aos domínios escolhidos e pode ser revogada nas configurações de extensões do Chrome.'));
  const indicators=el('div','site-access-indicators');
  const controls=el('div','buttons site-access-buttons');
  for(const provider of ['chatgpt','gemini'] as const){
    const badge=el('span','access-indicator',PROVIDER_LABEL[provider]+': verificando…');
    indicators.append(badge);
    controls.append(action('Conectar '+PROVIDER_LABEL[provider],()=>{
      // Solicita permissão diretamente durante o clique, sem await anterior.
      return requestSiteAccess(provider).then(async granted=>{
        if(!granted)throw Error('Permissão para '+PROVIDER_LABEL[provider]+' não concedida. A biblioteca local continua disponível.');
        await activateInlineForCurrentTab(provider).catch(()=>{ /* eventual aba sem permissão de injeção: próximo reload ativa pelo registro dinâmico */ });
        notify(PROVIDER_LABEL[provider]+' conectado. Ações na página disponíveis na próxima navegação.');
        await ctx.refresh();
      });
    }));
    void hasSiteAccess(provider).then(granted=>{
      badge.textContent=PROVIDER_LABEL[provider]+': '+(granted?'autorizado':'não conectado');
      badge.classList.toggle('access-granted',granted);
    }).catch(()=>{badge.textContent=PROVIDER_LABEL[provider]+': estado indisponível';});
  }
  site.append(indicators,controls);root.append(site);
  const capture=el('div','panel capture-panel');capture.append(el('h3','section-heading','Capturar lista atual'));
  capture.append(el('p','hint','Captura títulos e links visíveis do site autorizado. Não lê mensagens nem histórico oculto. Se estiver na página inicial, abra uma conversa específica para salvá-la.'));
  capture.append(action('Capturar barra lateral',async()=>{
    const {count,provider}=await captureCurrentSidebar();notify(`${count} links do ${provider} capturados ou atualizados.`);await ctx.refresh();
  },'primary'));
  capture.append(action('Salvar conversa aberta',async()=>{
    const provider=await captureOpenConversation();notify(`Conversa do ${provider} salva na biblioteca.`);await ctx.refresh();
  }));root.append(capture);
  const imp=el('div','panel');imp.append(el('h3','section-heading','Importar histórico'));
  imp.append(el('p','hint','Importa conversations.json da exportação oficial do ChatGPT. Para Gemini, salve a conversa aberta ou capture links visíveis. Google Takeout não utiliza o mesmo schema; não é aceito neste importador. Limite: 50 MB.'));
  const picker=el('input');picker.type='file';picker.accept='.json,application/json';picker.setAttribute('aria-label','Selecionar conversations.json');
  const progress=el('p','hint');
  const importButton=action('Importar conversas',async()=>{
    const file=picker.files?.[0];if(!file)throw Error('Selecione conversations.json.');
    importButton.disabled=true;
    try{
      progress.textContent='Lendo e validando arquivo…';
      await requireSelectedProfile('chatgpt');
      const data=parseExport(await readJson(file));
      await importChats(data.items,n=>{progress.textContent=`Salvas ${n} de ${data.items.length}…`;});
      notify(`${data.items.length} conversas importadas. ${data.skipped} registros ignorados.`);
      await ctx.refresh();
    }finally{importButton.disabled=false;}
  },'primary');imp.append(picker,importButton,progress);root.append(fold("Importar histórico do ChatGPT",imp));
  const backup=el('div','panel');backup.append(el('h3','section-heading','Backup e restauração'));
  backup.append(el('p','hint','Backup somente do perfil local selecionado (ou Legado). O arquivo JSON v3 inclui conversas, pastas, prompts, fila e regras; não é criptografado. Aceita versões anteriores mediante validação.'));
  backup.append(action('Baixar backup completo',async()=>{downloadJson(`iapro-backup-${new Date().toISOString().slice(0,10)}.json`,await makeBackup());notify('Backup preparado.');},'primary'));
  const restorePicker=el('input');restorePicker.type='file';restorePicker.accept='.json,application/json';restorePicker.setAttribute('aria-label','Selecionar backup IAPro');
  backup.append(field('Restaurar backup',restorePicker));
  backup.append(action('Restaurar substituindo dados',async()=>{
    const file=restorePicker.files?.[0];if(!file)throw Error('Selecione o backup.');
    const raw=await readJson(file);
    const migration=raw && typeof raw==='object' && 'format' in raw && raw.format==='conversation-workspace-backup' ? convertLegacyBackup(raw) : null;
    const parsed=parseBackup(migration?.backup??raw);
    if(migration)notify(`Backup v0.3 convertido. ${migration.warnings.join(' ')}`);
    if(!confirmAction(`No perfil ${chosen.selectedOptions[0]?.textContent??'selecionado'}, substituir os dados atuais por ${parsed.chats.length} conversas, ${parsed.folders.length} pastas, ${parsed.prompts.length} prompts e ${parsed.queue.length} mensagens na fila? A execução diária será desativada.`))return;
    await restoreBackup(parsed);notify('Backup restaurado.');await ctx.refresh();
  },'danger'));root.append(fold("Backup e restauração",backup));
  const danger=el('div','panel');danger.append(el('h3','section-heading','Limpar biblioteca'));
  danger.append(el('p','hint','Exclui conversas, prompts e fila apenas do perfil local selecionado. Outros perfis e Legado não são removidos. Não altera sua conta ChatGPT/Gemini. Faça backup antes.'));
  danger.append(action('Apagar todos os dados locais',async()=>{
    if(!confirmAction('CONFIRMAR: apagar o perfil local selecionado (conversas, pastas, prompts, filas e regras)? Outros perfis não serão modificados.'))return;
    if(!confirmAction('Última confirmação: não existe recuperação sem backup. Prosseguir?'))return;
    await saveSettings({...DEFAULT_SETTINGS});await clearAll();notify('Dados IAPro apagados.');await ctx.refresh();
  },'danger'));root.append(fold("Limpar dados locais (atenção)",danger));
  root.append(el('p','fineprint','Sem conta IAPro, sem telemetria, sem cobrança ou backend. Independente: não afiliada à OpenAI ou ao Google. Captura só por ação explícita.'));
  return root;
}
