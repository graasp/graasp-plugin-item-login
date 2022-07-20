// global
import { Actor, DatabaseTransactionHandler, ItemService, TaskStatus } from '@graasp/sdk';

// local
import { ItemLoginExtra, ItemLoginSchema } from '../interfaces/item-login';
import { ItemNotFound } from '../util/graasp-item-login-error';
import { BaseItemLoginTask } from './base-item-login-task';

export class GetItemLoginSchemaTask extends BaseItemLoginTask<{ loginSchema: ItemLoginSchema }> {
  get name(): string {
    return GetItemLoginSchemaTask.name;
  }
  private itemService: ItemService;

  constructor(actor: Actor, itemId: string, itemService: ItemService) {
    super(actor, null, null);
    this.targetId = itemId;
    this.itemService = itemService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    // get item
    const item = await this.itemService.get<ItemLoginExtra>(this.targetId, handler);
    if (!item) throw new ItemNotFound(this.targetId);

    const {
      extra: { itemLogin: { loginSchema } = {} },
    } = item;

    this._result = { loginSchema };
    this.status = TaskStatus.OK;
  }
}
