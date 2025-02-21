-- The Shadow database (used for migrations) does not have the `auth` schema Supabase uses, so
-- we need to create it here to be able to create the triggers below. Otherwise, we'll get the
-- following error: ERROR: schema "auth" does not exist

CREATE SCHEMA IF NOT EXISTS auth;

-- The Shadow database (used for migrations) does not have the `auth.jwt()` function set up,
-- so we need to stub it here to not get an error when we try to create the RLS policies later.

DO $$
BEGIN
  CREATE FUNCTION auth.jwt()
  RETURNS jsonb
  LANGUAGE SQL
  AS 'SELECT NULL::json;';
EXCEPTION
  WHEN duplicate_function
  THEN NULL;
END; $$;

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.

-- inserts a row into public.ShadowUsers

create function public.handle_new_user()
returns trigger as $$
begin
    insert into public.ShadowUsers (supId, supEmail, supPhone, name, email, phone, picture)
    values (new.id, new.email, new.phone, new.raw_user_meta_data->>'full_name', new.email, new.phone, coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'));
    return new;
end;

-- trigger the function above every time an auth.user is created

$$ language plpgsql security definer;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- updates a public.ShadowUsers' email and phone

create or replace function public.handle_update_user_email_n_phone()
returns trigger as $$
begin
    update public.ShadowUsers.
    set
      supEmail = coalesce(new.email, supEmail),
      supPhone = coalesce(new.phone, supPhone)
    where supId = new.id;
    return new;
end;

-- trigger the function above every time an auth.user's email or phone are updated

$$ language plpgsql security definer set search_path = public;
create trigger on_auth_user_updated
    after update of email, phone on auth.users
  for each row execute procedure public.handle_update_user_email_n_phone();
