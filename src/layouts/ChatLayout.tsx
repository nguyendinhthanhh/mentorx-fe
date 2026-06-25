import { Outlet } from 'react-router-dom'

/**
 * Dedicated layout for the /chat route.
 * Full-screen, no AppHeader or Footer — the chat page manages its own
 * navigation via an inline mini-header embedded in InboxSidebar.
 */
export default function ChatLayout() {
  return (
    <div className="h-dvh w-screen overflow-hidden bg-white">
      <Outlet />
    </div>
  )
}
