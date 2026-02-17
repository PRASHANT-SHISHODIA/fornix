import { create } from 'zustand';

const useUserStore = create((set) => ({
  profilePicture: null,
  setProfilePicture: (uri) => set({ profilePicture: uri }),
  clearUser: () => set({ profilePicture: null }),
}));

export default useUserStore;
