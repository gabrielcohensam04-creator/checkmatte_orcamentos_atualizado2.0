// Deploy: projeto ESTOQUE (lspugeacsywfmfkkkrhu), nome da function: sync-to-orcamentos
// Disparada pelo Database Webhook em public.empresas (eventos Insert + Update).
//
// Secrets necessários (Project Settings → Edge Functions → Secrets):
//   ORCAMENTOS_URL               = https://qinjlrgvxmplvsotxyth.supabase.co
//   ORCAMENTOS_SERVICE_ROLE_KEY  = <service_role do projeto orçamentos>
//
// Só propaga linhas com tipo = CLIENTE (fornecedores, se existirem no futuro,
// nunca chegam ao app de orçamentos). Mesma lógica de comparação normalizada
// e fallback de CNPJ ambíguo do lado sync-to-estoque — ver comentário lá para
// detalhes de por que isso evita loop infinito.

const ORCAMENTOS_URL = Deno.env.get("ORCAMENTOS_URL")!;
const ORCAMENTOS_SERVICE_ROLE_KEY = Deno.env.get("ORCAMENTOS_SERVICE_ROLE_KEY")!;

const normCnpj = (v: unknown) => (v ? String(v).replace(/\D/g, "") : "");
const normText = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

function buildTarget(empresa: Record<string, any>) {
  return {
    nome: normText(empresa.nome_fantasia) || null,
    razao_social: normText(empresa.razao_social) || null,
    cnpj: normCnpj(empresa.cnpj) || null, // já é dígitos no estoque; grava como está
    telefone: normText(empresa.telefone) || null,
    email: normText(empresa.email) || null,
    endereco: normText(empresa.endereco) || null,
    tipo: (normText(empresa.tipo) || "CLIENTE").toUpperCase(),
    responsavel: normText(empresa.responsavel) || null,
    // `contato` de companies não tem origem em empresas: nunca é tocado por esta function.
  };
}

function isDifferent(existing: Record<string, any>, incoming: Record<string, any>) {
  if (normCnpj(existing.cnpj) !== normCnpj(incoming.cnpj)) return true;
  const keys = ["nome", "razao_social", "telefone", "email", "endereco", "tipo", "responsavel"];
  return keys.some((k) => normText(existing[k]) !== normText(incoming[k]));
}

Deno.serve(async (req) => {
  try {
    const { type, record } = await req.json();
    if (!record || (type !== "INSERT" && type !== "UPDATE")) {
      return new Response("ignored", { status: 200 });
    }
    if (normText(record.tipo).toUpperCase() !== "CLIENTE") {
      return new Response("skipped (not CLIENTE)", { status: 200 });
    }

    const incoming = buildTarget(record);
    const incomingCnpj = incoming.cnpj || "";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ORCAMENTOS_SERVICE_ROLE_KEY}`,
      apikey: ORCAMENTOS_SERVICE_ROLE_KEY,
    };

    const listRes = await fetch(
      `${ORCAMENTOS_URL}/rest/v1/companies?select=id,nome,razao_social,cnpj,telefone,email,endereco,tipo,responsavel`,
      { headers },
    );
    if (!listRes.ok) {
      console.error("list companies failed", await listRes.text());
      return new Response("error listing target", { status: 500 });
    }
    const all: any[] = await listRes.json();
    const matches = incomingCnpj ? all.filter((t) => normCnpj(t.cnpj) === incomingCnpj) : [];

    if (matches.length === 0) {
      const r = await fetch(`${ORCAMENTOS_URL}/rest/v1/companies`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(incoming),
      });
      if (!r.ok) {
        console.error("insert companies failed", await r.text());
        return new Response("insert failed", { status: 500 });
      }
      return new Response("inserted", { status: 200 });
    }

    if (matches.length > 1) {
      console.warn(
        `Ambiguous CNPJ ${incomingCnpj} for empresas.id=${record.id}: ${matches.length} rows in companies (${matches.map((m) => m.id).join(", ")}). Inserting new row instead of guessing.`,
      );
      const r = await fetch(`${ORCAMENTOS_URL}/rest/v1/companies`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(incoming),
      });
      if (!r.ok) {
        console.error("insert companies failed (ambiguous)", await r.text());
        return new Response("insert failed", { status: 500 });
      }
      return new Response("inserted (ambiguous fallback)", { status: 200 });
    }

    const target = matches[0];
    if (!isDifferent(target, incoming)) {
      return new Response("no-op (already in sync)", { status: 200 });
    }

    const r = await fetch(`${ORCAMENTOS_URL}/rest/v1/companies?id=eq.${target.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(incoming),
    });
    if (!r.ok) {
      console.error("update companies failed", await r.text());
      return new Response("update failed", { status: 500 });
    }
    return new Response("updated", { status: 200 });
  } catch (e) {
    console.error("sync-to-orcamentos error", e);
    return new Response("error", { status: 500 });
  }
});
