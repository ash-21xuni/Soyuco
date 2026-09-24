// Templates remount on every navigation, so this replays the enter
// animation each time you switch between Journal, Planner, AI, etc.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
