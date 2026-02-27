import { AaveProvider } from '@test-onyx-lending/react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { client } from './client';

createRoot(document.getElementById('root')!).render(
  <AaveProvider client={client}>
    <App />
  </AaveProvider>,
);
