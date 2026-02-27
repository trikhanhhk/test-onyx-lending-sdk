import type {
  SigningError,
  TransactionError,
  ValidationError,
} from '@test-onyx-lending/core';
import type {
  ERC712Signature,
  ExecutionPlan,
  HasProcessedKnownTransactionRequest,
  InsufficientBalanceError,
  OperationType,
  PermitTypedDataResponse,
} from '@test-onyx-lending/graphql';
import type { ResultAsync, TxHash } from '@test-onyx-lending/types';

export type TransactionExecutionResult = {
  txHash: TxHash;
  operation: OperationType | null;
};

/**
 * @internal
 */
export function isHasProcessedKnownTransactionRequest(
  result: TransactionExecutionResult,
): result is HasProcessedKnownTransactionRequest {
  return result.operation !== null;
}

export type ExecutionPlanHandler<T extends ExecutionPlan = ExecutionPlan> = (
  result: T,
) => ResultAsync<
  TransactionExecutionResult,
  SigningError | TransactionError | ValidationError<InsufficientBalanceError>
>;

export type PermitHandler = (
  result: PermitTypedDataResponse,
) => ResultAsync<ERC712Signature, SigningError>;
