/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export interface PaymentInterface extends Interface {
  getFunction(
    nameOrSignature: "payment" | "protocol" | "setProtocol"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "PaymentTransferred" | "ProtocolUpdated"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "payment",
    values: [
      BytesLike,
      AddressLike,
      AddressLike,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(functionFragment: "protocol", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "setProtocol",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(functionFragment: "payment", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "protocol", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setProtocol",
    data: BytesLike
  ): Result;
}

export namespace PaymentTransferredEvent {
  export type InputTuple = [
    tradeId: BytesLike,
    from: AddressLike,
    to: AddressLike,
    pFeeAddr: AddressLike,
    token: AddressLike,
    payToUser: BigNumberish,
    totalFee: BigNumberish
  ];
  export type OutputTuple = [
    tradeId: string,
    from: string,
    to: string,
    pFeeAddr: string,
    token: string,
    payToUser: bigint,
    totalFee: bigint
  ];
  export interface OutputObject {
    tradeId: string;
    from: string;
    to: string;
    pFeeAddr: string;
    token: string;
    payToUser: bigint;
    totalFee: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ProtocolUpdatedEvent {
  export type InputTuple = [owner: AddressLike, newProtocol: AddressLike];
  export type OutputTuple = [owner: string, newProtocol: string];
  export interface OutputObject {
    owner: string;
    newProtocol: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface Payment extends BaseContract {
  connect(runner?: ContractRunner | null): Payment;
  waitForDeployment(): Promise<this>;

  interface: PaymentInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  payment: TypedContractMethod<
    [
      tradeId: BytesLike,
      token: AddressLike,
      toUser: AddressLike,
      amount: BigNumberish,
      totalFee: BigNumberish,
      deadline: BigNumberish
    ],
    [void],
    "payable"
  >;

  protocol: TypedContractMethod<[], [string], "view">;

  setProtocol: TypedContractMethod<
    [newProtocol: AddressLike],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "payment"
  ): TypedContractMethod<
    [
      tradeId: BytesLike,
      token: AddressLike,
      toUser: AddressLike,
      amount: BigNumberish,
      totalFee: BigNumberish,
      deadline: BigNumberish
    ],
    [void],
    "payable"
  >;
  getFunction(
    nameOrSignature: "protocol"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "setProtocol"
  ): TypedContractMethod<[newProtocol: AddressLike], [void], "nonpayable">;

  getEvent(
    key: "PaymentTransferred"
  ): TypedContractEvent<
    PaymentTransferredEvent.InputTuple,
    PaymentTransferredEvent.OutputTuple,
    PaymentTransferredEvent.OutputObject
  >;
  getEvent(
    key: "ProtocolUpdated"
  ): TypedContractEvent<
    ProtocolUpdatedEvent.InputTuple,
    ProtocolUpdatedEvent.OutputTuple,
    ProtocolUpdatedEvent.OutputObject
  >;

  filters: {
    "PaymentTransferred(bytes32,address,address,address,address,uint256,uint256)": TypedContractEvent<
      PaymentTransferredEvent.InputTuple,
      PaymentTransferredEvent.OutputTuple,
      PaymentTransferredEvent.OutputObject
    >;
    PaymentTransferred: TypedContractEvent<
      PaymentTransferredEvent.InputTuple,
      PaymentTransferredEvent.OutputTuple,
      PaymentTransferredEvent.OutputObject
    >;

    "ProtocolUpdated(address,address)": TypedContractEvent<
      ProtocolUpdatedEvent.InputTuple,
      ProtocolUpdatedEvent.OutputTuple,
      ProtocolUpdatedEvent.OutputObject
    >;
    ProtocolUpdated: TypedContractEvent<
      ProtocolUpdatedEvent.InputTuple,
      ProtocolUpdatedEvent.OutputTuple,
      ProtocolUpdatedEvent.OutputObject
    >;
  };
}
