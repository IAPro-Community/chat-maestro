import {PROVIDER_LABEL} from '../../domain/providers.js';
import type {Context} from '../context.js';
import type {Folder,Settings} from '../../domain/types.js';
import {makePlan,normalizeRuleWords} from '../../domain/organizer.js';
import {put,all,applyPlan,undoLast,deleteFolder,modifyChat} from '../../platform/db.js';
import {saveSettings,loadSettings} from '../../platform/settings.js';
import {el,action,field,empty,buttonRow,notify,confirmAction,downloadText} from '../dom.js';
import {serializeChats} from '../../domain/exporter.js';
export function renderOrganize(ctx:Context):HTMLElement{
  const root=el('section','screen');root.append(el('h2','screen-title','Organização inteligente'));
  root.append(el('p','hint','Organize localmente conversas do ChatGPT e Gemini com as mesmas regras. Você revisa antes de aplicar.'));
  const settings=ctx.settings;
  const policy=el('div','panel');policy.append(el('h3','section-heading','Política de limpeza'));
  const days=el('input');days.type='number';days.min='30';days.max='3650';days.value=String(settings.inactivityDays);
  const recent=el('input');recent.type='number';recent.min='0';recent.max='1000';recent.value=String(settings.keepRecent);
  const protect=el('input');protect.type='checkbox';protect.checked=settings.protectFiled;
  const auto=el('input');auto.type='checkbox';auto.checked=settings.autoRun;
  policy.append(field('Arquivar após dias sem atividade',days),field('Preservar as mais recentes',recent));
  const row1=el('label','checkrow');row1.append(protect,el('span','','Proteger conversas já organizadas em pastas'));policy.append(row1);
  const row2=el('label','checkrow');row2.append(auto,el('span','','Executar organização local diariamente'));policy.append(row2);
  policy.append(el('p','hint','Datas de captura da barra lateral não comprovam inatividade; essas conversas nunca são arquivadas automaticamente.'));
  policy.append(action('Salvar política',async()=>{
    const updated:Settings={...settings,inactivityDays:Number(days.value),keepRecent:Number(recent.value),protectFiled:protect.checked,autoRun:auto.checked};
    await saveSettings(updated);notify('Política salva.');await ctx.refresh();
  },'primary'));root.append(policy);
  const folders=el('div','panel');folders.append(el('h3','section-heading','Pastas'));
  const list=el('div','tag-list');
  for(const folder of ctx.folders){
    const item=el('span','folder-tag');const dot=el('i','color-dot');dot.style.backgroundColor=folder.color;
    item.append(dot,el('span','',folder.name),action('×',async()=>{
      if(!confirmAction(`Excluir pasta "${folder.name}"? As conversas ficarão sem pasta.`))return;
      await deleteFolder(folder.id);
      const next={...ctx.settings,rules:ctx.settings.rules.filter(r=>r.folderId!==folder.id)};
      await saveSettings(next);await ctx.refresh();
    }));list.append(item);
  }
  folders.append(list);
  const folderInput=el('input');folderInput.placeholder='Nome da nova pasta';folderInput.maxLength=80;
  const color=el('input');color.type='color';color.value='#6366f1';color.setAttribute('aria-label','Cor da pasta');
  folders.append(buttonRow(folderInput,color,action('Criar pasta',async()=>{
    const name=folderInput.value.trim();if(!name||name.length>80)throw Error('Informe o nome da pasta.');
    const entry:Folder={id:crypto.randomUUID(),name,color:color.value};await put('folders',entry);await ctx.refresh();
  },'primary')));root.append(folders);
  const rules=el('div','panel');rules.append(el('h3','section-heading','Regras por título'));
  rules.append(el('p','hint','Exemplo: delphi, pascal → pasta Desenvolvimento. Nenhum serviço de IA é chamado.'));
  for(const rule of settings.rules){
    const label=ctx.folders.find(f=>f.id===rule.folderId)?.name??'Pasta removida';
    const item=el('div','rule-row');item.append(el('span','',`${rule.keywords.join(', ')} → ${label}`));
    item.append(action('Remover',async()=>{await saveSettings({...settings,rules:settings.rules.filter(r=>r.id!==rule.id)});await ctx.refresh();},'danger'));
    rules.append(item);
  }
  if(!ctx.folders.length)rules.append(empty('Crie uma pasta para configurar regras.'));
  else{
    const keywords=el('input');keywords.placeholder='Palavras-chave separadas por vírgula';keywords.maxLength=500;
    const destination=el('select');destination.setAttribute('aria-label','Pasta para regra');
    for(const f of ctx.folders)destination.append(new Option(f.name,f.id));
    rules.append(field('Palavras-chave',keywords),field('Mover para pasta',destination));
    rules.append(action('Adicionar regra',async()=>{
      if(settings.rules.length>=100)throw Error('Limite de 100 regras.');
      await saveSettings({...settings,rules:[...settings.rules,{id:crypto.randomUUID(),keywords:normalizeRuleWords(keywords.value),folderId:destination.value,enabled:true}]});await ctx.refresh();
    },'primary'));
  }
  root.append(rules);
  const plan=makePlan(ctx.chats,ctx.folders,settings);
  const preview=el('div','panel');preview.append(el('h3','section-heading',`Prévia · ${plan.totalCandidates} sugestões`));
  preview.append(el('p','hint',`${plan.unknownDates} conversa(s) sem data verificada protegidas. Máximo de 100 ações por execução.`));
  if(!plan.recommendations.length)preview.append(empty('Nenhuma ação sugerida com a política atual.'));
  else{
    const list=el('div','recommendations');
    for(const r of plan.recommendations.slice(0,60)){
      const item=el('div','recommendation');const text=el('div');
      const source=ctx.chats.find(c=>c.id===r.id)?.provider??'chatgpt';
      text.append(el('strong','',r.title),el('small','',`${PROVIDER_LABEL[source]} · ${r.action==='archive'?'Arquivo local':'Classificar'} · ${r.reason}`));
      item.append(text);const b=action('Proteger',async()=>{await modifyChat(r.id,{protected:true});await ctx.refresh();});item.append(b);list.append(item);
    }
    if(plan.recommendations.length>60)list.append(el('p','hint',`Exibindo 60 de ${plan.recommendations.length} ações.`));
    preview.append(list);
    preview.append(action('Exportar conversas sugeridas (JSON)',()=>{
      const ids=new Set(plan.recommendations.map(r=>r.id));
      const selection=ctx.chats.filter(c=>ids.has(c.id)).slice(0,100);
      if(!selection.length)throw Error('Não há conversas elegíveis.');
      downloadText(`iapro-revisao-limpeza-${new Date().toISOString().slice(0,10)}.json`,serializeChats(selection,'json'),'application/json');
      notify('Cópia da seleção preparada para revisão.');
    }));
    preview.append(action('Exportar conversas sugeridas (JSON)',()=>{
      const ids=new Set(plan.recommendations.map(r=>r.id));
      const selection=ctx.chats.filter(c=>ids.has(c.id)).slice(0,100);
      if(!selection.length)throw Error('Não há conversas elegíveis.');
      downloadText(`iapro-revisao-limpeza-${new Date().toISOString().slice(0,10)}.json`,serializeChats(selection,'json'),'application/json');
      notify('Cópia da seleção preparada para revisão.');
    }));
    preview.append(action(`Aplicar ${plan.recommendations.length} alterações locais`,async()=>{
      if(!confirmAction('Aplicar sugestões APENAS na biblioteca IAPro? Isso não arquiva conversas nas contas ChatGPT ou Gemini.'))return;
      const current=makePlan(await all('chats'),ctx.folders,await loadSettings());
      // Recalcula antes do commit para invalidar uma prévia antiga.
      if(JSON.stringify(current.recommendations)!==JSON.stringify(plan.recommendations))throw Error('A prévia mudou. Atualize a lista.');
      const n=await applyPlan(plan);notify(`${n} registros organizados localmente.`);await ctx.refresh();
    },'primary'));
  }
  preview.append(action('Desfazer último lote',async()=>{
    if(!confirmAction('Desfazer o último lote?'))return;
    const n=await undoLast();notify(`${n} alterações desfeitas.`);await ctx.refresh();
  }));root.append(preview);
  const notice=el('div','note');notice.append(el('strong','','Diferença importante'));
  notice.append(el('p','','Arquivar nesta extensão apenas muda sua biblioteca IAPro. Para tirar a conversa da barra lateral da conta, abra o chat e use Arquivar no menu nativo do ChatGPT ou Gemini, conforme a plataforma.'));
  root.append(notice);return root;
}
