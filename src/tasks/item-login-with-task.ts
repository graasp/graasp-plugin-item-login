// global
import { DatabaseTransactionHandler, Item, ItemMembershipService } from '@graasp/sdk';
import { Actor, ItemService, MemberService } from '@graasp/sdk';

import { ItemLoginService } from '../db-service';
import { ItemLoginMemberExtra, ItemLoginSchema } from '../interfaces/item-login';
import { encryptPassword, loginSchemaRequiresPassword, validatePassword } from '../util/aux';
// local
import {
  InvalidCredentials,
  ItemNotFound,
  MissingCredentialsForLoginSchema,
  MissingItemLoginSchema,
  MissingItemLoginTag,
  UnnecessaryCredentialsForLoginSchema,
} from '../util/graasp-item-login-error';
import { BaseItemLoginTask } from './base-item-login-task';

export abstract class ItemLoginWithTask extends BaseItemLoginTask<{
  id: string;
  name: string;
  hasMembership: boolean;
  item: Item;
}> {
  get name(): string {
    return ItemLoginWithTask.name;
  }
  private passwordProvided: boolean;
  protected itemService: ItemService;
  protected loginSchema: ItemLoginSchema;
  protected itemMembershipService: ItemMembershipService;
  protected targetItem: Item;

  constructor(
    actor: Actor,
    itemId: string,
    passwordProvided: boolean,
    itemLoginService: ItemLoginService,
    itemService: ItemService,
    memberService: MemberService,
    itemMembershipService: ItemMembershipService,
  ) {
    super(actor, itemLoginService, memberService);
    this.itemLoginService = itemLoginService;
    this.itemService = itemService;
    this.memberService = memberService;
    this.itemMembershipService = itemMembershipService;
    this.targetId = itemId;
    this.passwordProvided = passwordProvided;
  }

  async validateAndGetBondedMembers(
    handler: DatabaseTransactionHandler,
  ): Promise<{ id: string; name: string; extra: ItemLoginMemberExtra }[]> {
    // get item
    const item = await this.itemService.get(this.targetId, handler);
    if (!item) throw new ItemNotFound(this.targetId);
    this.targetItem = item;

    // check item for the necessary tag
    const itemDetails = await this.itemLoginService.getDetailsOfItemWithTheTag(item, handler);
    if (!itemDetails) throw new MissingItemLoginTag();

    // fail (unexpected) if there's no item-login specific "extras"
    const {
      extra: { itemLogin: { loginSchema } = {} },
    } = itemDetails;
    if (!loginSchema) throw new MissingItemLoginSchema();

    this.loginSchema = loginSchema;

    // check for missing credentials agaisnt the login schema
    if (loginSchemaRequiresPassword(loginSchema) && !this.passwordProvided) {
      throw new MissingCredentialsForLoginSchema(loginSchema);
    } else if (!loginSchemaRequiresPassword(loginSchema) && this.passwordProvided) {
      throw new UnnecessaryCredentialsForLoginSchema(loginSchema);
    }

    // get members 'bonded' to item
    return await this.itemLoginService.getItemMembers(item, handler);
  }

  async validateCredentials(
    memberId: string,
    password: string,
    memberItemLogin: { password: string },
    handler: DatabaseTransactionHandler,
  ): Promise<void> {
    if (loginSchemaRequiresPassword(this.loginSchema)) {
      if (memberItemLogin.password) {
        const passwordOk = await validatePassword(password, memberItemLogin.password);
        if (!passwordOk) throw new InvalidCredentials();
      } else {
        // schema was modified from passwordless to '* + password' - update member with password
        const passwordHash = await encryptPassword(password);
        const data = { extra: { itemLogin: { password: passwordHash } } };
        await this.memberService.update(memberId, data, handler);
      }
    }
  }
}
