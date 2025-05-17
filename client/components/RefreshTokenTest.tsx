"use client";

// components/RefreshTokenTest.tsx
import { useState } from "react";
import { trpc } from "@/client/utils/trpc/trpc-client"
import { supabase } from "@/client/utils/supabase/supabase-client-client"
export default function RefreshTokenTest() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the tRPC hook properly
  const testQuery = trpc.test.getSessionInfo.useQuery(undefined, {
    enabled: false, // Don't run automatically
    retry: false,
  });
  
  const getSessionInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Refetch the query
      const result = await testQuery.refetch();
      
      if (result.error) {
        throw result.error;
      }
      
      setSessionInfo(result.data);
    } catch (err: any) {
      console.error("Error fetching session info:", err);
      setError(err.message || "Failed to get session info");
    } finally {
      setLoading(false);
    }
  };
  
  const refreshToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Refresh the session
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      // Get updated session info
      await getSessionInfo();
    } catch (err: any) {
      console.error("Error refreshing token:", err);
      setError(err.message || "Failed to refresh token");
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Refresh Token Test</h2>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={getSessionInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={loading || testQuery.isFetching}
        >
          Get Session Info
        </button>
        
        <button 
          onClick={refreshToken}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={loading || testQuery.isFetching}
        >
          Refresh Token
        </button>
      </div>
      
      {(loading || testQuery.isFetching) && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {testQuery.error && (
        <p className="text-red-500">{testQuery.error.message}</p>
      )}
      
      {sessionInfo && (
        <div className="mt-4">
          <h3 className="font-semibold">Session Info:</h3>
          <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-96">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}