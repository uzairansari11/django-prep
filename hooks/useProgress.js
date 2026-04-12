'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'django-practice-progress';

function loadFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

function getInitialState() {
  const saved = loadFromStorage();
  if (!saved) {
    return {
      completedTopics: [],
      completedExercises: [],
      practiceCount: 0,
      streak: 0,
      lastPracticed: null,
      notes: {},
      bookmarks: [],
    };
  }
  return saved;
}

function computeStreak(lastPracticed) {
  if (!lastPracticed) return 0;
  const last = new Date(lastPracticed);
  const today = new Date();
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return null; // same day, no change
  if (diffDays === 1) return 'increment';
  return 'reset';
}

export function useProgress() {
  const [state, setState] = useState(() => {
    const s = getInitialState();
    return {
      ...s,
      completedTopics: new Set(s.completedTopics),
      completedExercises: new Set(s.completedExercises),
      bookmarks: new Set(s.bookmarks),
    };
  });

  // Persist whenever state changes
  useEffect(() => {
    saveToStorage({
      completedTopics: Array.from(state.completedTopics),
      completedExercises: Array.from(state.completedExercises),
      practiceCount: state.practiceCount,
      streak: state.streak,
      lastPracticed: state.lastPracticed,
      notes: state.notes,
      bookmarks: Array.from(state.bookmarks),
    });
  }, [state]);

  // ─── Topic helpers ──────────────────────────────────────────────────────
  const markTopicComplete = useCallback((id) => {
    setState((prev) => {
      const completedTopics = new Set(prev.completedTopics);
      completedTopics.add(String(id));

      const today = new Date().toISOString();
      const streakChange = computeStreak(prev.lastPracticed);
      let newStreak = prev.streak;
      if (streakChange === 'increment') newStreak += 1;
      else if (streakChange === 'reset') newStreak = 1;

      return {
        ...prev,
        completedTopics,
        practiceCount: prev.practiceCount + 1,
        streak: newStreak,
        lastPracticed: today,
      };
    });
  }, []);

  const markTopicIncomplete = useCallback((id) => {
    setState((prev) => {
      const completedTopics = new Set(prev.completedTopics);
      completedTopics.delete(String(id));
      return { ...prev, completedTopics };
    });
  }, []);

  const isTopicComplete = useCallback(
    (id) => state.completedTopics.has(String(id)),
    [state.completedTopics]
  );

  // ─── Exercise helpers ───────────────────────────────────────────────────
  const markExerciseComplete = useCallback((id) => {
    setState((prev) => {
      const completedExercises = new Set(prev.completedExercises);
      const isNew = !completedExercises.has(String(id));
      completedExercises.add(String(id));

      const today = new Date().toISOString();
      const streakChange = computeStreak(prev.lastPracticed);
      let newStreak = prev.streak;
      if (streakChange === 'increment') newStreak += 1;
      else if (streakChange === 'reset') newStreak = 1;

      return {
        ...prev,
        completedExercises,
        practiceCount: isNew ? prev.practiceCount + 1 : prev.practiceCount,
        streak: newStreak,
        lastPracticed: today,
      };
    });
  }, []);

  const isExerciseComplete = useCallback(
    (id) => state.completedExercises.has(String(id)),
    [state.completedExercises]
  );

  // ─── Bookmarks ──────────────────────────────────────────────────────────
  const toggleBookmark = useCallback((id) => {
    setState((prev) => {
      const bookmarks = new Set(prev.bookmarks);
      if (bookmarks.has(String(id))) {
        bookmarks.delete(String(id));
      } else {
        bookmarks.add(String(id));
      }
      return { ...prev, bookmarks };
    });
  }, []);

  const isBookmarked = useCallback(
    (id) => state.bookmarks.has(String(id)),
    [state.bookmarks]
  );

  // ─── Notes ──────────────────────────────────────────────────────────────
  const saveNote = useCallback((id, text) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [String(id)]: text },
    }));
  }, []);

  const getNote = useCallback(
    (id) => state.notes[String(id)] ?? '',
    [state.notes]
  );

  // ─── Stats ──────────────────────────────────────────────────────────────
  const getStats = useCallback(() => {
    const totalCompleted = state.completedTopics.size;
    const totalExercisesCompleted = state.completedExercises.size;
    const totalBookmarks = state.bookmarks.size;
    const hasActivity = state.lastPracticed !== null;

    // "Weak areas" are bookmarked items not yet completed
    const weakAreas = Array.from(state.bookmarks).filter(
      (id) => !state.completedTopics.has(id) && !state.completedExercises.has(id)
    );

    return {
      totalCompleted,
      totalExercisesCompleted,
      totalBookmarks,
      practiceCount: state.practiceCount,
      streak: state.streak,
      lastPracticed: state.lastPracticed,
      hasActivity,
      weakAreas,
      notesCount: Object.keys(state.notes).length,
    };
  }, [state]);

  // ─── Reset ──────────────────────────────────────────────────────────────
  const resetProgress = useCallback(() => {
    setState({
      completedTopics: new Set(),
      completedExercises: new Set(),
      practiceCount: 0,
      streak: 0,
      lastPracticed: null,
      notes: {},
      bookmarks: new Set(),
    });
  }, []);

  return {
    // State
    completedTopics: state.completedTopics,
    completedExercises: state.completedExercises,
    practiceCount: state.practiceCount,
    streak: state.streak,
    lastPracticed: state.lastPracticed,
    bookmarks: state.bookmarks,
    notes: state.notes,

    // Topic actions
    markTopicComplete,
    markTopicIncomplete,
    isTopicComplete,

    // Exercise actions
    markExerciseComplete,
    isExerciseComplete,

    // Bookmark actions
    toggleBookmark,
    isBookmarked,

    // Note actions
    saveNote,
    getNote,

    // Derived
    getStats,
    resetProgress,
  };
}
