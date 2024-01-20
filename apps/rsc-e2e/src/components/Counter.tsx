'use client';

import { useState } from 'react';

export const Counter = ({ children }) => {
  const [count, setCount] = useState(0);
  return (
    <div style={{ border: '3px blue dashed', margin: '1em', padding: '1em' }}>
      <h3>!!!Client component</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      {children}
    </div>
  );
};
