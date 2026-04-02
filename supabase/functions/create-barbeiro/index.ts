import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getUser();
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerId = claimsData.user.id;

    // Check caller is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get caller's barbearia_id
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("barbearia_id")
      .eq("id", callerId)
      .single();

    if (!callerProfile?.barbearia_id) {
      return new Response(JSON.stringify({ error: "No barbearia found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action } = await req.json().catch(() => ({ action: "create" }));
    const body = JSON.parse(await new Request(req.url, { method: req.method, headers: req.headers }).text().catch(() => "{}"));

    // Re-parse body properly
    const reqBody = await (async () => {
      // We already consumed the body above, let's handle this differently
      return {};
    })();

    // Actually, let's re-do the parsing properly
    return await handleRequest(req, adminClient, callerProfile.barbearia_id, callerId, corsHeaders);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function handleRequest(req: Request, adminClient: any, barbeariaId: string, callerId: string, corsHeaders: Record<string, string>) {
  // Clone and read body
  const body = await req.clone().json();
  const { action = "create", email, password, nome, telefone, comissao, horaInicio, horaFim, barbeiroId } = body;

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  if (action === "create") {
    if (!email || !password || !nome) {
      return new Response(JSON.stringify({ error: "Missing: email, password, nome" }), { status: 400, headers });
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers });
    }

    const userId = authData.user.id;

    // 2. Update profile with barbearia_id
    await adminClient.from("profiles").update({ barbearia_id: barbeariaId, nome }).eq("id", userId);

    // 3. Assign barbeiro role
    await adminClient.from("user_roles").insert({ user_id: userId, role: "barbeiro" });

    // 4. Create barbeiro record linked to user
    const { data: barbeiro, error: barbError } = await adminClient
      .from("barbeiros")
      .insert({
        barbearia_id: barbeariaId,
        nome,
        email,
        telefone: telefone || null,
        comissao: comissao || 40,
        hora_inicio: horaInicio || "09:00",
        hora_fim: horaFim || "18:00",
        user_id: userId,
      })
      .select()
      .single();

    if (barbError) {
      return new Response(JSON.stringify({ error: barbError.message }), { status: 500, headers });
    }

    // 5. Create default permissions
    await adminClient.from("barbeiro_permissoes").insert({
      barbeiro_id: barbeiro.id,
      ver_agenda_outros: false,
      ver_faturamento_total: false,
      editar_propria_agenda: true,
    });

    return new Response(JSON.stringify({ success: true, barbeiro }), { status: 200, headers });
  }

  if (action === "update_credentials") {
    if (!barbeiroId) {
      return new Response(JSON.stringify({ error: "Missing barbeiroId" }), { status: 400, headers });
    }

    // Get barbeiro's user_id
    const { data: barb } = await adminClient.from("barbeiros").select("user_id").eq("id", barbeiroId).single();
    if (!barb?.user_id) {
      return new Response(JSON.stringify({ error: "Barbeiro has no linked user" }), { status: 400, headers });
    }

    const updates: any = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    const { error } = await adminClient.auth.admin.updateUserById(barb.user_id, updates);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
    }

    // Update email on barbeiros table too
    if (email) {
      await adminClient.from("barbeiros").update({ email }).eq("id", barbeiroId);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
}
