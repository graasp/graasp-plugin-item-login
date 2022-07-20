// global
import {
  Actor,
  DatabaseTransactionHandler,
  ItemMembershipService,
  ItemService,
  MemberService,
  TaskStatus,
} from '@graasp/sdk';

import { ItemLoginService } from '../db-service';
import { ItemLoginMemberExtra } from '../interfaces/item-login';
// local
import { InvalidMember, MemberIdentifierNotFound } from '../util/graasp-item-login-error';
import { ItemLoginWithTask } from './item-login-with-task';

export class ItemLoginWithMemberIdTask extends ItemLoginWithTask {
  get name(): string {
    return ItemLoginWithMemberIdTask.name;
  }
  private credentials: { memberId: string; password?: string };

  constructor(
    actor: Actor,
    itemId: string,
    credentials: { memberId: string; password?: string },
    itemLoginService: ItemLoginService,
    itemService: ItemService,
    memberService: MemberService,
    itemMembershipService: ItemMembershipService,
  ) {
    super(
      actor,
      itemId,
      Boolean(credentials.password),
      itemLoginService,
      itemService,
      memberService,
      itemMembershipService,
    );
    this.credentials = credentials;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    // initial validation and get members 'bonded' to item
    const itemMembers = await this.validateAndGetBondedMembers(handler);
    const { memberId, password } = this.credentials;

    // check if member w/ memberId is present
    let bondMember = itemMembers.find(({ id }) => id === memberId);

    if (bondMember) {
      const {
        id,
        extra: { itemLogin },
      } = bondMember;
      await this.validateCredentials(id, password, itemLogin, handler);
    } else {
      // member w/ `memberId` needs to exist
      const member = await this.memberService.get<ItemLoginMemberExtra>(memberId, handler);
      if (!member) throw new MemberIdentifierNotFound(memberId);

      const {
        id,
        name,
        extra: { itemLogin },
      } = member;

      // possibly using a memberId of a "normally" registered graasp member
      if (!itemLogin) throw new InvalidMember(memberId);

      await this.validateCredentials(id, password, itemLogin, handler);

      // bond member to this item
      await this.itemLoginService.create(this.targetId, id, handler);

      bondMember = { id, name, extra: { itemLogin } };
    }

    const { id, name } = bondMember;
    const hasMembership = await this.itemMembershipService.canRead(id, this.targetItem, handler);

    this._result = { id, name, hasMembership, item: this.targetItem };
    this.status = TaskStatus.OK;
  }
}
