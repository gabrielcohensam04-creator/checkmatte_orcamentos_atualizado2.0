import fs from 'fs';

let content = fs.readFileSync('src/pages/CreateBudget.jsx', 'utf-8');

const toReplace = [
  // Lentes Padrão (originalIndex)
  {
    find: `{l.quantidade > 0 && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={l.valorUnit || ''} onChange={val => upd(lentes, setLentes, originalIndex, 'valorUnit', val)} />
                        </Field>
                      </div>
                    )}`,
    replace: `{l.quantidade > 0 && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <Field label="Valor unitário (R$)">
                              <FCurrencyInput disabled={isView} placeholder="0,00" value={l.valorUnit || ''} onChange={val => upd(lentes, setLentes, originalIndex, 'valorUnit', val)} />
                            </Field>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Field label="Diárias">
                              <FInput type="number" disabled={isView} placeholder="1" value={l.diarias || ''} onChange={e => upd(lentes, setLentes, originalIndex, 'diarias', parseInt(e.target.value) || 0)} />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )}`
  },
  // Comunicacao Padrão (originalIndex)
  {
    find: `{c.quantidade > 0 && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={c.valorUnit || ''} onChange={val => upd(comunicacao, setComunicacao, originalIndex, 'valorUnit', val)} />
                        </Field>
                      </div>
                    )}`,
    replace: `{c.quantidade > 0 && (
                      <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <Field label="Valor unitário (R$)">
                              <FCurrencyInput disabled={isView} placeholder="0,00" value={c.valorUnit || ''} onChange={val => upd(comunicacao, setComunicacao, originalIndex, 'valorUnit', val)} />
                            </Field>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Field label="Diárias">
                              <FInput type="number" disabled={isView} placeholder="1" value={c.diarias || ''} onChange={e => upd(comunicacao, setComunicacao, originalIndex, 'diarias', parseInt(e.target.value) || 0)} />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )}`
  },
  // Custom Cameras
  {
    find: `{cam.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <Field label="Valor unitário (R$)">
                            <FCurrencyInput disabled={isView} placeholder="0,00" value={cam.valorUnit || ''} onChange={val => {
                              let newList = [...customCameras];
                              newList[i].valorUnit = val;
                              setCustomCameras(newList);
                            }} />
                          </Field>
                        </div>
                      )}`,
    replace: `{cam.quantidade > 0 && (
                        <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Field label="Valor unitário (R$)">
                                <FCurrencyInput disabled={isView} placeholder="0,00" value={cam.valorUnit || ''} onChange={val => {
                                  let newList = [...customCameras];
                                  newList[i].valorUnit = val;
                                  setCustomCameras(newList);
                                }} />
                              </Field>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Field label="Diárias">
                                <FInput type="number" disabled={isView} placeholder="1" value={cam.diarias || ''} onChange={e => {
                                  let newList = [...customCameras];
                                  newList[i].diarias = parseInt(e.target.value) || 0;
                                  setCustomCameras(newList);
                                }} />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )}`
  },
  // Custom Lentes
  {
    find: `{l.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <Field label="Valor unitário (R$)">
                      <FCurrencyInput disabled={isView} placeholder="0,00" value={l.valorUnit || ''} onChange={val => {
                        let newList = [...customLenses];
                        newList[i].valorUnit = val;
                        setCustomLenses(newList);
                      }} />
                    </Field>
                  </div>
                )}`,
    replace: `{l.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={l.valorUnit || ''} onChange={val => {
                            let newList = [...customLenses];
                            newList[i].valorUnit = val;
                            setCustomLenses(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={l.diarias || ''} onChange={e => {
                            let newList = [...customLenses];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomLenses(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}`
  },
  // Custom Drones
  {
    find: `{d.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <Field label="Valor unitário (R$)">
                      <FCurrencyInput disabled={isView} placeholder="0,00" value={d.valorUnit || ''} onChange={val => {
                        let newList = [...customDrones];
                        newList[i].valorUnit = val;
                        setCustomDrones(newList);
                      }} />
                    </Field>
                  </div>
                )}`,
    replace: `{d.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={d.valorUnit || ''} onChange={val => {
                            let newList = [...customDrones];
                            newList[i].valorUnit = val;
                            setCustomDrones(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={d.diarias || ''} onChange={e => {
                            let newList = [...customDrones];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomDrones(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}`
  },
  // Custom Comunicacao
  {
    find: `{c.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <Field label="Valor unitário (R$)">
                      <FCurrencyInput disabled={isView} placeholder="0,00" value={c.valorUnit || ''} onChange={val => {
                        let newList = [...customComunicacao];
                        newList[i].valorUnit = val;
                        setCustomComunicacao(newList);
                      }} />
                    </Field>
                  </div>
                )}`,
    replace: `{c.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={c.valorUnit || ''} onChange={val => {
                            let newList = [...customComunicacao];
                            newList[i].valorUnit = val;
                            setCustomComunicacao(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={c.diarias || ''} onChange={e => {
                            let newList = [...customComunicacao];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomComunicacao(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}`
  },
  // Custom Mov Equip
  {
    find: `{m.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <Field label="Valor unitário (R$)">
                      <FCurrencyInput disabled={isView} placeholder="0,00" value={m.valorUnit || ''} onChange={val => {
                        let newList = [...customMovEquip];
                        newList[i].valorUnit = val;
                        setCustomMovEquip(newList);
                      }} />
                    </Field>
                  </div>
                )}`,
    replace: `{m.quantidade > 0 && (
                  <div style={{ ...S.expandPanel, background: isDark ? '#2A2A2A' : '#F9F9F9', borderRadius: '0 0 10px 10px', border: \`1px solid \${isDark ? '#3A3A3A' : '#E0E0E0'}\`, borderTop: 'none', marginTop: -12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Field label="Valor unitário (R$)">
                          <FCurrencyInput disabled={isView} placeholder="0,00" value={m.valorUnit || ''} onChange={val => {
                            let newList = [...customMovEquip];
                            newList[i].valorUnit = val;
                            setCustomMovEquip(newList);
                          }} />
                        </Field>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Field label="Diárias">
                          <FInput type="number" disabled={isView} placeholder="1" value={m.diarias || ''} onChange={e => {
                            let newList = [...customMovEquip];
                            newList[i].diarias = parseInt(e.target.value) || 0;
                            setCustomMovEquip(newList);
                          }} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}`
  }
];

let replaced = 0;
for (const tr of toReplace) {
  if (content.includes(tr.find)) {
    content = content.replace(tr.find, tr.replace);
    replaced++;
  } else {
    console.log("Could not find exact block:", tr.find.substring(0, 50));
  }
}
console.log("Replaced:", replaced);

fs.writeFileSync('src/pages/CreateBudget.jsx', content, 'utf-8');
