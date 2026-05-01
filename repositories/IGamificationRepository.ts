import { Achievement } from '../domain/entities';

export interface IGamificationRepository {
  updateUserGamification(
    userId: string,
    xp: number,
    level: number,
    achievements: Achievement[]
  ): Promise<void>;

  saveAchievements(userId: string, achievements: Achievement[]): Promise<void>;
  
  logXpChange(userId: string, amount: number, actionType: string, description: string): Promise<void>;
  
  addXp(userId: string, amount: number, actionType: string, description: string): Promise<{ 
    success: boolean; 
    newXp: number; 
    levelUp: boolean; 
    newLevel: number 
  }>;

  getWeeklyXpHistory(userId: string): Promise<{ date: string; xp: number }[]>;
  
  getDashboardStats(userId: string): Promise<{
    xp_total: number;
    current_level: number;
  }>;

  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all-time'): Promise<{
    userId: string;
    userName: string;
    xp: number;
    level: number;
    avatarUrl?: string;
  }[]>;

  getAvailableAchievements(): Promise<Achievement[]>;
}
