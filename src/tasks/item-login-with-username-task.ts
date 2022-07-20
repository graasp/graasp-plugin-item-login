// global
import {
  Actor,
  DatabaseTransactionHandler,
  ItemMembershipService,
  ItemService,
  Member,
  MemberService,
  TaskStatus,
} from '@graasp/sdk';

// local
import { ItemLoginService } from '../db-service';
import { ItemLoginMemberExtra } from '../interfaces/item-login';
import { encryptPassword, generateRandomEmail } from '../util/aux';
import { ItemLoginWithTask } from './item-login-with-task';

export class ItemLoginWithUsernameTask extends ItemLoginWithTask {
  get name(): string {
    return ItemLoginWithUsernameTask.name;
  }
  private credentials: { username: string; password?: string };

  constructor(
    actor: Actor,
    itemId: string,
    credentials: { username: string; password?: string },
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
    const { username, password } = this.credentials;

    // TODO: what if there's two bond members w/ the same username? options:
    // - fail login if there's already another user w/ the same username;
    // - keep a 'username' per space by adding a column to 'item_member_login'
    //
    // check if member w/ memberId is present
    let bondMember = itemMembers.find(({ name }) => name === username);

    if (bondMember) {
      const {
        id,
        extra: { itemLogin },
      } = bondMember;
      await this.validateCredentials(id, password, itemLogin, handler);
    } else {
      // create member w/ `username`
      const data: Partial<Member<ItemLoginMemberExtra>> = {
        name: username,
        email: generateRandomEmail(),
        extra: { itemLogin: { password: null } },
      };

      if (password) data.extra.itemLogin.password = await encryptPassword(password);

      const member = await this.memberService.create(data, handler);
      const {
        id,
        name,
        extra: { itemLogin },
      } = member;

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
