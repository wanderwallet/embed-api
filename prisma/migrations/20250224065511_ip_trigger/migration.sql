CREATE OR REPLACE FUNCTION public.handle_new_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    country_code VARCHAR(2);
    ip_addr INET;
BEGIN
    -- Fast exit conditions - check most likely failures first to avoid unnecessary processing
    IF NEW.content IS NULL OR NEW.status_code != 200 THEN
        RETURN NEW;
    END IF;
    
    -- Only process responses that look like JSON with a countryCode field
    -- This quick check avoids expensive parsing operations for irrelevant responses
    IF position('"countryCode"' in NEW.content) = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Now we know it's likely a geolocation response, process it
    BEGIN
        -- Use a single JSON parsing operation and store the result for reuse
        WITH json_content AS (
            SELECT NEW.content::jsonb AS data
        )
        SELECT 
            data->>'countryCode',
            (data->>'ipAddress')::INET
        INTO 
            country_code,
            ip_addr
        FROM json_content;
        
        -- Only proceed if we have both pieces of data we need
        IF country_code IS NOT NULL AND country_code != '' AND ip_addr IS NOT NULL THEN
            -- Use a single operation to update cache and sessions
            WITH cache_update AS (
                INSERT INTO "IpGeolocation" (ip, "countryCode")
                VALUES (ip_addr, country_code)
                ON CONFLICT (ip) DO UPDATE 
                SET "countryCode" = EXCLUDED."countryCode"
                RETURNING ip
            )
            UPDATE "Sessions"
            SET "countryCode" = country_code
            WHERE 
                ip = ip_addr AND 
                ("countryCode" IS NULL OR "countryCode" = '');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error processing geolocation response [ID: %]: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger with proper error handling
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net') THEN
        EXECUTE 'CREATE TRIGGER on_net_http_response
                AFTER INSERT ON net._http_response
                FOR EACH ROW
                EXECUTE FUNCTION public.handle_new_response();'; 
    END IF;
END $$;