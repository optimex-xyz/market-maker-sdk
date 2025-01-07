export const SETTLEMENT_QUEUE = {
  TRANSFER: {
    NAME: 'transfer_settlement_queue',
    JOBS: {
      PROCESS: 'process_transfer',
    },
  },
  SUBMIT: {
    NAME: 'submit_settlement_queue',
    JOBS: {
      PROCESS: 'process_submit',
    },
  },
} as const;

export const SETTLEMENT_QUEUE_NAMES = [
  SETTLEMENT_QUEUE.TRANSFER.NAME,
  SETTLEMENT_QUEUE.SUBMIT.NAME,
] as const;
