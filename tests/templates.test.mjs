import test from 'node:test';
import assert from 'node:assert/strict';
import {variables,fillTemplate} from '../dist/domain/templates.js';
test('encontra variáveis sem repetir',()=>{assert.deepEqual(variables('Oi {{nome}}, {{nome}}! Projeto {{projeto}}'),['nome','projeto']);});
test('substitui somente valores fornecidos',()=>{assert.equal(fillTemplate('Olá {{nome}} / {{casa}}',{nome:'Ana'}),'Olá Ana / {{casa}}');});
test('não executa script presente em variável',()=>{assert.equal(fillTemplate('{{a}}',{a:'<script>alert(1)</script>'}),'<script>alert(1)</script>');});
test('não interpreta chaves em objetos JSON como variáveis',()=>{assert.deepEqual(variables('{"a": 1}'),[]);});
