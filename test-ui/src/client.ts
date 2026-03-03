import { AaveClient, local, production, staging } from '@test-onyx-lending/react';

export type EnvironmentName = 'local' | 'staging' | 'production';

const ENVIRONMENTS = {
  local,
  staging,
  production,
} as const;

export function createAaveClient(environment: EnvironmentName) {
  return AaveClient.create({
    environment: ENVIRONMENTS[environment],
  });
}

