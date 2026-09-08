-- Run after deploying the app and saving matching secrets in Supabase Vault:
-- safe_to_swim_origin: deployed HTTPS origin, e.g. https://your-app.vercel.app
-- safe_to_swim_cron_secret: same value as the server's CRON_SECRET
-- Enable pg_cron and pg_net in the Supabase dashboard first.
-- This named job is replaced on re-run; it does not create duplicate schedules.
select cron.schedule('safe-to-swim-source-checks', '* * * * *', $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name='safe_to_swim_origin') || '/api/source-checks',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='safe_to_swim_cron_secret')),
    timeout_milliseconds := 55000
  );
$$);
