// global
import {
  DatabaseTransactionHandler,
  ItemMembershipService,
  ItemService,
  Member,
  TaskStatus,
} from '@graasp/sdk';

// local
import { ItemLoginSchema } from '../interfaces/item-login';
import { ItemNotFound, MemberCannotAdminItem } from '../util/graasp-item-login-error';
import { BaseItemLoginTask } from './base-item-login-task';

export class UpdateItemLoginSchemaTask extends BaseItemLoginTask<{ loginSchema: ItemLoginSchema }> {
  get name(): string {
    return UpdateItemLoginSchemaTask.name;
  }
  private itemService: ItemService;
  private itemMembershipService: ItemMembershipService;
  private loginSchema: ItemLoginSchema;

  constructor(
    member: Member,
    itemId: string,
    loginSchema: ItemLoginSchema,
    itemService: ItemService,
    itemMembershipService: ItemMembershipService,
  ) {
    super(member, null, null);
    this.targetId = itemId;
    this.loginSchema = loginSchema;
    this.itemService = itemService;
    this.itemMembershipService = itemMembershipService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    // get item
    const item = await this.itemService.get(this.targetId, handler);
    if (!item) throw new ItemNotFound(this.targetId);

    // verify member rights over item
    const hasRights = await this.itemMembershipService.canAdmin(this.actor.id, item, handler);
    if (!hasRights) throw new MemberCannotAdminItem(this.targetId);

    const { id, extra } = item;
    const loginSchema = this.loginSchema;
    Object.assign(extra, { itemLogin: { loginSchema } });

    // save schema change
    await this.itemService.update(id, { extra }, handler);

    this._result = { loginSchema };
    this.status = TaskStatus.OK;
  }
}
