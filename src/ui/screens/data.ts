import type {Context} from '../context.js';
import {captureCurrentSidebar,captureOpenConversation} from '../../platform/capture.js';
import {importChats,clearAll} from '../../platform/db.js';
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
  const root=el('section','screen');root.append(el('h2','screen-title','Dados e privacidade'));
  const capture=el('div','panel');capture.append(el('h3','section-heading','Capturar lista atual'));
  capture.append(el('p','hint','Captura sob demanda títulos e links visíveis da aba ChatGPT ou Gemini. Não lê mensagens, cookies nem histórico oculto.'));
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
      const data=parseExport(await readJson(file));
      await importChats(data.items,n=>{progress.textContent=`Salvas ${n} de ${data.items.length}…`;});
      notify(`${data.items.length} conversas importadas. ${data.skipped} registros ignorados.`);
      await ctx.refresh();
    }finally{importButton.disabled=false;}
  },'primary');imp.append(picker,importButton,progress);root.append(imp);
  const backup=el('div','panel');backup.append(el('h3','section-heading','Backup e restauração'));
  backup.append(el('p','hint','Salve a biblioteca ChatGPT + Gemini, pastas, prompts e regras em um JSON local v3 (incluindo a fila de mensagens). Aceita backups IAPro v1/v2 e Conversation Workspace v3. O arquivo pode conter textos sensíveis.'));
  backup.append(action('Baixar backup completo',async()=>{downloadJson(`iapro-backup-${new Date().toISOString().slice(0,10)}.json`,await makeBackup());notify('Backup preparado.');},'primary'));
  const restorePicker=el('input');restorePicker.type='file';restorePicker.accept='.json,application/json';restorePicker.setAttribute('aria-label','Selecionar backup IAPro');
  backup.append(field('Restaurar backup',restorePicker));
  backup.append(action('Restaurar substituindo dados',async()=>{
    const file=restorePicker.files?.[0];if(!file)throw Error('Selecione o backup.');
    const raw=await readJson(file);
    const migration=raw && typeof raw==='object' && 'format' in raw && raw.format==='conversation-workspace-backup' ? convertLegacyBackup(raw) : null;
    const parsed=parseBackup(migration?.backup??raw);
    if(migration)notify(`Backup v0.3 convertido. ${migration.warnings.join(' ')}`);
    if(!confirmAction(`Substituir os dados atuais por ${parsed.chats.length} conversas, ${parsed.folders.length} pastas, ${parsed.prompts.length} prompts e ${parsed.queue.length} mensagens na fila? A execução diária será desativada.`))return;
    await restoreBackup(parsed);notify('Backup restaurado.');await ctx.refresh();
  },'danger'));root.append(backup);
  const danger=el('div','panel');danger.append(el('h3','section-heading','Limpar biblioteca'));
  danger.append(el('p','hint','Exclui conversas, prompts e mensagens enfileiradas apenas desta extensão neste navegador. Não remove conversas da sua conta. Faça backup antes.'));
  danger.append(action('Apagar todos os dados locais',async()=>{
    if(!confirmAction('CONFIRMAR: apagar todas as conversas, pastas, prompts, filas e regras IAPro deste navegador?'))return;
    if(!confirmAction('Última confirmação: não existe recuperação sem backup. Prosseguir?'))return;
    await saveSettings({...DEFAULT_SETTINGS});await clearAll();notify('Dados IAPro apagados.');await ctx.refresh();
  },'danger'));root.append(danger);
  root.append(el('p','fineprint','Sem conta IAPro, sem telemetria, sem cobrança ou backend. Independente: não afiliada à OpenAI ou ao Google. Captura só por ação explícita.'));
  return root;
}
