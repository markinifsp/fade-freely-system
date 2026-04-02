import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    const callerId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers });
    }

    // Get barbearia_id
    const { data: profile } = await adminClient
      .from("profiles").select("barbearia_id").eq("id", callerId).single();
    if (!profile?.barbearia_id) {
      return new Response(JSON.stringify({ error: "No barbearia found" }), { status: 400, headers });
    }
    const barbeariaId = profile.barbearia_id;

    // Parse body once
    const body = await req.json();
    const { action = "create", email, password, nome, telefone, comissao, horaInicio, horaFim, barbeiroId } = body;

    if (action === "create") {
      if (!email || !password || !nome) {
        return new Response(JSON.stringify({ error: "Missing: email, password, nome" }), { status: 400, headers });
      }

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { nome },
      });
      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers });
      }

      const userId = authData.user.id;
      await adminClient.from("profiles").update({ barbearia_id: barbeariaId, nome }).eq("id", userId);
      await adminClient.from("user_roles").insert({ user_id: userId, role: "barbeiro" });

      const { data: barbeiro, error: barbError } = await adminClient.from("barbeiros").insert({
        barbearia_id: barbeariaId, nome, email,
        telefone: telefone || null,
        comissao: comissao || 40,
        hora_inicio: horaInicio || "09:00",
        hora_fim: horaFim || "18:00",
        user_id: userId,
      }).select().single();

      if (barbError) {
        return new Response(JSON.stringify({ error: barbError.message }), { status: 500, headers });
      }

      await adminClient.from("barbeiro_permissoes").insert({
        barbeiro_id: barbeiro.id,
        ver_agenda_outros: false, ver_faturamento_total: false, editar_propria_agenda: true,
      });

      return new Response(JSON.stringify({ success: true, barbeiro }), { status: 200, headers });
    }

    if (action === "update_credentials") {
      if (!barbeiroId) {
        return new Response(JSON.stringify({ error: "Missing barbeiroId" }), { status: 400, headers });
      }

      const { data: barb } = await adminClient.from("barbeiros").select("user_id").eq("id", barbeiroId).single();
      if (!barb?.user_id) {
        return new Response(JSON.stringify({ error: "Barbeiro has no linked user" }), { status: 400, headers });
      }

      const updates: Record<string, string> = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      const { error } = await adminClient.auth.admin.updateUserById(barb.user_id, updates);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
      }

      if (email) {
        await adminClient.from("barbeiros").update({ email }).eq("id", barbeiroId);
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
});
