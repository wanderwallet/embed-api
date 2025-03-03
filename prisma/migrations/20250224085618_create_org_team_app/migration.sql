-- create a function to create a new organization, team, and application for a user
-- example usage:
-- SELECT * FROM create_org_team_app_for_user(user_id, custom_name);
-- SELECT * FROM create_org_team_app_for_user('2f0ea108-0e82-4239-a99d-f4f2618f240f', 'Wander');

create or replace function public.create_org_team_app_for_user(
    user_id uuid,
    custom_name text DEFAULT NULL
)
returns table (
    organization_id uuid,
    team_id uuid,
    application_id uuid,
    api_key uuid
) 
security definer
set search_path = public
language plpgsql
as $$
declare
    name text;
    org_id uuid;
    team_id uuid;
    username text;
    api_key uuid;
    app_id uuid;
    user_record public."UserProfiles"%ROWTYPE;
begin
    -- Get user records from auth.users
    select * into user_record from  public."UserProfiles" where "supId" = user_id;
    if user_record is null then
        raise exception 'User not found in auth.users';
    end if;

    -- Use custom name if provided, otherwise get from Supabase auth metadata
    name := coalesce(
        custom_name,
        user_record.name,
        case 
            when user_record.email is not null then
                split_part(user_record.email, '@', 1)
            else
                'user' || substr(user_record."supId"::text, 1, 8)
        end
    );

    -- Generate URL-safe username and ensure minimum length
    username := lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'));
    if length(username) < 3 then
        username := 'user' || substr(user_record."supId"::text, 1, 8);
    end if;

    -- Create default organization
    insert into public."Organizations" (
        "name", 
        "slug",
        "ownerId",
        "createdAt",
        "updatedAt"
    )
    values (
        name || '''s Organization',
        username || '-org',
        user_id,
        now(),
        now()
    )
    returning "id" into org_id;

    -- Create default team
    insert into public."Teams" (
        "name", 
        "slug", 
        "plan", 
        "organizationId",
        "createdAt",
        "updatedAt"
    )
    values (
        name || '''s Team',
        username || '-team',
        'FREE',
        org_id,
        now(),
        now()
    )
    returning "id" into team_id;

    -- Add user as team member with owner role
    insert into public."TeamMembers" (
        "role",
        "teamId",
        "userId",
        "createdAt",
        "updatedAt"
    )
    values (
        'OWNER',
        team_id,
        user_id,
        now(),
        now()
    );

    -- Create default application
    insert into public."Applications" (
        "name",
        "description",
        "domains",
        "settings",
        "teamId",
        "createdAt",
        "updatedAt"
    )
    values (
        name || '''s Application',
        'Default application',
        ARRAY[]::varchar(255)[],
        '{}'::jsonb,
        team_id,
        now(),
        now()
    )
    returning "id" into app_id;

    api_key := gen_random_uuid();

    -- Create a default API key for the application
    insert into public."ApiKeys" (
        "name",
        "key",
        "applicationId",
        "createdAt"
    )
    values (
        'Default API Key',
        api_key,
        app_id,
        now()
    );

    return query select 
        org_id as organization_id,
        team_id,
        app_id as application_id,
        api_key;
end;
$$;

-- Ensure no other roles have access
REVOKE ALL ON FUNCTION public.create_org_team_app_for_user(uuid, text) FROM PUBLIC;