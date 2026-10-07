import { useEffect, useState } from 'react';

// `useEffect` is not invoked during server rendering, meaning
// we can use this to determine if we're on the server or not.
export function useClientOnlyValue(server, client) {
  const [value, setValue] = useState(server);
  useEffect(() => {
    // Intentional post-hydration switch: the server and first client render must match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(client);
  }, [client]);
  return value;
}
