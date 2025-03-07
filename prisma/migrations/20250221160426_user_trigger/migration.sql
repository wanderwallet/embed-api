-- The Shadow database (used for migrations) does not have the `auth` schema Supabase uses, so
-- trying to create the triggers below will throw the following error: "ERROR: schema "auth" does
-- not exist".
-- We could try to create the `auth`schema, but then we also need to start mocking tables and
-- potentially functions (once we get into RLS functionality). So, for now at least, it seems more
-- practical to add the triggers conditionally.

-- These triggers automatically create and update a UserProfile when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.

-- inserts a row into public.UserProfiles

create function public.handle_new_user()
returns trigger as $$
begin
    insert into public."UserProfiles" ("supId", "supEmail", "supPhone", "name", "email", "phone", "picture", "updatedAt")
    values (new.id, new.email, new.phone, new.raw_user_meta_data->>'full_name', new.email, new.phone, coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), now());
    return new;
end;

-- trigger the function above every time an auth.user is created

-- $$ language plpgsql security definer;
-- create trigger on_auth_user_created
--     after insert on auth.users
--     for each row execute procedure public.handle_new_user();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        EXECUTE 'CREATE TRIGGER on_auth_user_created
                  AFTER INSERT ON auth.users
                  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();';
    END IF;
END $$;

-- updates a public.UserProfiles' email and phone

create or replace function public.handle_update_user_email_n_phone()
returns trigger as $$
begin
    update public."UserProfiles"
    set
      "supEmail" = coalesce(new.email, "supEmail"),
      "supPhone" = coalesce(new.phone, "supPhone")
    where "supId" = new.id;
    return new;
end;

-- trigger the function above every time an auth.user's email or phone are updated

-- $$ language plpgsql security definer set search_path = public;
-- create trigger on_auth_user_updated
--     after update of email, phone on auth.users
--   for each row execute procedure public.handle_update_user_email_n_phone();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        EXECUTE 'CREATE TRIGGER on_auth_user_updated
                  AFTER UPDATE OF email, phone ON auth.users
                  FOR EACH ROW EXECUTE PROCEDURE public.handle_update_user_email_n_phone();';
    END IF;
END $$;


-- Create a trigger to handle the deletion of a user

create or replace function public.handle_delete_user()
returns trigger as $$
begin
    delete from public."UserProfiles" where "supId" = old.id;
    return old;
end;

-- Trigger the function above every time an auth.user is deleted

-- $$ language plpgsql security definer set search_path = public;
-- create trigger on_auth_user_deleted
--     after delete on auth.users
--     for each row execute procedure public.handle_delete_user();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        EXECUTE 'CREATE TRIGGER on_auth_user_deleted
                  AFTER DELETE ON auth.users
                  FOR EACH ROW EXECUTE PROCEDURE public.handle_delete_user();';
    END IF;
END $$;
