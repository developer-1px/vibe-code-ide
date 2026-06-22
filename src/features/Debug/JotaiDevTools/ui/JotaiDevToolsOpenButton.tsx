interface JotaiDevToolsOpenButtonProps {
  openDevTools: () => void;
}

export function JotaiDevToolsOpenButton({ openDevTools }: JotaiDevToolsOpenButtonProps) {
  function handleClick() {
    openDevTools();
  }

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-semibold transition-colors z-50"
    >
      Jotai DevTools
    </button>
  );
}
