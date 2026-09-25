// Supabase query builders are lazy: a write only reaches the server once it is
// awaited or .then()-ed. Fire-and-forget writes should end in
// `.then(reportWrite("save thing"))` so they both run and surface failures.
export function reportWrite(action: string) {
  return ({ error }: { error: { message: string } | null }) => {
    if (error) console.error(`Failed to ${action}:`, error.message);
  };
}
