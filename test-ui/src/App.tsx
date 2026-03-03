import { useMemo, useState, type FC } from 'react';

import {
  AaveProvider,
  chainId,
  type Market,
  type Reserve,
  type MarketUserReserveBorrowPosition,
  type MarketUserReserveSupplyPosition,
  type MarketUserState,
  type PaginatedUserTransactionHistoryResult,
  type Chain,
  type UsdExchangeRate,
  type TokenAmount,
  type UserMeritRewards,
  type PaginatedVaultsResult,
  type Vault,
  type VaultUserActivityResult,
  type PaginatedVaultUserTransactionHistoryResult,
  ChainsFilter,
  useAaveChains,
  useAaveHealth,
  useAaveMarket,
  useAaveMarkets,
  useAaveReserve,
  useBorrowAPYHistory,
  useCreditDelegateeAllowance,
  useSavingsGhoBalance,
  useSupplyAPYHistory,
  useUserBorrows,
  useUserMarketState,
  useUserSupplies,
  useUserTransactionHistory,
  useUsdExchangeRates,
  useUserMeritRewards,
  useVault,
  useVaults,
  useUserVaults,
  useVaultUserActivity,
  useVaultUserTransactionHistory,
} from '@test-onyx-lending/react';

import { createAaveClient, type EnvironmentName } from './client';

type QueryVars = {
  chainId: number;
  market: string;
  underlyingToken: string;
  user: string;
  delegatee: string;
  vault: string;
};

type QueryField = {
  key: keyof QueryVars;
  label: string;
  type: 'number' | 'text';
};

type QueryDemo = {
  id: string;
  label: string;
  description: string;
  Component: FC<{ vars: QueryVars }>;
};

const DEFAULT_VARS: QueryVars = {
  chainId: 1,
  market: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
  underlyingToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  user: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  delegatee: '0x0000000000000000000000000000000000000001',
  vault: '0x0000000000000000000000000000000000000000',
};

const QUERY_FIELDS: Record<string, QueryField[]> = {
  markets: [
    { key: 'chainId', label: 'chainId', type: 'number' },
  ],
  market: [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
  ],
  reserve: [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    {
      key: 'underlyingToken',
      label: 'underlyingToken (asset address)',
      type: 'text',
    },
  ],
  'usd-exchange-rates': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    {
      key: 'underlyingToken',
      label: 'underlyingToken (asset address)',
      type: 'text',
    },
  ],
  'user-supplies': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'user-borrows': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'user-market-state': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'user-tx-history': [
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'borrow-apy-history': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    {
      key: 'underlyingToken',
      label: 'underlyingToken (asset address)',
      type: 'text',
    },
  ],
  'supply-apy-history': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    {
      key: 'underlyingToken',
      label: 'underlyingToken (asset address)',
      type: 'text',
    },
  ],
  'credit-delegatee-allowance': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'market', label: 'market (pool address)', type: 'text' },
    {
      key: 'underlyingToken',
      label: 'underlyingToken (asset address)',
      type: 'text',
    },
    { key: 'user', label: 'user address', type: 'text' },
    { key: 'delegatee', label: 'delegatee address', type: 'text' },
  ],
  'savings-gho-balance': [
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'user-merit-rewards': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'user', label: 'user address', type: 'text' },
  ],
  vault: [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'vault', label: 'vault address', type: 'text' },
  ],
  vaults: [
    { key: 'user', label: 'owner address', type: 'text' },
  ],
  'user-vaults': [
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'vault-user-activity': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'vault', label: 'vault address', type: 'text' },
    { key: 'user', label: 'user address', type: 'text' },
  ],
  'vault-user-tx-history': [
    { key: 'chainId', label: 'chainId', type: 'number' },
    { key: 'vault', label: 'vault address', type: 'text' },
    { key: 'user', label: 'user address', type: 'text' },
  ],
};

function JsonBlock(props: { value: unknown }) {
  return (
    <pre
      style={{
        background: '#111',
        color: '#eee',
        padding: '12px',
        borderRadius: '8px',
        overflow: 'auto',
        maxHeight: '60vh',
        fontSize: '12px',
      }}
    >
      {JSON.stringify(props.value, null, 2)}
    </pre>
  );
}

function MarketsDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useAaveMarkets({
    chainIds: [chainId(vars.chainId)],
  });

  if (loading) return <p>Loading markets…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data} />;
}

function MarketDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useAaveMarket({
    address: vars.market as any,
    chainId: chainId(vars.chainId),
  });

  if (loading) return <p>Loading market…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as Market | null} />;
}

function ReserveDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useAaveReserve({
    market: vars.market as any,
    underlyingToken: vars.underlyingToken as any,
    chainId: chainId(vars.chainId),
  });

  if (loading) return <p>Loading reserve…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as Reserve | null} />;
}

function ChainsDemo({ vars: _vars }: { vars: QueryVars }) {
  const { data, loading, error } = useAaveChains({
    filter: ChainsFilter.ALL,
  });

  if (loading) return <p>Loading chains…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as Chain[] | undefined} />;
}

function HealthDemo({ vars: _vars }: { vars: QueryVars }) {
  const { data, loading, error } = useAaveHealth();

  if (loading) return <p>Loading health…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data} />;
}

function UsdExchangeRatesDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUsdExchangeRates({
    market: vars.market as any,
    chainId: chainId(vars.chainId),
    underlyingTokens: [vars.underlyingToken as any],
  });

  if (loading) return <p>Loading USD exchange rates…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as UsdExchangeRate[] | undefined} />;
}

function UserSuppliesDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUserSupplies({
    markets: [
      {
        address: vars.market as any,
        chainId: chainId(vars.chainId),
      },
    ],
    user: vars.user as any,
  });

  if (loading) return <p>Loading user supplies…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return (
    <JsonBlock
      value={data as MarketUserReserveSupplyPosition[] | undefined}
    />
  );
}

function UserBorrowsDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUserBorrows({
    markets: [
      {
        address: vars.market as any,
        chainId: chainId(vars.chainId),
      },
    ],
    user: vars.user as any,
  });

  if (loading) return <p>Loading user borrows…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return (
    <JsonBlock
      value={data as MarketUserReserveBorrowPosition[] | undefined}
    />
  );
}

function UserStateDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUserMarketState({
    market: vars.market as any,
    user: vars.user as any,
    chainId: chainId(vars.chainId),
  });

  if (loading) return <p>Loading user market state…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as MarketUserState | undefined} />;
}

function UserTxHistoryDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUserTransactionHistory({
    user: vars.user as any,
    chainId: chainId(vars.chainId),
    market: vars.market as any,
  });

  if (loading) return <p>Loading user transaction history…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return (
    <JsonBlock
      value={data as PaginatedUserTransactionHistoryResult | undefined}
    />
  );
}

function BorrowApyHistoryDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useBorrowAPYHistory({
    chainId: chainId(vars.chainId),
    market: vars.market as any,
    underlyingToken: vars.underlyingToken as any,
    window: 'LastWeek' as any,
  });

  if (loading) return <p>Loading borrow APY history…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data} />;
}

function SupplyApyHistoryDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useSupplyAPYHistory({
    chainId: chainId(vars.chainId),
    market: vars.market as any,
    underlyingToken: vars.underlyingToken as any,
    window: 'LastWeek' as any,
  });

  if (loading) return <p>Loading supply APY history…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data} />;
}

function CreditDelegateeAllowanceDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useCreditDelegateeAllowance({
    market: vars.market as any,
    underlyingToken: vars.underlyingToken as any,
    user: vars.user as any,
    delegatee: vars.delegatee as any,
    chainId: chainId(vars.chainId),
  });

  if (loading) return <p>Loading credit delegatee allowance…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as TokenAmount | undefined} />;
}

function SavingsGhoBalanceDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useSavingsGhoBalance({
    user: vars.user as any,
  });

  if (loading) return <p>Loading sGHO balance…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as TokenAmount | undefined} />;
}

function UserMeritRewardsDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUserMeritRewards({
    user: vars.user as any,
    chainId: chainId(vars.chainId),
  });

  if (loading) return <p>Loading user Merit rewards…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as UserMeritRewards | null | undefined} />;
}

function VaultDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useVault({
    by: {
      address: vars.vault as any,
    },
    chainId: chainId(vars.chainId),
  });

  if (loading) return <p>Loading vault…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as Vault | null | undefined} />;
}

function VaultsDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useVaults({
    criteria: {
      ownedBy: [vars.user as any],
    },
  });

  if (loading) return <p>Loading vaults…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as PaginatedVaultsResult | undefined} />;
}

function UserVaultsDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useUserVaults({
    user: vars.user as any,
  });

  if (loading) return <p>Loading user vaults…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return <JsonBlock value={data as PaginatedVaultsResult | undefined} />;
}

function VaultUserActivityDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useVaultUserActivity({
    vault: vars.vault as any,
    chainId: chainId(vars.chainId),
    user: vars.user as any,
    window: 'LastWeek' as any,
  });

  if (loading) return <p>Loading vault user activity…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return (
    <JsonBlock value={data as VaultUserActivityResult | undefined} />
  );
}

function VaultUserTxHistoryDemo({ vars }: { vars: QueryVars }) {
  const { data, loading, error } = useVaultUserTransactionHistory({
    vault: vars.vault as any,
    chainId: chainId(vars.chainId),
    user: vars.user as any,
  });

  if (loading) return <p>Loading vault user transaction history…</p>;
  if (error) return <p>Error: {String(error)}</p>;

  return (
    <JsonBlock
      value={
        (data as PaginatedVaultUserTransactionHistoryResult | undefined) ??
        {}
      }
    />
  );
}

const QUERY_DEMOS: QueryDemo[] = [
  {
    id: 'markets',
    label: 'useAaveMarkets',
    description: 'Fetch all markets for given chain IDs',
    Component: MarketsDemo,
  },
  {
    id: 'market',
    label: 'useAaveMarket',
    description: 'Fetch a single market',
    Component: MarketDemo,
  },
  {
    id: 'reserve',
    label: 'useAaveReserve',
    description: 'Fetch a single reserve',
    Component: ReserveDemo,
  },
  {
    id: 'chains',
    label: 'useAaveChains',
    description: 'Fetch supported chains',
    Component: ChainsDemo,
  },
  {
    id: 'health',
    label: 'useAaveHealth',
    description: 'Health check query',
    Component: HealthDemo,
  },
  {
    id: 'usd-exchange-rates',
    label: 'useUsdExchangeRates',
    description: 'Fetch USD exchange rates',
    Component: UsdExchangeRatesDemo,
  },
  {
    id: 'user-supplies',
    label: 'useUserSupplies',
    description: 'Fetch user supply positions',
    Component: UserSuppliesDemo,
  },
  {
    id: 'user-borrows',
    label: 'useUserBorrows',
    description: 'Fetch user borrow positions',
    Component: UserBorrowsDemo,
  },
  {
    id: 'user-market-state',
    label: 'useUserMarketState',
    description: 'Fetch user market state',
    Component: UserStateDemo,
  },
  {
    id: 'user-tx-history',
    label: 'useUserTransactionHistory',
    description: 'Fetch user transaction history',
    Component: UserTxHistoryDemo,
  },
  {
    id: 'borrow-apy-history',
    label: 'useBorrowAPYHistory',
    description: 'Borrow APY history',
    Component: BorrowApyHistoryDemo,
  },
  {
    id: 'supply-apy-history',
    label: 'useSupplyAPYHistory',
    description: 'Supply APY history',
    Component: SupplyApyHistoryDemo,
  },
  {
    id: 'credit-delegatee-allowance',
    label: 'useCreditDelegateeAllowance',
    description: 'Credit delegatee allowance',
    Component: CreditDelegateeAllowanceDemo,
  },
  {
    id: 'savings-gho-balance',
    label: 'useSavingsGhoBalance',
    description: 'sGHO balance for user',
    Component: SavingsGhoBalanceDemo,
  },
  {
    id: 'user-merit-rewards',
    label: 'useUserMeritRewards',
    description: 'User Merit rewards',
    Component: UserMeritRewardsDemo,
  },
  {
    id: 'vault',
    label: 'useVault',
    description: 'Fetch a single vault',
    Component: VaultDemo,
  },
  {
    id: 'vaults',
    label: 'useVaults',
    description: 'Fetch vaults list',
    Component: VaultsDemo,
  },
  {
    id: 'user-vaults',
    label: 'useUserVaults',
    description: 'Fetch user vaults',
    Component: UserVaultsDemo,
  },
  {
    id: 'vault-user-activity',
    label: 'useVaultUserActivity',
    description: 'Vault user activity',
    Component: VaultUserActivityDemo,
  },
  {
    id: 'vault-user-tx-history',
    label: 'useVaultUserTransactionHistory',
    description: 'Vault user transaction history',
    Component: VaultUserTxHistoryDemo,
  },
];

export function App() {
  const [selectedId, setSelectedId] = useState<string>(QUERY_DEMOS[0]?.id ?? 'markets');
  const [queryKey, setQueryKey] = useState(0);
  const [environment, setEnvironment] = useState<EnvironmentName>('local');
  const [vars, setVars] = useState<QueryVars>(DEFAULT_VARS);

  const client = useMemo(
    () => createAaveClient(environment),
    [environment],
  );

  const selected = QUERY_DEMOS.find((q) => q.id === selectedId);
  const activeFields = QUERY_FIELDS[selectedId] ?? [];

  return (
    <AaveProvider client={client}>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
        }}
      >
        <aside
          style={{
            width: '280px',
            borderRight: '1px solid #333',
            padding: '16px',
          }}
        >
          <h2>SDK Queries</h2>
          <p style={{ fontSize: '12px' }}>
            Select a query to call and view the result.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '80vh', overflowY: 'auto' }}>
            {QUERY_DEMOS.map((demo) => (
              <li key={demo.id} style={{ marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedId(demo.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    background:
                      selectedId === demo.id ? '#333' : 'transparent',
                    color: selectedId === demo.id ? '#fff' : 'inherit',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <div>{demo.label}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      opacity: 0.7,
                    }}
                  >
                    {demo.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section style={{ flex: 1, padding: '16px' }}>
          <header style={{ marginBottom: '12px' }}>
            <section
              style={{
                gap: '16px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>Environment</strong>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {(['local', 'staging', 'production'] as EnvironmentName[]).map(
                    (env) => (
                      <label key={env} style={{ fontSize: '12px' }}>
                        <input
                          type="radio"
                          name="environment"
                          value={env}
                          checked={environment === env}
                          onChange={() => setEnvironment(env)}
                        />{' '}
                        {env}
                      </label>
                    ),
                  )}
                </div>
              </div>
              <div>
                <strong>Variables</strong>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px 8px',
                    marginTop: '4px',
                    fontSize: '12px',
                  }}
                >
                  {activeFields.length === 0 ? (
                    <span style={{ opacity: 0.7 }}>
                      No variables required for this query.
                    </span>
                  ) : (
                    activeFields.map((field) => (
                      <label key={field.key}>
                        {field.label}:{' '}
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={
                            field.type === 'number'
                              ? String(vars[field.key] as number)
                              : (vars[field.key] as string)
                          }
                          min={field.type === 'number' ? 1 : undefined}
                          onChange={(e) =>
                            setVars((prev) =>
                              ({
                                ...prev,
                                [field.key]:
                                  field.type === 'number'
                                    ? Number.parseInt(
                                        e.target.value || '0',
                                        10,
                                      )
                                    : e.target.value,
                              }) as QueryVars,
                            )
                          }
                          style={{
                            width: field.type === 'number' ? '150px' : '320px',
                            padding: '2px 16px',
                          }}
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>
            </section>
            <div style={{ display: 'flex', gap: '8px' }}>
            <h1
              style={{
                marginBottom: '4px',
                fontSize: '20px',
              }}
            >
              Onyx Lending SDK – Query Playground
            </h1>
            <button
              style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '12px' }}
              type="button"
              onClick={() => {
                setQueryKey((prev) => prev + 1);
              }}
            >
              Query
            </button>
            </div>
            {selected ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  opacity: 0.8,
                }}
              >
                {selected.label}: {selected.description}
              </p>
            ) : (
              <p>No query selected.</p>
            )}
          </header>
          <div>
            {selected ? (
              <selected.Component key={queryKey} vars={vars} />
            ) : (
              <p>Select a query from the left panel.</p>
            )}
          </div>
        </section>
      </div>
    </AaveProvider>
  );
}

