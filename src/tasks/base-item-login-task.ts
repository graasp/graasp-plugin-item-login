// global
import { FastifyLoggerInstance } from 'fastify';

import {
  Actor,
  DatabaseTransactionHandler,
  IndividualResultType,
  MemberService,
} from '@graasp/sdk';
import { Task, TaskStatus } from '@graasp/sdk';

// local
import { ItemLoginService } from '../db-service';

export abstract class BaseItemLoginTask<R> implements Task<Actor, R> {
  protected memberService: MemberService;
  protected itemLoginService: ItemLoginService;
  protected _result: R;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  data: Partial<IndividualResultType<R>>;

  constructor(actor: Actor, itemLoginService: ItemLoginService, memberService: MemberService) {
    this.actor = actor;
    this.itemLoginService = itemLoginService;
    this.memberService = memberService;
    this.status = TaskStatus.NEW;
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  abstract run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | BaseItemLoginTask<R>[]>;
}
