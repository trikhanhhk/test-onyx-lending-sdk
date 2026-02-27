import { AaveClient, staging } from '@test-onyx-lending/react';

export const client = AaveClient.create({
  environment: staging,
});
