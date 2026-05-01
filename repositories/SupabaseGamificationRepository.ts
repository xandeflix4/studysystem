import { SupabaseClient } from '@supabase/supabase-js';
import { IGamificationRepository } from './IGamificationRepository';
import { Achievement } from '../domain/entities';
import { DomainError } from '../domain/errors';

export class SupabaseGamificationRepository implements IGamificationRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async updateUserGamification(userId: string, xp: number, level: number, achievements: Achievement[]): Promise<void> {
    const serializedAchievements = achievements.map(a => ({
      ...a,
      dateEarned: a.dateEarned instanceof Date ? a.dateEarned.toISOString() : a.dateEarned
    }));

    const { error } = await this.client
      .from('profiles')
      .update({
        xp_total: xp,
        current_level: level,
        achievements: serializedAchievements,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw new DomainError(`Erro ao atualizar gamificação: ${error.message}`);
  }

  async saveAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    const serializedAchievements = achievements.map(a => ({
      ...a,
      dateEarned: a.dateEarned instanceof Date ? a.dateEarned.toISOString() : a.dateEarned
    }));

    const { error } = await this.client
      .from('profiles')
      .update({
        achievements: serializedAchievements,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw new DomainError(`Erro ao salvar conquistas: ${error.message}`);
  }

  async logXpChange(userId: string, amount: number, actionType: string, description: string): Promise<void> {
    const { error } = await this.client
      .from('xp_history')
      .insert({
        user_id: userId,
        amount,
        action_type: actionType,
        description
      });

    if (error) console.error('Failed to log XP change:', error);
  }

  async addXp(userId: string, amount: number, actionType: string, description: string): Promise<{ success: boolean; newXp: number; levelUp: boolean; newLevel: number }> {
    const { data, error } = await this.client.rpc('add_secure_xp', {
      p_user_id: userId,
      p_amount: amount,
      p_action_type: actionType,
      p_description: description
    });

    if (error) {
      console.error('⚠️ RPC add_secure_xp failed:', error.message);
      return { success: false, newXp: 0, levelUp: false, newLevel: 0 };
    }

    return {
      success: data.success,
      newXp: data.new_xp,
      levelUp: data.level_up,
      newLevel: data.new_level
    };
  }

  async getWeeklyXpHistory(userId: string): Promise<{ date: string; xp: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await this.client
      .from('xp_history')
      .select('created_at, amount')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw new DomainError(`Erro ao buscar histórico de XP: ${error.message}`);

    const groupedByDate = (data || []).reduce((acc, record) => {
      const date = new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      acc[date] = (acc[date] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      result.push({ date: dateStr, xp: groupedByDate[dateStr] || 0 });
    }
    return result;
  }

  async getDashboardStats(userId: string): Promise<{ xp_total: number; current_level: number }> {
    const { data, error } = await this.client.rpc('get_dashboard_stats', {
      p_user_id: userId
    });

    if (error) {
      console.error('⚠️ RPC get_dashboard_stats failed:', error.message);
      return { xp_total: 0, current_level: 1 };
    }

    return {
      xp_total: data.xp_total,
      current_level: data.current_level
    };
  }

  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all-time'): Promise<{
    userId: string;
    userName: string;
    xp: number;
    level: number;
    avatarUrl?: string;
  }[]> {
    const { data, error } = await this.client.rpc('get_leaderboard', {
      p_timeframe: timeframe
    });

    if (error) {
      console.error(`⚠️ RPC get_leaderboard (${timeframe}) failed:`, error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      userId: row.user_id,
      userName: row.name,
      xp: row.xp,
      level: row.level,
      avatarUrl: row.avatar_url
    }));
  }

  async getAvailableAchievements(): Promise<Achievement[]> {
    // Para simplificar e garantir que o frontend tenha todos os metadados (ícones, etc)
    // retornamos a lista mestra. No futuro, isso pode vir de uma tabela 'master_achievements'.
    return [
      {
        id: 'first-lesson',
        title: 'Primeiro Passo',
        description: 'Você concluiu sua primeira aula no sistema!',
        dateEarned: new Date(),
        icon: 'fa-rocket'
      },
      {
        id: 'module-master',
        title: 'Mestre do Módulo',
        description: 'Você completou um módulo inteiro!',
        dateEarned: new Date(),
        icon: 'fa-crown'
      },
      {
        id: 'course-complete',
        title: 'Conquistador do Curso',
        description: 'Você completou todas as aulas deste curso!',
        dateEarned: new Date(),
        icon: 'fa-trophy'
      },
      {
        id: 'xp-1000',
        title: 'Aprendiz Dedicado',
        description: 'Você alcançou 1.000 XP acumulados!',
        dateEarned: new Date(),
        icon: 'fa-bolt'
      },
      {
        id: 'xp-5000',
        title: 'Veterano do Estudo',
        description: 'Você alcançou 5.000 XP acumulados!',
        dateEarned: new Date(),
        icon: 'fa-award'
      },
      {
        id: 'level-5',
        title: 'Mestre do Conhecimento',
        description: 'Respeito! Você atingiu o Nível 5.',
        dateEarned: new Date(),
        icon: 'fa-brain'
      }
    ];
  }
}
