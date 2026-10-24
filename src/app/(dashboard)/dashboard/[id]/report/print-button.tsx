"use client";

import { btn } from "@/lib/ui";

// Ónotaður varakostur (sjá ReportNav í page.tsx). Textinn kemur frá kallandanum úr
// stjórnborðskatalógnum — ekkert harðkóðað hér.
export function PrintButton({ fileName, label }: { fileName?: string; label: string }) {
  function handlePrint() {
    // Chrome notar document.title sem sjálfgefið skráarnafn í "Vista sem PDF".
    const previous = document.title;
    if (fileName) document.title = fileName;
    window.print();
    // Skila titlinum til baka eftir að prentglugginn lokast.
    window.setTimeout(() => {
      document.title = previous;
    }, 1500);
  }

  return (
    <button type="button" onClick={handlePrint} className={`${btn("primary")} print:hidden`}>
      {label}
    </button>
  );
}
