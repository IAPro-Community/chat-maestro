/** Refinamento local: não chama LLM, não inventa contexto, exige validação humana. */
export function structurePrompt(raw:string):string {
  const input=raw.trim();
  if(input.length<4 || input.length>12000)throw Error('Informe um prompt de 4 a 12.000 caracteres.');
  return [
    'Objetivo',input,
    'Contexto','[Descreva o público, o projeto ou o problema. Remova esta linha se não for necessário.]',
    'Restrições','[Liste limitações, requisitos obrigatórios e o que deve ser evitado.]',
    'Formato de entrega','[Defina como quer receber a resposta: tópicos, código, plano, tabela etc.]',
    'Critério de qualidade','Apresente premissas quando faltar contexto e não invente informações.'
  ].map((s,i)=>i%2===0?`${s}:`:s).join('\n');
}
