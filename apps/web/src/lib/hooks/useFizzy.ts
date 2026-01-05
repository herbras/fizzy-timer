/**
 * Fizzy API Hook
 * React hooks for interacting with the Fizzy API (client-only via proxy)
 * Now using TanStack Query for efficient caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings } from './useSettings';
import { createFizzyClient } from '../services/fizzy';
import type { FizzyAccount, ApiBoard, ApiCard, ApiColumn, Board, Card, Column } from '../db/schema';

/**
 * Query keys for Fizzy API
 * IMPORTANT: Keep keys stable for proper caching
 */
export const fizzyKeys = {
  identity: (token: string) => ['fizzy', 'identity', token] as const,
  boards: (accountSlug: string) => ['fizzy', 'boards', accountSlug] as const,
  columns: (accountSlug: string, boardId: string) => ['fizzy', 'columns', accountSlug, boardId] as const,
  cards: (accountSlug: string, boardId?: string | null, userId?: string | null) =>
    ['fizzy', 'cards', accountSlug, boardId, userId] as const,
} as const;

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching user identity (accounts) via proxy
 */
export function useIdentity() {
  const { fizzyToken } = useSettings();

  return useQuery({
    queryKey: fizzyKeys.identity(fizzyToken || ''),
    queryFn: async () => {
      if (!fizzyToken) {
        throw new Error('No token available');
      }
      const client = createFizzyClient(fizzyToken);
      const result = await client.getIdentity();
      return result.accounts;
    },
    enabled: !!fizzyToken,
    staleTime: 10 * 60 * 1000, // 10 minutes - identity rarely changes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for fetching boards via proxy
 * Uses TanStack Query for caching - no more refetch on page change!
 */
export function useBoards(accountSlug: string | null) {
  const { fizzyToken } = useSettings();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: accountSlug ? fizzyKeys.boards(accountSlug) : ['fizzy', 'boards', 'none'],
    queryFn: async () => {
      console.log('[useBoards] Fetching with accountSlug:', accountSlug);
      if (!fizzyToken || !accountSlug) {
        return null;
      }

      const client = createFizzyClient(fizzyToken);
      const boards = await client.getBoards(accountSlug);
      console.log('[useBoards] Result:', boards);
      return boards;
    },
    enabled: !!fizzyToken && !!accountSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes - boards don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // KEY: Don't refetch on mount if data is fresh
  });
}

/**
 * Hook for fetching columns for a board
 */
export function useColumns(accountSlug: string | null, boardId: string | null) {
  const { fizzyToken } = useSettings();

  return useQuery({
    queryKey: accountSlug && boardId ? fizzyKeys.columns(accountSlug, boardId) : ['fizzy', 'columns', 'none'],
    queryFn: async () => {
      if (!fizzyToken || !accountSlug || !boardId) {
        return null;
      }

      const client = createFizzyClient(fizzyToken);
      return await client.getColumns(accountSlug, boardId);
    },
    enabled: !!fizzyToken && !!accountSlug && !!boardId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for fetching cards via proxy (only cards assigned to current user)
 * Uses TanStack Query for caching - board filtering won't trigger full refetch
 */
export function useCards(accountSlug: string | null, boardId?: string | null) {
  const { fizzyToken, userId } = useSettings();

  return useQuery({
    queryKey: fizzyKeys.cards(accountSlug || '', boardId, userId),
    queryFn: async () => {
      if (!fizzyToken || !accountSlug) {
        return null;
      }

      const client = createFizzyClient(fizzyToken);
      // Filter by assignee on the API side - cards assigned to current user
      const apiCards = await client.getCards(accountSlug, {
        boardId: boardId ?? undefined,
        assigneeId: userId ?? undefined,
      });

      console.log('[useCards] Raw API cards:', apiCards.length);
      console.log('[useCards] Current userId:', userId);

      // Convert format - cards are already filtered by assignee from API
      const cards: Card[] = apiCards.map((apiCard) => toCard(apiCard, userId));

      console.log('[useCards] Converted cards:', cards.length);

      return cards;
    },
    enabled: !!fizzyToken && !!accountSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes - cards might change more frequently
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // KEY: Don't refetch on mount if data is fresh
  });
}

/**
 * Convert API board to app board format
 */
export function toBoard(apiBoard: ApiBoard): Board {
  // Generate a color based on board ID
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];
  const colorIndex = parseInt(apiBoard.id.slice(-4), 16) % colors.length;

  return {
    id: apiBoard.id,
    name: apiBoard.name,
    color: colors[colorIndex],
  };
}

/**
 * Convert API column to app column format
 */
export function toColumn(apiColumn: ApiColumn): Column {
  return {
    id: apiColumn.id,
    name: apiColumn.name,
    color: apiColumn.color,
    createdAt: apiColumn.created_at,
  };
}

/**
 * Convert API card to app card format
 */
export function toCard(apiCard: ApiCard, currentUserId?: string | null): Card {
  // Handle column color - can be string or object, or undefined/null
  const columnColor = apiCard.column?.color
    ? typeof apiCard.column.color === 'string'
      ? apiCard.column.color
      : apiCard.column.color.value || 'var(--color-card-default)'
    : 'var(--color-card-default)';

  return {
    id: apiCard.id,
    boardId: apiCard.board.id,
    boardName: apiCard.board.name,
    columnId: apiCard.column?.id ?? '',
    columnName: apiCard.column?.name ?? 'No Column',
    title: apiCard.title,
    status: apiCard.status as 'todo' | 'in-progress' | 'done',
    number: apiCard.number,
    description: apiCard.description,
    tags: [...apiCard.tags], // Clone readonly array
    golden: apiCard.golden,
    lastActiveAt: apiCard.last_active_at,
    createdAt: apiCard.created_at,
    url: apiCard.url,
    creatorId: apiCard.creator.id,
    creatorName: apiCard.creator.name,
    isOwner: currentUserId ? apiCard.creator.id === currentUserId : false,
  };
}
