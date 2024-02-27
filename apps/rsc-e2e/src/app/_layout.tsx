import type { ReactNode } from 'react';

import { Link } from 'expo-router/build/rsc/router/client';

const Pending = ({ isPending }: { isPending: boolean }) => (
  <span
    style={{
      marginLeft: 5,
      transition: 'opacity 75ms 100ms',
      opacity: isPending ? 1 : 0,
    }}>
    Pending...
  </span>
);

const HomeLayout = ({ children }: { children: ReactNode }) => (
  <div>
    <title>Concurrent Router</title>
    <ul>
      <li>
        <Link to="/" pending={<Pending isPending />} notPending={<Pending isPending={false} />}>
          Home
        </Link>
      </li>
      <li>
        <Link to="/bar" pending={<Pending isPending />} notPending={<Pending isPending={false} />}>
          Bar
        </Link>
      </li>
    </ul>
    {children}
  </div>
);

export default HomeLayout;
