/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/optimex_sol_smartcontract.json`.
 */
export type OptimexSolSmartcontract = {
  address: 'E2pt2s1vZjgf1eBzWhe69qDWawdFKD2u4FbLEFijSMJP'
  metadata: {
    name: 'optimexSolSmartcontract'
    version: '0.1.0'
    spec: '0.1.0'
    description: 'Created with Anchor'
  }
  docs: [
    'This is the main module of the Optimex protocol. Contains the instructions that are performed by the protocol.',
  ]
  instructions: [
    {
      name: 'addFeeReceiver'
      docs: [
        'Add fee receiver.',
        '',
        'This instruction is authorized by the [Config::admin].',
        '# Arguments',
        '* `ctx` - A [Context] of [AddFeeReceiver] required for adding the fee receiver.',
        '* `receiver_pubkey` - The pubkey of the fee receiver.',
        '# Errors',
        '* [CustomError::Unauthorized] - The caller is not authorized, or not the admin.',
      ]
      discriminator: [142, 75, 96, 92, 227, 95, 180, 219]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The admin that is authorized to perform the add fee receiver instruction.',
            'Must be the [Config::admin]',
          ]
          writable: true
          signer: true
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'feeReceiver'
          docs: [
            'The fee receiver PDA account that contains the fee receiver information.',
            'Will be initialized by the signer.',
          ]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [102, 101, 101, 95, 114, 101, 99, 101, 105, 118, 101, 114]
              },
              {
                kind: 'arg'
                path: 'receiverPubkey'
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'receiverPubkey'
          type: 'pubkey'
        },
      ]
    },
    {
      name: 'addOrRemoveOperator'
      docs: [
        'Add or remove an operator for the protocol.',
        '',
        'This instruction is authorized by the [Config::admin].',
        '# Arguments',
        '* `ctx` - A [Context] of [AddOrRemoveOperator] required for adding or removing an operator.',
        '* `operator` - The operator to add or remove.',
        '* `is_bool` - Whether to add or remove the operator.',
        '# Errors',
        '* [CustomError::Unauthorized] when the caller is not authorized, not the [Config::admin].',
        '* [CustomError::OperatorAlreadyExists] when add a operator that is already exists.',
        '* [CustomError::OperatorLimitReached] when add a operator and reach the limit of [Config::OPERATORS_SIZE].',
        '* [CustomError::OperatorNotFound] when remove a operator that is not exists.',
      ]
      discriminator: [242, 151, 243, 85, 157, 174, 36, 182]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The signer account that is authorized to perform the add or remove operator instruction.',
            'Must be the [Config::admin]',
          ]
          writable: true
          signer: true
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'operator'
          type: 'pubkey'
        },
        {
          name: 'isAdd'
          type: 'bool'
        },
      ]
    },
    {
      name: 'addOrUpdateWhitelist'
      docs: [
        'Add or update whitelist token setup.',
        '',
        'This instruction is authorized by the [Config::operators].',
        '# Arguments',
        '* `ctx` - A [Context] of [AddOrUpdateWhitelist] required for adding or updating the whitelist.',
        '* `amount` - The minimum amount to set for the whitelisted token.',
        '# Errors',
        '* [CustomError::Unauthorized] - The caller is not authorized, or not the operator.',
      ]
      discriminator: [37, 38, 2, 162, 195, 182, 21, 30]
      accounts: [
        {
          name: 'operator'
          docs: [
            'The operator that is authorized to perform the add or update whitelist instruction.',
            'Must be the [Config::operators]',
          ]
          writable: true
          signer: true
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'whitelistToken'
          docs: [
            'The whitelist token PDA account that contains the whitelist token information.',
            'If SOL native, used WSOL PDA account.',
          ]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [119, 104, 105, 116, 101, 108, 105, 115, 116]
              },
              {
                kind: 'account'
                path: 'token'
              },
            ]
          }
        },
        {
          name: 'token'
          docs: ['The mint token account that we want to set whitelist.']
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'amount'
          type: 'u64'
        },
      ]
    },
    {
      name: 'claim'
      docs: [
        'Claim the deposited amount after the timeout. This instruction is authorized by anyone.',
        '',
        'The deposited amount is transferred to the [TradeDetail::refund_pubkey].',
        'This instruction close the [NonceCheckAccount], transfer rent fee to [TradeDetail::user_pubkey], and allow the nonce can be used by other trade.',
        '# Arguments',
        '* `ctx` - A [Context] of [Claim] required for claiming the deposited amount.',
        '* `claim_args` - An argument [ClaimArgs] required for claiming the deposited amount.',
        '# Errors',
        '* [CustomError::InvalidUserAccount] when the user account not match with [TradeDetail::user_pubkey].',
        '* [CustomError::InvalidRefundPubkey] when the refund pubkey address is not match with the [TradeDetail::refund_pubkey].',
        '* [CustomError::CLaimNotAvailable] when the [TradeDetail::timeout] is not expired, so we cannot claim the deposited amount.',
        '* [CustomError::InvalidTradeStatus] when the [TradeDetail::status] is not [TradeStatus::Deposited], we only claim the Deposited trade and timed out.',
        '* [CustomError::InvalidMintKey] when the mint key is not match with the [TradeDetail::token]',
        '* [CustomError::InvalidSourceAta] when the source to transfer from is not the associated token account of the vault and mint.',
        '* [CustomError::InvalidDestinationAta] when the destination to transfer to is not the associated token account of the refund pubkey.',
      ]
      discriminator: [62, 198, 214, 193, 213, 159, 108, 210]
      accounts: [
        {
          name: 'signer'
          docs: ['The signer account that is authorized to perform the claim instruction.', 'Can be anyone.']
          writable: true
          signer: true
        },
        {
          name: 'userAccount'
          docs: ['', 'The user account that is the depositor of the trade.', 'Must be the [TradeDetail::user_pubkey]']
          writable: true
        },
        {
          name: 'nonceCheckAccount'
          docs: [
            'The nonce check account PDA that flag whether the nonce is currently active or not.',
            'Will be closed and transferred rent to the user_account.',
          ]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [110, 111, 110, 99, 101]
              },
              {
                kind: 'account'
                path: 'user_trade_detail.user_ephemeral_pubkey'
                account: 'tradeDetail'
              },
            ]
          }
        },
        {
          name: 'userTradeDetail'
          docs: ['The trade detail PDA that contains the trade information.']
          writable: true
        },
        {
          name: 'vault'
          docs: ['The trade vault PDA that corresponds to the trade.']
          writable: true
        },
        {
          name: 'refundAccount'
          docs: ['', 'The refund account of the trade.', 'Must be the [TradeDetail::refund_pubkey]']
          writable: true
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'claimArgs'
          type: {
            defined: {
              name: 'claimArgs'
            }
          }
        },
      ]
    },
    {
      name: 'closeFinishedTrade'
      docs: [
        'Close the finished trade ([TradeStatus::Settled] or [TradeStatus::Claimed]) to reclaim the rent fee.',
        '',
        'Transfer the rent fee of [TradeDetail], [TradeVault] and [anchor_spl::token::TokenAccount] to the [TradeDetail::user_pubkey].',
        '',
        'Depend on the trade status, the close action is different:',
        '* When the trade is [TradeStatus::Deposited], this action is not allowed.',
        '* When the trade is [TradeStatus::Claimed], this action is allowed for anyone.',
        '* When the trade is [TradeStatus::Settled], MPC can close the trade right away. Otherwise, anyone can close the trade after the [TradeDetail::timeout] + [Config::close_trade_duration].',
        '# Arguments',
        '* `ctx` - A [Context] of [CloseFinishedTradeAccounts] required for closing the trade.',
        '* `_close_finished_trade_args` - An argument [CloseFinishedTradeArgs] required for closing the trade.',
        '# Errors',
        '* [CustomError::InvalidUserAccount] when the user account is not match to [TradeDetail::user_pubkey]. This account will receive the claimed rent fee.',
        '* [CustomError::InvalidTradeStatus] when the trade status is [TradeStatus::Deposited].',
        '* [CustomError::CloseNotAvailable] when the trade is not the available time to close.',
      ]
      discriminator: [176, 51, 115, 198, 119, 249, 227, 63]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The signer account that is authorized to perform the close finished trade instruction.',
            'Depends on the trade status and timeout, the signer can be the MPC or anyone.',
          ]
          writable: true
          signer: true
        },
        {
          name: 'userAccount'
          docs: [
            'The user_account that receive the rent fee of closed account.',
            'Must be the [TradeDetail::user_pubkey]',
          ]
          writable: true
        },
        {
          name: 'userTradeDetail'
          docs: [
            'The trade detail PDA that contains the trade information.',
            'This PDA will be closed by the instruction.',
          ]
          writable: true
        },
        {
          name: 'vault'
          docs: ['The trade vault PDA that corresponds to the trade.', 'This PDA will be closed by the instruction.']
          writable: true
        },
        {
          name: 'config'
          docs: ['The config PDA that contains the protocol configuration.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'vaultTokenAccount'
          docs: ['The token account of the trade.', 'This account will be closed by the instruction.']
          writable: true
          optional: true
        },
        {
          name: 'userTokenAccount'
          docs: [
            'The user token account that is used to receive the amount if someone transfer the token after closed the trade.',
          ]
          writable: true
          optional: true
        },
        {
          name: 'tokenProgram'
          docs: ['The token program.']
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        },
      ]
      args: [
        {
          name: 'closeFinishedTradeArgs'
          type: {
            defined: {
              name: 'closeFinishedTradeArgs'
            }
          }
        },
      ]
    },
    {
      name: 'closePaymentReceipt'
      docs: [
        'Close a [PaymentReceipt] account, reclaim the rent fee.',
        '',
        'The [PaymentReceiptrent fee is transferred to the [PaymentReceipt::from_pubkey] account.',
        'This instruction is authorized by the [PaymentReceipt::from_pubkey] account.',
        'Can close after [PaymentReceipt::payment_time] + [Config::close_payment_duration].',
        '# Arguments',
        '* `ctx` - A [Context] of [ClosePaymentReceiptAccounts] required for closing the payment receipt.',
        '# Errors',
        '* [CustomError::InvalidUserAccount] - When the signer is not match to [PaymentReceipt::from_pubkey].',
        '* [CustomError::CloseNotAvailable] - Not the available time to close the payment receipt.',
      ]
      discriminator: [192, 42, 180, 252, 51, 166, 11, 158]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The signer account, which is authorized to perform the close payment receipt instruction.',
            'Must be the same as the [PaymentReceipt::from_pubkey].',
          ]
          writable: true
          signer: true
        },
        {
          name: 'paymentReceipt'
          docs: [
            'The payment receipt PDA that contains the payment information.',
            'This PDA will be closed by the instruction.',
          ]
          writable: true
        },
        {
          name: 'config'
          docs: ['The config PDA that contains the protocol configuration.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: []
    },
    {
      name: 'deposit'
      docs: [
        'Handles the deposit of either tokens or SOL into the vault.',
        '',
        'Only token that is set whitelisted can be deposited.',
        '',
        'The [TradeDetail], [TradeVault], [NonceCheckAccount], [anchor_spl::token::TokenAccount] of vault and token mint, are created in this instruction.',
        '# Arguments',
        '* `ctx` - A [Context] of [DepositAccounts] required for the deposit.',
        '* `deposit_args` - An argument [DepositArgs] required for the deposit.',
        '# Errors',
        '* [CustomError::NotWhitelistedToken] when the token is not whitelisted.',
        '* [CustomError::NonceAccountBeingUsed] when the nonce account is being used by another trade, or not yet closed.',
        '* [CustomError::Unauthorized] when the signer is not match with the pubkey in the [DepositArgs]',
        '* [CustomError::InvalidTimeout] when the current timestamp is greater than the deposit timeout.',
        '* [CustomError::DepositZeroAmount] when the deposit amount is zero.',
        '* [CustomError::InvalidAmount] when the deposit amount is less than the whitelisted amount.',
        '* [CustomError::InvalidTradeId] when the calculated trade ID is not match with the trade ID in the [DepositArgs].',
        '* [CustomError::InvalidMintKey] when the mint key is not match with the mint of the trade.',
        '* [CustomError::InvalidSourceAta] when the source to transfer from is not the associated token account of the signer and mint.',
        '* [CustomError::InvalidDestinationAta] when the destination to transfer to is not the associated token account of the vault and mint.',
        '',
      ]
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The signer account that is authorized to perform the deposit instruction.',
            'This is the account that perform the deposit.',
          ]
          writable: true
          signer: true
        },
        {
          name: 'userTradeDetail'
          docs: [
            'The trade detail PDA that contains the trade information.',
            'This PDA will be initialized by the instruction.',
          ]
          writable: true
        },
        {
          name: 'ephemeralAccount'
          writable: true
          signer: true
        },
        {
          name: 'nonceCheckAccount'
          docs: ['This PDA will be initialized by the instruction.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [110, 111, 110, 99, 101]
              },
              {
                kind: 'account'
                path: 'ephemeralAccount'
              },
            ]
          }
        },
        {
          name: 'vault'
          docs: [
            'The trade vault PDA that corresponds to the trade.',
            'This PDA will be initialized by the instruction.',
          ]
          writable: true
        },
        {
          name: 'whitelistToken'
          docs: ['CHECK', 'The whitelist token PDA, only token has been whitelisted can be deposited']
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'depositArgs'
          type: {
            defined: {
              name: 'depositArgs'
            }
          }
        },
      ]
    },
    {
      name: 'init'
      docs: [
        'Initialize the program and some required accounts, setup [Config::admin] if needed',
        '',
        'This instruction is called after the program is deployed, and is authorized by only the upgrade authority,',
        '# Arguments',
        '* `ctx` - A [Context] of [Init] required for initialization',
        '* `init_args` - An [InitArgs] required for initialization',
        '',
        '# Errors',
        '* [CustomError::Unauthorized] when the caller is not the upgrade authority.',
      ]
      discriminator: [220, 59, 207, 236, 108, 250, 47, 100]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The signer account that is authorized to perform the init instruction.',
            'Must be the upgrade authority.',
          ]
          writable: true
          signer: true
        },
        {
          name: 'vault'
          docs: ['The vault PDA account.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [118, 97, 117, 108, 116]
              },
            ]
          }
        },
        {
          name: 'protocol'
          docs: ['The protocol PDA account.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 114, 111, 116, 111, 99, 111, 108]
              },
            ]
          }
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
        {
          name: 'program'
          docs: ['The program account that contains the protocol program data.', 'Must be the program account.']
          address: 'E2pt2s1vZjgf1eBzWhe69qDWawdFKD2u4FbLEFijSMJP'
        },
        {
          name: 'programData'
          docs: [
            'The program data account that contains metadata about the program.',
            'Must be the program data account.',
          ]
        },
      ]
      args: [
        {
          name: 'initArgs'
          type: {
            defined: {
              name: 'initArgs'
            }
          }
        },
      ]
    },
    {
      name: 'payment'
      docs: [
        'The pmm perform the payment process to a specific trade.',
        '',
        'Only token that is set whitelisted can be deposited. The [PaymentReceipt] is created in this instruction.',
        '',
        '# Arguments',
        '* `ctx` - A [Context] of [PaymentAccounts] required for the payment.',
        '* `payment_args` - An argument [PaymentArgs] required for the payment.',
        '# Errors',
        '* [CustomError::NotWhitelistedToken] when the token is not whitelisted.',
        '* [CustomError::DeadlineExceeded] when the current timestamp is greater than the [PaymentArgs::deadline].',
        '* [CustomError::InvalidAmount] when the amount [PaymentArgs::amount] is less than the [PaymentArgs::total_fee].',
        '* [CustomError::InvalidMintKey] when the mint key is not match with the [PaymentReceipt::token].',
        '* [CustomError::InvalidSourceAta] when the source to transfer from is not the associated token account of the signer and mint.',
        '* [CustomError::InvalidDestinationAta] when the destination to transfer to is not the associated token account of the [PaymentReceipt::to_pubkey] and mint.',
        '* [CustomError::InvalidDestinationAta] when the destination to transfer to is not the associated token account of the protocol PDA and mint.',
      ]
      discriminator: [156, 226, 80, 91, 104, 252, 49, 142]
      accounts: [
        {
          name: 'signer'
          docs: ['The signer account who perform the payment.']
          writable: true
          signer: true
        },
        {
          name: 'toUser'
          docs: ['The account to which the payment sent to.']
          writable: true
        },
        {
          name: 'protocol'
          docs: ['The protocol PDA account to which the total fee will be sent.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 114, 111, 116, 111, 99, 111, 108]
              },
            ]
          }
        },
        {
          name: 'whitelistToken'
          docs: ['The whitelist token PDA, only token has been whitelisted can be payment.']
        },
        {
          name: 'paymentReceipt'
          docs: [
            'The payment receipt PDA that contains the payment information.',
            'This PDA will be initialized by the instruction.',
          ]
          writable: true
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'paymentArgs'
          type: {
            defined: {
              name: 'paymentArgs'
            }
          }
        },
      ]
    },
    {
      name: 'removeFeeReceiver'
      docs: [
        'Remove fee receiver.',
        '',
        'This instruction is authorized by the [Config::admin].',
        'This instruction close the [FeeReceiver] account, and transfer rent fee to the signer.',
        '# Arguments',
        '* `ctx` - A [Context] of [RemoveFeeReceiver] required for removing the fee receiver.',
        '* `receiver_pubkey` - The pubkey of the fee receiver.',
        '# Errors',
        '* [CustomError::Unauthorized] - The caller is not authorized, or not the admin.',
      ]
      discriminator: [137, 155, 52, 88, 218, 163, 184, 76]
      accounts: [
        {
          name: 'signer'
          docs: [
            'The admin that is authorized to perform the remove fee receiver instruction.',
            'Must be the [Config::admin]',
          ]
          writable: true
          signer: true
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'feeReceiverAccount'
          docs: [
            'The fee receiver PDA account that contains the fee receiver information.',
            'Will be closed and transferred rent fee to the signer.',
          ]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [102, 101, 101, 95, 114, 101, 99, 101, 105, 118, 101, 114]
              },
              {
                kind: 'arg'
                path: 'receiverPubkey'
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'receiverPubkey'
          type: 'pubkey'
        },
      ]
    },
    {
      name: 'removeWhitelist'
      docs: [
        'Remove whitelist token setup.',
        '',
        'This instruction is authorized by the operator.',
        '# Arguments',
        '* `ctx` - A [Context] of [RemoveWhitelist] required for removing the whitelist.',
        '# Errors',
        '* [CustomError::Unauthorized] - The caller is not authorized, or not the operator.',
      ]
      discriminator: [148, 244, 73, 234, 131, 55, 247, 90]
      accounts: [
        {
          name: 'operator'
          docs: [
            'The operator that is authorized to perform the remove whitelist instruction.',
            'Must be the [Config::operators]',
          ]
          writable: true
          signer: true
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'whitelistToken'
          docs: [
            'The whitelist token PDA account that contains the whitelist token information.',
            'If SOL native, used WSOL PDA account.',
          ]
          writable: true
        },
        {
          name: 'token'
          docs: ['The mint token account that we want to remove whitelist.']
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: []
    },
    {
      name: 'setCloseWaitDuration'
      docs: [
        'Set the waiting duration for closing a finished trade or close a payment receipt.',
        '',
        'This instruction is authorized by the [Config::operators].',
        '# Arguments',
        '* `ctx` - A [Context] of [SetCloseWaitDuration] required for setting the waiting duration.',
        '* `set_close_wait_duration_args` - An argument [SetCloseWaitDurationArgs] required for setting the waiting duration.',
        '# Errors',
        '* [CustomError::Unauthorized] when the caller is not authorized.',
      ]
      discriminator: [14, 233, 71, 143, 55, 182, 177, 231]
      accounts: [
        {
          name: 'operator'
          docs: [
            'The operator that is authorized to perform the set close wait duration instruction.',
            'Must be [Config::operators]',
          ]
          writable: true
          signer: true
        },
        {
          name: 'config'
          docs: ['The config PDA account that contains the protocol configuration.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'setCloseWaitDurationArgs'
          type: {
            defined: {
              name: 'setCloseWaitDurationArgs'
            }
          }
        },
      ]
    },
    {
      name: 'setTotalFee'
      docs: [
        'Set the total fee for a specific trade.',
        '',
        'This instruction is authorized by [TradeDetail::mpc_pubkey]. This fee is deducted from the [TradeDetail::amount] when settling.',
        '# Arguments',
        '* `ctx` - A [Context] of [SetTotalFee] required for setting the total fee.',
        '* `set_total_fee_args` - An argument [SetTotalFeeArgs] required for setting the total fee.',
        '# Errors',
        '* [CustomError::Unauthorized] when the caller is not authorized, or not the mpc of the trade.',
        '* [CustomError::TimeOut] when the trade timeout is expired, so we cannot set the total fee anymore.',
      ]
      discriminator: [4, 250, 240, 112, 5, 249, 79, 109]
      accounts: [
        {
          name: 'signer'
          docs: ['The signer account who is authorized to set the total fee.', 'Must be the [TradeDetail::mpc_pubkey].']
          writable: true
          signer: true
        },
        {
          name: 'userTradeDetail'
          docs: ['The user trade detail account that contains the trade information.']
          writable: true
        },
      ]
      args: [
        {
          name: 'setTotalFeeArgs'
          type: {
            defined: {
              name: 'setTotalFeeArgs'
            }
          }
        },
      ]
    },
    {
      name: 'settlement'
      docs: [
        'MPC settles the trade, tranfer the settlement amount to the pmm and the total fee to the protocol, after the pmm paid to users.',
        '',
        'This instruction is authorized by both the [TradeDetail::mpc_pubkey] and the [TradeDetail::user_ephemeral_pubkey].',
        'This instruction is called after the pmm paid to users, and before the [TradeDetail::timeout].',
        'This instruction close the [NonceCheckAccount], transfer rent fee to [TradeDetail::user_pubkey], and allow the nonce can be used by other trade.',
        '# Arguments',
        '* `ctx` - A [Context] of [SettlementAccounts] required for settling the trade.',
        '* `payment_args` - An argument [SettlementArgs] required for settling the trade.',
        '# Errors',
        '* [CustomError::Unauthorized] when the caller is not authorized by both [TradeDetail::mpc_pubkey] and [TradeDetail::user_ephemeral_pubkey].',
        '* [CustomError::InvalidUserAccount] when the user account is not match with [TradeDetail::user_pubkey].',
        '* [CustomError::InvalidRefundPubkey] when the refund pubkey is not match with [TradeDetail::refund_pubkey].',
        '* [CustomError::TimeOut] when the trade timeout is expired, so we cannot settle the trade anymore.',
        '* [CustomError::InvalidTradeStatus] when the trade status is not [TradeStatus::Deposited]. We only can settle the trade has deposited status.',
        '* [CustomError::InvalidMintKey] when the mint key is not match with the mint of the trade.',
        '* [CustomError::InvalidSourceAta] when the source to transfer from is not the associated token account of the vault and mint.',
        '* [CustomError::InvalidDestinationAta] when the destination to transfer settlement amount is not the associated token account of the pmm and mint.',
        '* [CustomError::InvalidDestinationAta] when the destination to transfer total fee is not the associated token account of the protocol and mint.',
      ]
      discriminator: [128, 21, 174, 60, 47, 86, 130, 108]
      accounts: [
        {
          name: 'signer'
          docs: ['The signer who is authorized to settle the trade.', 'Must be the [TradeDetail::mpc_pubkey]']
          writable: true
          signer: true
        },
        {
          name: 'userAccount'
          docs: [
            'The user account that is the depositor of the trade. This account will receive the rent fee of the nonce check account PDA.',
            'Must be the [TradeDetail::user_pubkey].',
          ]
          writable: true
        },
        {
          name: 'userEphemeralAccount'
          docs: [
            'The user ephemeral account of the trade, need to sign this transaction too.',
            'Must be the [TradeDetail::user_ephemeral_pubkey].',
          ]
          signer: true
        },
        {
          name: 'userTradeDetail'
          docs: ['The user trade detail PDA that contains the trade information.']
          writable: true
        },
        {
          name: 'nonceCheckAccount'
          docs: [
            'The nonce check account PDA, used to check the nonce account is being used by another trade, or not yet closed.',
            'This PDA will be closed by the instruction.',
          ]
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [110, 111, 110, 99, 101]
              },
              {
                kind: 'account'
                path: 'userEphemeralAccount'
              },
            ]
          }
        },
        {
          name: 'vault'
          docs: ['The trade vault PDA that corresponds to the trade.']
          writable: true
        },
        {
          name: 'refundAccount'
          docs: ['The refund account of the trade.', 'Must be the [TradeDetail::refund_pubkey].']
          writable: true
        },
        {
          name: 'protocol'
          docs: ['The protocol PDA account.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 114, 111, 116, 111, 99, 111, 108]
              },
            ]
          }
        },
        {
          name: 'pmm'
          docs: ['The pmm account.']
          writable: true
        },
        {
          name: 'systemProgram'
          docs: ['System program.']
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'settleArgs'
          type: {
            defined: {
              name: 'settlementArgs'
            }
          }
        },
      ]
    },
    {
      name: 'withdrawTotalFee'
      docs: [
        'Withdraw the total fee of the protocol to fee receiver.',
        '',
        'This instruction is authorized by anyone.',
        'However, only account decaled as [FeeReceiver] can receive the fee.',
        '# Arguments',
        '* `ctx` - A [Context] of [WithdrawTotalFeeAccounts] required for withdrawing the total fee.',
        '* `withdraw_total_fee_args` - An argument [WithdrawTotalFeeArgs] required for withdrawing the total fee.',
        '# Errors',
        '* [CustomError::Unauthorized] - The caller is not authorized, or not the admin.',
      ]
      discriminator: [39, 248, 168, 154, 219, 50, 222, 110]
      accounts: [
        {
          name: 'signer'
          docs: ['The signer account who perform the withdraw total fee.', 'Can be anyone']
          writable: true
          signer: true
        },
        {
          name: 'toUser'
          docs: ['The account to which the total fee will be sent. Must be decaled as a [FeeReceiver].']
          writable: true
        },
        {
          name: 'feeReceiver'
          docs: ['The fee receiver PDA account that contains the fee receiver information.']
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [102, 101, 101, 95, 114, 101, 99, 101, 105, 118, 101, 114]
              },
              {
                kind: 'account'
                path: 'toUser'
              },
            ]
          }
        },
        {
          name: 'protocol'
          docs: ['The protocol PDA account which own the protocol fee.']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [112, 114, 111, 116, 111, 99, 111, 108]
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'withdrawTotalFeeArgs'
          type: {
            defined: {
              name: 'withdrawTotalFeeArgs'
            }
          }
        },
      ]
    },
  ]
  accounts: [
    {
      name: 'config'
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130]
    },
    {
      name: 'feeReceiver'
      discriminator: [217, 123, 124, 75, 212, 179, 171, 135]
    },
    {
      name: 'nonceCheckAccount'
      discriminator: [191, 217, 36, 242, 192, 98, 193, 237]
    },
    {
      name: 'paymentReceipt'
      discriminator: [168, 198, 209, 4, 60, 235, 126, 109]
    },
    {
      name: 'tradeDetail'
      discriminator: [241, 58, 83, 75, 150, 155, 85, 205]
    },
    {
      name: 'tradeVault'
      discriminator: [233, 99, 74, 124, 61, 226, 5, 175]
    },
    {
      name: 'whitelistToken'
      discriminator: [179, 42, 207, 134, 155, 42, 77, 114]
    },
  ]
  events: [
    {
      name: 'claimed'
      discriminator: [217, 192, 123, 72, 108, 150, 248, 33]
    },
    {
      name: 'deposited'
      discriminator: [111, 141, 26, 45, 161, 35, 100, 57]
    },
    {
      name: 'paymentTransferred'
      discriminator: [206, 116, 224, 136, 100, 105, 246, 173]
    },
    {
      name: 'settled'
      discriminator: [232, 210, 40, 17, 142, 124, 145, 238]
    },
  ]
  errors: [
    {
      code: 6000
      name: 'invalidTradeId'
    },
    {
      code: 6001
      name: 'invalidTimeout'
    },
    {
      code: 6002
      name: 'unauthorized'
    },
    {
      code: 6003
      name: 'invalidPublicKey'
    },
    {
      code: 6004
      name: 'depositZeroAmount'
    },
    {
      code: 6005
      name: 'invalidAmount'
    },
    {
      code: 6006
      name: 'invalidMintKey'
    },
    {
      code: 6007
      name: 'invalidSourceAta'
    },
    {
      code: 6008
      name: 'invalidDestinationAta'
    },
    {
      code: 6009
      name: 'timeOut'
    },
    {
      code: 6010
      name: 'invalidRefundPubkey'
    },
    {
      code: 6011
      name: 'claimNotAvailable'
    },
    {
      code: 6012
      name: 'deadlineExceeded'
    },
    {
      code: 6013
      name: 'invalidUserAccount'
    },
    {
      code: 6014
      name: 'nonceAccountBeingUsed'
    },
    {
      code: 6015
      name: 'operatorAlreadyExists'
    },
    {
      code: 6016
      name: 'operatorNotFound'
    },
    {
      code: 6017
      name: 'operatorLimitReached'
    },
    {
      code: 6018
      name: 'notWhitelistedToken'
    },
    {
      code: 6019
      name: 'invalidTradeStatus'
    },
    {
      code: 6020
      name: 'closeNotAvailable'
    },
    {
      code: 6021
      name: 'invalidTokenAccount'
    },
    {
      code: 6022
      name: 'invalidTotalFee'
    },
    {
      code: 6023
      name: 'invalidFeeReceiver'
    },
    {
      code: 6024
      name: 'amountExceeds'
    },
  ]
  types: [
    {
      name: 'claimArgs'
      docs: ['Parameters required for the claim function.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['The tradeId, unique identifier for the trade.']
            type: {
              array: ['u8', 32]
            }
          },
        ]
      }
    },
    {
      name: 'claimed'
      docs: [
        '- @dev Event emitted when a user successfully claims the deposit after timeout\n    - Related function: claim()',
      ]
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'token'
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'toPubkey'
            type: 'pubkey'
          },
          {
            name: 'operator'
            type: 'pubkey'
          },
          {
            name: 'amount'
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'closeFinishedTradeArgs'
      docs: ['Parameters rquired for the deposit function.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['The tradeId, unique identifier for the trade.']
            type: {
              array: ['u8', 32]
            }
          },
        ]
      }
    },
    {
      name: 'config'
      docs: ['The config PDA account that contains the protocol configuration.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'reserve'
            docs: ['The reserve field space, used to upgrade in the future.']
            type: {
              array: ['u128', 7]
            }
          },
          {
            name: 'admin'
            docs: ['The admin account of the protocol. Set by the upgrade authority. Used to manage the operators.']
            type: 'pubkey'
          },
          {
            name: 'closeTradeDuration'
            docs: ['The duration for closing a finished trade.']
            type: 'u64'
          },
          {
            name: 'closePaymentDuration'
            docs: ['The duration for closing a payment receipt.']
            type: 'u64'
          },
          {
            name: 'operators'
            docs: [
              'The operators of the protocol. Set by the admin. Used to manage close wait time and whitelist token.',
            ]
            type: {
              vec: 'pubkey'
            }
          },
        ]
      }
    },
    {
      name: 'depositArgs'
      docs: ['Parameters rquired for the deposit function']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'input'
            docs: ['Input trade information.']
            type: {
              defined: {
                name: 'tradeInput'
              }
            }
          },
          {
            name: 'data'
            docs: ['Detailed trade data.']
            type: {
              defined: {
                name: 'tradeDetailInput'
              }
            }
          },
          {
            name: 'tradeId'
            docs: ['The tradeId, unique identifier for the trade.']
            type: {
              array: ['u8', 32]
            }
          },
        ]
      }
    },
    {
      name: 'deposited'
      docs: ['- @dev Event emitted when a user successfully deposits tokens or SOL\n    - Related function: deposit()']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'fromPubkey'
            type: 'pubkey'
          },
          {
            name: 'token'
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'amount'
            type: 'u64'
          },
          {
            name: 'vault'
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'feeReceiver'
      docs: ['The fee receiver PDA account that contains the fee receiver information.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'receiver'
            docs: ['The pubkey of the fee receiver.']
            type: 'pubkey'
          },
          {
            name: 'reserve'
            docs: ['The reserve of the fee receiver, used for future use.']
            type: {
              array: ['u128', 4]
            }
          },
        ]
      }
    },
    {
      name: 'initArgs'
      docs: ['Parameters required for the init function.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'admin'
            docs: ['The admin of the protocol. If this is not none, the instruction will set the admin.']
            type: {
              option: 'pubkey'
            }
          },
        ]
      }
    },
    {
      name: 'nonceCheckAccount'
      docs: ['The nonce check PDA account that contains the nonce check information.']
      type: {
        kind: 'struct'
        fields: []
      }
    },
    {
      name: 'paymentArgs'
      docs: ['Parameters rquired for the payment instruction.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['Unique identifier for the trade.']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'token'
            docs: ['Token public key for SPL token payments, none if SOL payment.']
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'amount'
            docs: ['Amount to be transferred.']
            type: 'u64'
          },
          {
            name: 'totalFee'
            docs: ['Total fee to be deducted from the amount, and transferred to the protocol.']
            type: 'u64'
          },
          {
            name: 'deadline'
            docs: ['Deadline for the payment transaction.']
            type: 'i64'
          },
        ]
      }
    },
    {
      name: 'paymentReceipt'
      docs: ['The payment receipt PDA account that contains the payment receipt information.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['The trade id of the payment receipt.']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'fromPubkey'
            docs: ['The from pubkey of the payment receipt. Who paid the payment.']
            type: 'pubkey'
          },
          {
            name: 'toPubkey'
            docs: ['The to pubkey of the payment receipt. Who received the payment.']
            type: 'pubkey'
          },
          {
            name: 'token'
            docs: ['The token of the payment receipt. None if the payment is SOL.']
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'paymentAmount'
            docs: ['The payment amount of the payment receipt, included fee, with decimals.']
            type: 'u64'
          },
          {
            name: 'totalFee'
            docs: ['The total fee of the payment receipt, with decimals.']
            type: 'u64'
          },
          {
            name: 'paymentTime'
            docs: ['The time that the payment is made.']
            type: 'u64'
          },
          {
            name: 'reserve'
            docs: ['The reserve field space, used to upgrade in the future.']
            type: {
              array: ['u128', 8]
            }
          },
        ]
      }
    },
    {
      name: 'paymentTransferred'
      docs: ['- @dev Event emitted when PMM successfully settle the payment\n    - Related function: payment();']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'fromPubkey'
            type: 'pubkey'
          },
          {
            name: 'toPubkey'
            type: 'pubkey'
          },
          {
            name: 'token'
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'paymentAmount'
            type: 'u64'
          },
          {
            name: 'totalFee'
            type: 'u64'
          },
          {
            name: 'protocol'
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'setCloseWaitDurationArgs'
      docs: ['Parameters required for setting the close wait duration.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'closeTradeDuration'
            docs: [
              'The waiting duration for closing a finished trade [Config::close_trade_duration].',
              'If it is none, the close_trade_duratin will not changed.',
            ]
            type: {
              option: 'u64'
            }
          },
          {
            name: 'closePaymentDuration'
            docs: [
              'The waiting duration for closing a payment receipt [Config::close_payment_duration].',
              'If it is none, the close_payment_duration will not changed.',
            ]
            type: {
              option: 'u64'
            }
          },
        ]
      }
    },
    {
      name: 'setTotalFeeArgs'
      docs: ['Parameters rquired for setting the total fee']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['Unique identifier for the trade']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'amount'
            docs: ['Amount of the protocol fee']
            type: 'u64'
          },
        ]
      }
    },
    {
      name: 'settled'
      docs: ['- @dev Event emitted when MPC successfully settles the trade\n    - Related function: settlement()']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'operator'
            type: 'pubkey'
          },
          {
            name: 'toPubkey'
            type: 'pubkey'
          },
          {
            name: 'token'
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'settlementAmount'
            type: 'u64'
          },
          {
            name: 'totalFee'
            type: 'u64'
          },
          {
            name: 'vault'
            type: 'pubkey'
          },
          {
            name: 'protocol'
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'settlementArgs'
      docs: ['Parameters rquired for the settlement function']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['The tradeId, unique identifier for the trade']
            type: {
              array: ['u8', 32]
            }
          },
        ]
      }
    },
    {
      name: 'tradeDetail'
      docs: ['The trade detail PDA account that contains the trade detail information.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'tradeId'
            docs: ['The trade id of the trade, unique identifier for the trade.']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'userPubkey'
            docs: ['The depositor of the trade, who is performed the trade.']
            type: 'pubkey'
          },
          {
            name: 'token'
            docs: ['The token of the trade. None if the trade is SOL.']
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'amount'
            docs: ['The amount of the trade, with decimals.']
            type: 'u64'
          },
          {
            name: 'timeout'
            docs: ['The timeout of the trade. After this time, the trade cannot be settled, only claimed.']
            type: 'i64'
          },
          {
            name: 'mpcPubkey'
            docs: ['The mpc of the trade, who is authorized to settle the trade.']
            type: 'pubkey'
          },
          {
            name: 'userEphemeralPubkey'
            docs: ['The ephemeral pubkey of the trade.']
            type: 'pubkey'
          },
          {
            name: 'refundPubkey'
            docs: ['The refund pubkey of the trade. This address will receive the amount when the trade is claimed.']
            type: 'pubkey'
          },
          {
            name: 'totalFee'
            docs: ['The total fee of the trade, with decimals.']
            type: {
              option: 'u64'
            }
          },
          {
            name: 'status'
            docs: ['The status of the trade.']
            type: {
              defined: {
                name: 'tradeStatus'
              }
            }
          },
          {
            name: 'settledPmm'
            docs: ['The pmm that settled the trade.']
            type: 'pubkey'
          },
          {
            name: 'reserve'
            docs: ['The reserve space, used to upgrade in the future.']
            type: {
              array: ['u128', 8]
            }
          },
        ]
      }
    },
    {
      name: 'tradeDetailInput'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'timeout'
            type: 'i64'
          },
          {
            name: 'mpcPubkey'
            type: 'pubkey'
          },
          {
            name: 'refundPubkey'
            type: 'pubkey'
          },
        ]
      }
    },
    {
      name: 'tradeInfo'
      docs: ['The trade information, contains the information about the origin and destination of the trade.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'amountIn'
            docs: ['The amount in of the trade.']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'fromChain'
            docs: ['Encode the origin chain information: The user_address, the network_id, the token_address.']
            type: {
              array: ['bytes', 3]
            }
          },
          {
            name: 'toChain'
            docs: ['Encode the destination chain information: The user_address, the network_id, the token_address.']
            type: {
              array: ['bytes', 3]
            }
          },
        ]
      }
    },
    {
      name: 'tradeInput'
      docs: ['The trade input when depositting. Contains required information for the trade.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'sessionId'
            docs: ['The sessionId, unique identifier for the trade.']
            type: {
              array: ['u8', 32]
            }
          },
          {
            name: 'solver'
            docs: ['The solver address, the address of the solver.']
            type: {
              array: ['u8', 20]
            }
          },
          {
            name: 'tradeInfo'
            docs: ['The trade information, contains the information about the origin and destination of the trade.']
            type: {
              defined: {
                name: 'tradeInfo'
              }
            }
          },
        ]
      }
    },
    {
      name: 'tradeStatus'
      docs: ['The trade status of the trade.']
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'deposited'
          },
          {
            name: 'settled'
          },
          {
            name: 'claimed'
          },
        ]
      }
    },
    {
      name: 'tradeVault'
      type: {
        kind: 'struct'
        fields: []
      }
    },
    {
      name: 'whitelistToken'
      docs: ['The whitelist token PDA account that contains the whitelist token information.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'token'
            docs: ['The token of the whitelist token.', 'Whitelist for SOL use WSOL Pubkey.']
            type: 'pubkey'
          },
          {
            name: 'amount'
            docs: ['The minimum amount of the whitelist token.']
            type: 'u64'
          },
          {
            name: 'reserve'
            docs: ['The reserve field space, used to upgrade in the future.']
            type: {
              array: ['u128', 4]
            }
          },
        ]
      }
    },
    {
      name: 'withdrawTotalFeeArgs'
      docs: ['Parameters required for the withdraw total fee instruction.']
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'token'
            docs: ['Token public key for SPL token payments, none if SOL payment.']
            type: {
              option: 'pubkey'
            }
          },
          {
            name: 'amount'
            docs: ['Amount to be transferred.']
            type: 'u64'
          },
        ]
      }
    },
  ]
}
