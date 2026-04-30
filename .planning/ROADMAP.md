# Roadmap

## Milestone 1: Refatoração e Estabilização (Current)
Foco em organizar a fundação para suportar novas funcionalidades sem aumentar a complexidade técnica.

### Phase 1: Arquitetura e Roteamento
- [ ] Decompor `App.tsx` em Layouts e Sub-rotas.
- [ ] Centralizar lógica de autenticação e proteção de rotas.

### Phase 2: Refatoração de Repositórios
- [ ] Fragmentar `SupabaseCourseRepository.ts` em repositórios menores (ex: `CourseRepository`, `ModuleRepository`, `LessonRepository`).
- [ ] Refatorar `SupabaseAdminRepository.ts`.

### Phase 3: Otimização de Performance
- [ ] Implementar Code-splitting para bibliotecas pesadas.
- [ ] Otimizar consultas do TanStack Query.

## Milestone 2: Expansão de Funcionalidades
### Phase 4: Gamificação Avançada
- [ ] Sistema de conquistas e pontos.
- [ ] Leaderboard e notificações em tempo real.

### Phase 5: Inteligência Artificial (V2)
- [ ] Contexto de curso completo para o Study Buddy.
- [ ] Geração automática de quizzes baseados no conteúdo da aula.
