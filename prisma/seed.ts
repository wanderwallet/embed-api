import { supabase } from '../client/utils/supabase/supabase-client-client';

async function seedData() {
  console.log("Seeding data...");

  try {
    // Insert a sample user
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([
        {
          id: 'user-id-1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          notificationsSetting: 'ALL',
        },
      ])
      .select();

    if (userError) {
      throw new Error(`Error inserting user: ${userError.message}`);
    }
    console.log('User inserted:', user);

    // Insert a sample wallet
    const { data: wallet, error: walletError } = await supabase
      .from('Wallets')
      .insert([
        {
          id: 'wallet-id-1',
          userId: 'user-id-1',
          chain: 'ETHEREUM',
          address: '0x1234567890abcdef',
          status: 'ENABLED',
          info: { alias: 'My Wallet', pns: 'MyPNS' }, // Example JSON field
        },
      ])
      .select();

    if (walletError) {
      throw new Error(`Error inserting wallet: ${walletError.message}`);
    }
    console.log('Wallet inserted:', wallet);

    // Insert additional data as needed
    const { data: authMethod, error: authError } = await supabase
      .from('AuthMethods')
      .insert([
        {
          id: 'auth-method-id-1',
          userId: 'user-id-1',
          providerId: 'google-oauth-id',
          providerType: 'GOOGLE',
          providerLabel: 'Google Account',
        },
      ])
      .select();

    if (authError) {
      throw new Error(`Error inserting auth method: ${authError.message}`);
    }
    console.log('AuthMethod inserted:', authMethod);
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    console.log('Seeding complete!');
  }
}

seedData();
