import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ComplaintResponse } from '@/types'

interface ComplaintStoreState {
  myComplaints: ComplaintResponse[]
  addMyComplaint: (complaint: ComplaintResponse) => void
  clearMyComplaints: () => void
}

export const useComplaintStore = create<ComplaintStoreState>()(
  persist(
    (set) => ({
      myComplaints: [],

      addMyComplaint: (complaint) =>
        set((state) => ({
          myComplaints: [complaint, ...state.myComplaints],
        })),

      clearMyComplaints: () => set({ myComplaints: [] }),
    }),
    {
      name: 'complaint-storage',
      partialize: (state) => ({ myComplaints: state.myComplaints }),
    }
  )
)
