import fs from 'fs';

let content = fs.readFileSync('src/pages/CreateBudget.jsx', 'utf-8');

// Replace standard items (cameras, lentes, drones, comunicacao, movEquip)
const standardCategories = ['cameras', 'lentes', 'drones', 'comunicacao', 'movEquip'];

for (const cat of standardCategories) {
  const arrName = cat;
  const setArrName = 'set' + cat.charAt(0).toUpperCase() + cat.slice(1);
  const varLetter = cat === 'cameras' ? 'cam' : cat === 'lentes' ? 'l' : cat === 'drones' ? 'd' : cat === 'comunicacao' ? 'c' : 'm';

  const rxValueExpand = new RegExp(`\\{${varLetter}\\.quantidade > 0 && \\(\n\\s*<div style=\\{\\{ \\.\\.\\.S\\.expandPanel, [\\s\\S]*?<Field label="Valor unitário \\(R\\$\\)">\\n\\s*<FCurrencyInput disabled=\\{isView\\} placeholder="0,00" value=\\{${varLetter}\\.valorUnit \\|\\| ''\\} onChange=\\{val => upd\\(${arrName}, ${setArrName}, i, 'valorUnit', val\\)\\} />\\n\\s*</Field>\\n\\s*</div>\\n\\s*\\)\\}`);
  
  const replacement = `{${varLetter}.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={${varLetter}.valorUnit || ''} onChange={val => upd(${arrName}, ${setArrName}, i, 'valorUnit', val)} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={${varLetter}.diarias || ''} onChange={e => upd(${arrName}, ${setArrName}, i, 'diarias', parseInt(e.target.value) || 0)} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}`;
                      
  content = content.replace(rxValueExpand, replacement);
  content = content.replace(new RegExp(`fmt\\(${varLetter}\\.quantidade \\* ${varLetter}\\.valorUnit\\)`, 'g'), `fmt(${varLetter}.quantidade * ${varLetter}.valorUnit * (${varLetter}.diarias || 1))`);
}

// Replace custom items
const customCategories = ['customCameras', 'customLenses', 'customDrones', 'customComunicacao', 'customMovEquip'];
for (const cat of customCategories) {
  const arrName = cat;
  const setArrName = 'set' + cat.charAt(0).toUpperCase() + cat.slice(1);
  const varLetter = cat === 'customCameras' ? 'cam' : cat === 'customLenses' ? 'l' : cat === 'customDrones' ? 'd' : cat === 'customComunicacao' ? 'c' : 'm';

  const rxValueExpandCustom = new RegExp(`\\{${varLetter}\\.quantidade > 0 && \\(\n\\s*<div style=\\{\\{ \\.\\.\\.S\\.expandPanel[\\s\\S]*?<Field label="Valor unitário \\(R\\$\\)">\\n\\s*<FCurrencyInput disabled=\\{isView\\} placeholder="0,00" value=\\{${varLetter}\\.valorUnit \\|\\| ''\\} onChange=\\{val => \\{\\n\\s*let newList = \\[\\.\\.\\.${arrName}\\];\\n\\s*newList\\[i\\] = \\{ \\.\\.\\.newList\\[i\\], valorUnit: val \\};\\n\\s*${setArrName}\\(newList\\);\\n\\s*\\}\\} />\\n\\s*</Field>\\n\\s*</div>\\n\\s*\\)\\}`);
  
  const replacementCustom = `{${varLetter}.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={${varLetter}.valorUnit || ''} onChange={val => {
                                  let newList = [...${arrName}];
                                  newList[i] = { ...newList[i], valorUnit: val };
                                  ${setArrName}(newList);
                                }} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={${varLetter}.diarias || ''} onChange={e => {
                                  let newList = [...${arrName}];
                                  newList[i] = { ...newList[i], diarias: parseInt(e.target.value) || 0 };
                                  ${setArrName}(newList);
                                }} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}`;
  
  content = content.replace(rxValueExpandCustom, replacementCustom);
  content = content.replace(new RegExp(`fmt\\(${varLetter}\\.quantidade \\* ${varLetter}\\.valorUnit\\)`, 'g'), `fmt(${varLetter}.quantidade * ${varLetter}.valorUnit * (${varLetter}.diarias || 1))`);
}

// Replace gruas and trilhos totals logic for visual
content = content.replace(/fmt\(g\.quantidade \* g\.valorUnit\)/g, 'fmt(g.quantidade * g.valorUnit * (g.diarias || 1))');
content = content.replace(/fmt\(t\.quantidade \* t\.valorUnit\)/g, 'fmt(t.quantidade * t.valorUnit * (t.diarias || 1))');


fs.writeFileSync('src/pages/CreateBudget.jsx', content, 'utf-8');
console.log('Replacements complete');
