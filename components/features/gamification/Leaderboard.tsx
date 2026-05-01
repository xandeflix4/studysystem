import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gamificationRepository } from '@/services/Dependencies';

type Timeframe = 'weekly' | 'monthly' | 'all-time';

interface LeaderboardEntry {
    userId: string;
    userName: string;
    xp: number;
    level: number;
    avatarUrl?: string;
}

const Leaderboard: React.FC = () => {
    const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const data = await gamificationRepository.getLeaderboard(timeframe);
                setEntries(data);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [timeframe]);

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return 'from-amber-300 to-amber-500 shadow-amber-500/20';
            case 1: return 'from-slate-300 to-slate-400 shadow-slate-400/20';
            case 2: return 'from-orange-400 to-orange-600 shadow-orange-600/20';
            default: return 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-transparent';
        }
    };

    const getRankBadge = (index: number) => {
        switch (index) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return `#${index + 1}`;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
            {/* Header / Tabs */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Leaderboard</h3>
                        <p className="text-sm text-slate-500 font-medium">Os maiores estudantes da semana</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                        <i className="fas fa-trophy text-lg"></i>
                    </div>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {(['weekly', 'monthly', 'all-time'] as Timeframe[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                                timeframe === t 
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {t === 'weekly' ? 'Semanal' : t === 'monthly' ? 'Mensal' : 'Geral'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Calculando rankings...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-20">
                        <i className="fas fa-ghost text-slate-300 text-4xl mb-4"></i>
                        <p className="text-slate-500 font-medium italic">Ninguém pontuou ainda neste período.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode='popLayout'>
                            {entries.map((entry, index) => (
                                <motion.div
                                    key={entry.userId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        index < 3 
                                            ? 'bg-gradient-to-r dark:text-white border-transparent' 
                                            : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                    } ${getRankColor(index)}`}
                                >
                                    <div className={`w-8 text-sm font-black text-center ${index < 3 ? 'text-white' : 'text-slate-400'}`}>
                                        {getRankBadge(index)}
                                    </div>

                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 ${index < 3 ? 'border-white/40' : 'border-slate-200 dark:border-slate-700'}`}>
                                            {entry.avatarUrl ? (
                                                <img src={entry.avatarUrl} alt={entry.userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                    <i className="fas fa-user text-slate-400"></i>
                                                </div>
                                            )}
                                        </div>
                                        {index === 0 && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-lg">
                                                👑
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className={`font-black text-sm truncate ${index < 3 ? 'text-white' : ''}`}>
                                            {entry.userName}
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase tracking-tight ${index < 3 ? 'text-white/70' : 'text-slate-500'}`}>
                                            Nível {entry.level}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`text-sm font-black ${index < 3 ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                            {entry.xp.toLocaleString()}
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-tighter ${index < 3 ? 'text-white/60' : 'text-slate-400'}`}>
                                            XP
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Bottom Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                    Rankings atualizados em tempo real
                </p>
            </div>
        </div>
    );
};

export default Leaderboard;
