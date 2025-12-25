import { create } from 'zustand';
import { User, Generation, CreditsInfo } from '../types';

interface AppState {
  // Auth state
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Guest state
  guestId: string | null;
  isGuest: boolean;
  
  // Credits state
  credits: CreditsInfo | null;
  
  // Generation state
  selectedImage: string | null;
  selectedStyle: string | null;
  customPrompt: string | null;
  currentGeneration: Generation | null;
  generations: Generation[];
  isGenerating: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setGuestId: (guestId: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setCredits: (credits: CreditsInfo | null) => void;
  setSelectedImage: (uri: string | null) => void;
  setSelectedStyle: (styleKey: string | null) => void;
  setCustomPrompt: (prompt: string | null) => void;
  setCurrentGeneration: (generation: Generation | null) => void;
  setGenerations: (generations: Generation[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
  resetForSignup: () => void;
}

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  guestId: null,
  isGuest: false,
  credits: null,
  selectedImage: null,
  selectedStyle: null,
  customPrompt: null,
  currentGeneration: null,
  generations: [],
  isGenerating: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,
  
  setUser: (user) => set((state) => ({ 
    user, 
    isAuthenticated: !!user,
    // When user is null and we have a guestId, we're in guest mode
    isGuest: !user && state.guestId !== null,
  })),
  
  setGuestId: (guestId) => set({ 
    guestId,
    isGuest: guestId !== null,
  }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setCredits: (credits) => set({ credits }),
  
  setSelectedImage: (selectedImage) => set({ selectedImage }),
  
  setSelectedStyle: (selectedStyle) => set({ selectedStyle }),
  
  setCustomPrompt: (customPrompt) => set({ customPrompt }),
  
  setCurrentGeneration: (currentGeneration) => set({ currentGeneration }),
  
  setGenerations: (generations) => set({ generations }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  reset: () => set(initialState),
  
  // Reset for signup - clears guest state but keeps guestId for migration
  resetForSignup: () => set({
    credits: null,
    generations: [],
    selectedImage: null,
    selectedStyle: null,
    customPrompt: null,
    currentGeneration: null,
    isGenerating: false,
  }),
}));
