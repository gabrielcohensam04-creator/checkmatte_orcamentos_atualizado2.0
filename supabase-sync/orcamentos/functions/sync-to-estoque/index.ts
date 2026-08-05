// Deploy: projeto ORÇAMENTOS (qinjlrgvxmplvsotxyth), nome da function: sync-to-estoque
// Disparada pelo Database Webhook em public.companies (eventos Insert + Update).
//
// Secrets necessários (Project Settings → Edge Functions → Secrets):
//   ESTOQUE_URL               = https://lspugeacsywfmfkkkrhu.supabase.co
//   ESTOQUE_SERVICE_ROLE_KEY  = <service_role do projeto estoque>
//
// Lógica: só escreve em empresas (estoque) se os campos espelhados realmente
// diferem do que já está lá (comparando CNPJ normalizado, sem pontuação, e
// texto normalizado). Isso é o que impede o loop infinito com sync-to-orcamentos:
// depois que os dois lados convergem, uma tentativa de "reescrever" o mesmo
// valor não gera nenhuma escrita, então o webhook do outro lado não dispara de
// novo. CNPJ ambíguo (mais de uma linha com o mesmo CNPJ normalizado) nunca
// tenta adivinhar qual atualizar — insere uma linha nova e avisa nos logs.

const ESTOQUE_URL = Deno.env.get("ESTOQUE_URL")!;
const ESTOQUE_SERVICE_ROLE_KEY = Deno.env.get("ESTOQUE_SERVICE_ROLE_KEY")!;

const normCnpj = (v: unknown) => (v ? String(v).replace(/\D/g, "") : "");
const normText = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

function buildTarget(company: Record<string, any>) {
  return {
    nome_fantasia: normText(company.nome) || null,
    razao_social: normText(company.razao_social) || null,
    cnpj: normCnpj(company.cnpj) || null, // grava em dígitos, convenção nativa do estoque
    telefone: normText(company.telefone) || null,
    email: normText(company.email) || null,
    endereco: normText(company.endereco) || null,
    tipo: (normText(company.tipo) || "CLIENTE").toUpperCase(),
    responsavel: normText(company.responsavel) || null,
  };
}

function isDifferent(existing: Record<string, any>, incoming: Record<string, any>) {
  if (normCnpj(existing.cnpj) !== normCnpj(incoming.cnpj)) return true;
  const keys = ["nome_fantasia", "razao_social", "telefone", "email", "endereco", "tipo", "responsavel"];
  return keys.some((k) => normText(existing[k]) !== normText(incoming[k]));
}

Deno.serve(async (req) => {
  try {
    const { type, record } = await req.json();
    if (!record || (type !== "INSERT" && type !== "UPDATE")) {
      return new Response("ignored", { status: 200 });
    }

    const incoming = buildTarget(record);
    const incomingCnpj = incoming.cnpj || "";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ESTOQUE_SERVICE_ROLE_KEY}`,
      apikey: ESTOQUE_SERVICE_ROLE_KEY,
    };

    const listRes = await fetch(
      `${ESTOQUE_URL}/rest/v1/empresas?select=id,nome_fantasia,razao_social,cnpj,telefone,email,endereco,tipo,responsavel`,
      { headers },
    );
    if (!listRes.ok) {
      console.error("list empresas failed", await listRes.text());
      return new Response("error listing target", { status: 500 });
    }
    const all: any[] = await listRes.json();
    const matches = incomingCnpj ? all.filter((t) => normCnpj(t.cnpj) === incomingCnpj) : [];

    if (matches.length === 0) {
      const r = await fetch(`${ESTOQUE_URL}/rest/v1/empresas`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(incoming),
      });
      if (!r.ok) {
        console.error("insert empresas failed", await r.text());
        return new Response("insert failed", { status: 500 });
      }
      return new Response("inserted", { status: 200 });
    }

    if (matches.length > 1) {
      console.warn(
        `Ambiguous CNPJ ${incomingCnpj} for companies.id=${record.id}: ${matches.length} rows in empresas (${matches.map((m) => m.id).join(", ")}). Inserting new row instead of guessing.`,
      );
      const r = await fetch(`${ESTOQUE_URL}/rest/v1/empresas`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(incoming),
      });
      if (!r.ok) {
        console.error("insert empresas failed (ambiguous)", await r.text());
        return new Response("insert failed", { status: 500 });
      }
      return new Response("inserted (ambiguous fallback)", { status: 200 });
    }

    const target = matches[0];
    if (!isDifferent(target, incoming)) {
      return new Response("no-op (already in sync)", { status: 200 });
    }

    const r = await fetch(`${ESTOQUE_URL}/rest/v1/empresas?id=eq.${target.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(incoming),
    });
    if (!r.ok) {
      console.error("update empresas failed", await r.text());
      return new Response("update failed", { status: 500 });
    }
    return new Response("updated", { status: 200 });
  } catch (e) {
    console.error("sync-to-estoque error", e);
    return new Response("error", { status: 500 });
  }
});
