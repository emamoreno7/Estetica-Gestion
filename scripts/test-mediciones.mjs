import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync('src/features/mediciones/medicionesLogic.ts','utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal(js.diagnostics?.length ?? 0, 0);
const module = { exports: {} };
vm.runInNewContext(js.outputText, { module, exports: module.exports, console });
const logic = module.exports;
assert.equal(logic.parseOptionalMeasurement('', 'cintura_cm'), null);
assert.equal(logic.parseOptionalMeasurement('81,35','cintura_cm'),81.35);
assert.equal(logic.parseOptionalMeasurement('68.5','peso_kg'),68.5);
assert.throws(()=>logic.parseOptionalMeasurement('68,555','cintura_cm'));
assert.throws(()=>logic.parseOptionalMeasurement('-12','cintura_cm'));
assert.throws(()=>logic.parseOptionalMeasurement('8','cintura_cm'));
assert.throws(()=>logic.parseOptionalMeasurement('401','peso_kg'));
assert.throws(()=>logic.buildMeasurementValues(logic.EMPTY_VALUES));

const vals = logic.buildMeasurementValues({
  ...logic.EMPTY_VALUES,cintura_cm:'93,25',peso_kg:'70.80',
});
assert.equal(vals.cintura_cm,93.25);
assert.equal(vals.peso_kg,70.8);
assert.equal(vals.brazo_cm,null);
const basic = {
  cliente_id:'fake-id',fecha:'2026-09-01',
  registrado_at:'2026-09-01T14:00:00Z',anulado_at:null,
  cintura_cm:null,cadera_alta_cm:null,peso_kg:null,
};
const rows = [
  {...basic,id:'b',fecha:'2026-09-04',registrado_at:'2026-09-04T12:00:00Z',cintura_cm:90},
  {...basic,id:'a',cintura_cm:93,cadera_alta_cm:106},
  {...basic,id:'c',fecha:'2026-09-05',registrado_at:'2026-09-05T11:00:00Z',cintura_cm:86,
    anulado_at:'2026-09-05T12:00:00Z'},
  {...basic,id:'d',fecha:'2026-09-08',registrado_at:'2026-09-08T11:00:00Z',cintura_cm:88},
];
assert.equal(logic.activeChronological(rows).map(r=>r.id).join(','),'a,b,d');
const progress = logic.metricProgress(rows,'cintura_cm');
assert.equal(progress.first.value,93);
assert.equal(progress.last.value,88);
assert.equal(progress.change,-5);
assert.equal(progress.count,3);
assert.equal(logic.metricProgress(rows,'peso_kg'),null);
assert.equal(logic.metricProgress(rows,'cadera_alta_cm').count,1);
assert.equal(logic.formatMeasurement(null),'—');
console.log('PASS medicionesLogic: decimales, validación, anulación, orden y evolución');
