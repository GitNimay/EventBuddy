import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      const authUser = authData.user;

      if (!authUser) {
        return { authUser: null, profile: null };
      }

      const { data: profile, error: profileError } = await supabase.rpc('get_current_user_profile');

      if (profileError) throw profileError;

      return { authUser, profile };
    },
  });
}

export default useCurrentUser;
