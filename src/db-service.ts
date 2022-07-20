import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

import { Item } from '@graasp/sdk';

import { ItemLoginExtra, ItemLoginMemberExtra } from './interfaces/item-login';

export class ItemLoginService {
  private tagId: string;

  constructor(itemLoginTagId: string) {
    this.tagId = itemLoginTagId;
  }

  /**
   * Create item-member bond in 'item_member_login' table
   * @param itemId Item id
   * @param memberId Member id
   * @param transactionHandler Database transaction handler
   */
  async create(itemId: string, memberId: string, transactionHandler: TrxHandler): Promise<void> {
    await transactionHandler.query(sql`
        INSERT INTO item_member_login (item_id, member_id)
        VALUES (${itemId}, ${memberId})
      `);
  }

  /**
   * Get `id`+`extra` of given `item` with the 'item-login' tag
   * @param item Item
   * @param transactionHandler Database transaction handler
   */
  async getDetailsOfItemWithTheTag(
    item: Item,
    transactionHandler: TrxHandler,
  ): Promise<{ id: string; extra: ItemLoginExtra }> {
    return transactionHandler.maybeOne(sql`
        SELECT item.id AS "id", extra
          FROM item
        INNER JOIN item_tag
          ON item.path = item_tag.item_path
        WHERE item_path = ${item.path}
          AND tag_id = ${this.tagId}
      `);
  }

  /**
   * Get members that are 'bonded' to the given item
   * @param item Item
   * @param transactionHandler Database transaction handler
   */
  async getItemMembers(
    item: Item,
    transactionHandler: TrxHandler,
  ): Promise<{ id: string; name: string; extra: ItemLoginMemberExtra }[]> {
    return (
      transactionHandler
        .query<{ id: string; name: string; extra: ItemLoginMemberExtra }>(
          sql`
        SELECT member.id AS "id",
            member.name AS "name",
            member.extra AS "extra"
          FROM member
        INNER JOIN item_member_login
          ON member.id = item_member_login.member_id
        WHERE item_member_login.item_id = ${item.id}
      `,
        )
        // TODO: is there a better way?
        .then(({ rows }) => rows.slice(0))
    );
  }

  /**
   * Get member that is 'bonded' to the given item and has name `username`
   * @param item Item
   * @param username Username
   * @param transactionHandler Database transaction handler
   */
  // async getItemMember(item: Item, username: string, transactionHandler: TrxHandler):
  //   Promise<Partial<Member<ItemMemberExtra>>> {
  //   return transactionHandler.maybeOne(sql`
  //       SELECT member.id AS "id",
  //           member.name AS "name",
  //           member.extra AS "extra"
  //         FROM member
  //       INNER JOIN item_member_login
  //         ON member.id = item_member_login.member_id
  //       WHERE item_member_login.item_id = ${item.id}
  //         AND member.name = ${username}
  //     `);
  // }
}
