import { assertOk, bigDecimal, evmAddress } from '@test-onyx-lending/client';
import {
  collateralToggle,
  supply,
  userSupplies,
} from '@test-onyx-lending/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_MARKET_ADDRESS,
  ETHEREUM_WETH_ADDRESS,
  fundErc20Address,
} from '@test-onyx-lending/client/test-utils';
import { sendWith } from '@test-onyx-lending/client/viem';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Given Aave Market', () => {
  describe('And a user with a supply position', () => {
    describe('When the user toggles the position as collateral', () => {
      const wallet = createNewWallet();

      beforeAll(async () => {
        const result = await fundErc20Address(
          ETHEREUM_WETH_ADDRESS,
          evmAddress(wallet.account!.address),
          bigDecimal('0.02'),
        ).andThen(() =>
          supply(client, {
            market: ETHEREUM_MARKET_ADDRESS,
            chainId: ETHEREUM_FORK_ID,
            sender: evmAddress(wallet.account!.address),
            amount: {
              erc20: {
                currency: ETHEREUM_WETH_ADDRESS,
                value: bigDecimal('0.01'),
              },
            },
          })
            .andThen(sendWith(wallet))
            .andThen(client.waitForTransaction),
        );
        assertOk(result);
      });

      it('Then it should be reflected in the user supply positions', async () => {
        const userSuppliesBefore = await userSupplies(client, {
          markets: [
            { address: ETHEREUM_MARKET_ADDRESS, chainId: ETHEREUM_FORK_ID },
          ],
          user: evmAddress(wallet.account!.address),
        });
        assertOk(userSuppliesBefore);

        // Toggle collateral
        const result = await collateralToggle(client, {
          market: ETHEREUM_MARKET_ADDRESS,
          chainId: ETHEREUM_FORK_ID,
          user: evmAddress(wallet.account!.address),
          underlyingToken: ETHEREUM_WETH_ADDRESS,
        })
          .andThen(sendWith(wallet))
          .andThen(client.waitForTransaction);
        assertOk(result);

        const userSuppliesAfter = await userSupplies(client, {
          markets: [
            { address: ETHEREUM_MARKET_ADDRESS, chainId: ETHEREUM_FORK_ID },
          ],
          user: evmAddress(wallet.account!.address),
        });
        assertOk(userSuppliesAfter);
        expect(userSuppliesAfter.value).toEqual([
          expect.objectContaining({
            isCollateral: !userSuppliesBefore.value[0]?.isCollateral,
          }),
        ]);
      });
    });
  });
});
