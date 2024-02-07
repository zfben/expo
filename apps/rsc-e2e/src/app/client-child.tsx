'use client';

import { useState } from 'react';

export default function ClientWithRscChildren({ children }) {
  const [count, setCount] = useState(0);
  return (
    <div
      style={{
        borderWidth: 3,
        borderColor: 'aquamarine',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount((c) => c + 1)} title="Increment" />
      {children}
    </div>
  );
}
