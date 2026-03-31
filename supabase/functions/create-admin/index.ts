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

    // Check for a simple shared secret header
    const adminSecret = req.headers.get("x-admin-secret");
    if (adminSecret !== "barber-pro-setup-2026") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, password, nome, nomeBarbearia } = await req.json();

    if (!email || !password || !nome || !nomeBarbearia) {
      return new Response(JSON.stringify({ error: "Missing fields: email, password, nome, nomeBarbearia" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: authError?.message || "Failed to create user" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = authData.user.id;

    // 2. Create barbearia
    const { data: barbearia, error: barbError } = await supabase
      .from("barbearias")
      .insert({ nome: nomeBarbearia })
      .select()
      .single();

    if (barbError) {
      return new Response(JSON.stringify({ error: `Barbearia: ${barbError.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Update profile with barbearia_id
    await supabase
      .from("profiles")
      .update({ barbearia_id: barbearia.id, nome })
      .eq("id", userId);

    // 4. Assign admin role
    await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    return new Response(
      JSON.stringify({ success: true, user_id: userId, barbearia_id: barbearia.id, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
