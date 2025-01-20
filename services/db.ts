import { supabase } from "../lib/supabaseClient";

export async function createUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const { data: userData, error: userError } = await supabase
    .from("Users")
    .insert([{ id: data.user?.id, email: data.user?.email }])
    .select();

  if (userError) throw userError;

  return userData[0];
}

export async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function createSession(
  userId: string,
  deviceNonce: string,
  ip: string,
  userAgent: string
) {
  const { data, error } = await supabase
    .from("Sessions")
    .insert([
      {
        userId,
        deviceNonce,
        ip,
        userAgent,
        providerSessionId: `session_${Date.now()}`, // TODO: figure out how we want to format this
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
}
