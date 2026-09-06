"use client";

import { EntryEditor } from "@/components/journal/EntryEditor";
import { EntryList } from "@/components/journal/EntryList";

export default function JournalPage() {
  return (
    <div className="journal-layout">
      <EntryList />
      <div className="editor-pane">
        <EntryEditor />
      </div>
    </div>
  );
}
