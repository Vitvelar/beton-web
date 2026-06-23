"use client";

export function PrintButton({ fileName }: { fileName?: string }) {
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
    <button
      onClick={handlePrint}
      className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors print:hidden"
    >
      Prenta / Vista PDF
    </button>
  );
}
