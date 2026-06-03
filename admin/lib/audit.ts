import { supabaseAdmin } from './supabase-admin';

export type ActionType = 'ban_user' | 'unban_user' | 'delete_event' | 'resolve_report' | 'delete_club';

export async function logAdminAction(
  adminId: string,
  actionType: ActionType,
  targetId: string,
  notes?: string
) {
  const { error } = await supabaseAdmin.from('admin_audit_log').insert({
    admin_id: adminId,
    action_type: actionType,
    target_id: targetId,
    notes: notes || null,
  });

  if (error) {
    console.error('Failed to log admin action:', error);
  }
}
