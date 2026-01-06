import { create } from 'zustand';
import { User, Generation, CreditsInfo } from '../types';

interface AppState {
  // Auth state
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
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
  setIsLoading: (isLoading: boolean) => void;
  setCredits: (credits: CreditsInfo | null) => void;
  setSelectedImage: (uri: string | null) => void;
  setSelectedStyle: (styleKey: string | null) => void;
  setCustomPrompt: (prompt: string | null) => void;
  setCurrentGeneration: (generation: Generation | null) => void;
  setGenerations: (generations: Generation[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
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
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
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
}));
