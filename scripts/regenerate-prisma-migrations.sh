mv prisma/migrations/ prisma/migrations-old
npx prisma generate
npx prisma migrate dev --name init
mv prisma/migrations/*_init prisma/migrations/20250101000000_init
mv prisma/migrations-old/20250221160426_user_trigger prisma/migrations/
mv prisma/migrations-old/20250224065512_session_trigger prisma/migrations/
mv prisma/migrations-old/20250224085617_custom_access_token prisma/migrations/
mv prisma/migrations-old/20250505093811_user_exists_by_email prisma/migrations/
rm -rf prisma/migrations-old/
npx prisma migrate dev