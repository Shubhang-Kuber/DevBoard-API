import { useState, useCallback, useEffect, useRef } from 'react';

let _push = null;

export function useToast() {
  const push = useCallback((msg, type = 'info') => {
    _push?.({ msg, type, id: Date.now() });
  }, []);
  return { toast: push };
}

export function ToastStack() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _push = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3000);
    };
    return () => { _push = null; };
  }, []);

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-dot" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
